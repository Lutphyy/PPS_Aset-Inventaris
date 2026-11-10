import { useState, useEffect } from 'react'
import { loansAPI } from '../utils/api'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusLabel = (s) => s?.replace(/_/g, ' ') || s

function Riwayat() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 25

  useEffect(() => {
    loansAPI.getMyLoans().then(res => { setLoans(res.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const statusBadge = (s) => {
    const colors = { DIKEMBALIKAN: { bg: '#e4f6f0', c: '#299579' }, TERLAMBAT: { bg: '#ffe9e7', c: '#df625d' }, DITOLAK: { bg: '#ffe9e7', c: '#df625d' }, MENUNGGU: { bg: '#fff4dd', c: '#d79b32' }, DISETUJUI: { bg: '#e9f0ff', c: '#527bd8' }, AKTIF: { bg: '#e9f0ff', c: '#527bd8' } }
    const cl = colors[s] || { bg: '#f0f0f0', c: '#666' }
    return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: cl.bg, color: cl.c }}>{statusLabel(s)}</span>
  }

  const totalPages = Math.ceil(loans.length / perPage)
  const safePage = Math.min(currentPage, totalPages || 1)
  const paginatedLoans = loans.slice((safePage - 1) * perPage, safePage * perPage)

  const renderPagination = () => {
    if (totalPages <= 1) return null
    const current = safePage
    const total = totalPages
    const pages = []
    if (current > 3) pages.push(1)
    if (current > 4) pages.push('...')
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i)
    if (current < total - 3) pages.push('...')
    if (current < total - 2) pages.push(total)
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #eee' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>Halaman {current} dari {total} ({loans.length} data)</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setCurrentPage(current - 1)} disabled={current <= 1}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: current <= 1 ? 'not-allowed' : 'pointer', opacity: current <= 1 ? 0.4 : 1 }}>
            ‹ Prev
          </button>
          {pages.map((p, i) =>
            p === '...' ? <span key={`e${i}`} style={{ padding: '5px 4px', fontSize: '12px', color: '#999' }}>…</span> : (
              <button key={p} onClick={() => setCurrentPage(p)}
                style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer',
                  background: p === current ? '#7C57D6' : '#fff', color: p === current ? '#fff' : '#333' }}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setCurrentPage(current + 1)} disabled={current >= total}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: current >= total ? 'not-allowed' : 'pointer', opacity: current >= total ? 0.4 : 1 }}>
            Next ›
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header"><div><h1>Riwayat Peminjaman</h1><p>Seluruh riwayat peminjaman Anda</p></div></div>
      <div className="asset-table-card">
        <div className="asset-table-header"><div><h3>Semua Peminjaman</h3></div><span className="asset-total">{loans.length} Total</span></div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>ID</th><th>Aset</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Biaya</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr> :
               paginatedLoans.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Belum ada riwayat</td></tr> :
               paginatedLoans.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>#{l.id}</td>
                  <td>{l.asset?.name || '-'}</td>
                  <td>{l.borrow_date}</td>
                  <td>{l.actual_return_date || l.estimated_return_date || '-'}</td>
                  <td style={{ fontWeight: 600, color: '#149E93' }}>{fmtIDR(l.total_cost)}</td>
                  <td>{statusBadge(l.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
    </div>
  )
}

export default Riwayat
