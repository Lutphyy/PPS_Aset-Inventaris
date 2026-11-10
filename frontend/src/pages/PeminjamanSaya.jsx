import { useState, useEffect } from 'react'
import { Eye, X } from 'lucide-react'
import { loansAPI } from '../utils/api'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusLabel = (s) => s?.replace(/_/g, ' ') || s
const statusBadge = (s) => {
  const colors = { MENUNGGU: { bg: '#fff4dd', c: '#d79b32' }, DISETUJUI: { bg: '#e4f6f0', c: '#299579' }, AKTIF: { bg: '#e9f0ff', c: '#527bd8' }, DITOLAK: { bg: '#ffe9e7', c: '#df625d' }, DIKEMBALIKAN: { bg: '#f0eef7', c: '#817995' }, TERLAMBAT: { bg: '#ffe9e7', c: '#df625d' } }
  const cl = colors[s] || { bg: '#f0f0f0', c: '#666' }
  return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: cl.bg, color: cl.c }}>{statusLabel(s)}</span>
}

function PeminjamanSaya() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 25

  useEffect(() => {
    loansAPI.getMyLoans().then(res => { setLoans(res.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const activeLoans = loans.filter(l => ['MENUNGGU', 'DISETUJUI', 'AKTIF'].includes(l.status))

  const totalPages = Math.ceil(activeLoans.length / perPage)
  const safePage = Math.min(currentPage, totalPages || 1)
  const paginatedLoans = activeLoans.slice((safePage - 1) * perPage, safePage * perPage)

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
        <span style={{ fontSize: '12px', color: '#888' }}>Halaman {current} dari {total} ({activeLoans.length} data)</span>
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
      <div className="asset-page-header"><div><h1>Peminjaman Saya</h1><p>Daftar peminjaman aktif Anda</p></div></div>
      <div className="asset-table-card">
        <div className="asset-table-header"><div><h3>Peminjaman Aktif</h3></div><span className="asset-total">{activeLoans.length} Aktif</span></div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>ID</th><th>Aset</th><th>Tgl Pinjam</th><th>Estimasi Kembali</th><th>Total Biaya</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr> :
               paginatedLoans.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada peminjaman aktif</td></tr> :
               paginatedLoans.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>#{l.id}</td>
                  <td>{l.asset?.name || '-'}</td>
                  <td>{l.borrow_date}</td>
                  <td>{l.estimated_return_date}</td>
                  <td style={{ fontWeight: 600, color: '#149E93' }}>{fmtIDR(l.total_cost)}</td>
                  <td>{statusBadge(l.status)}</td>
                  <td><button style={{ padding: '5px 8px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer' }} onClick={() => setDetail(l)}><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Detail #{detail.id}</h2><button onClick={() => setDetail(null)}><X size={20} /></button></div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div><strong>Aset:</strong> {detail.asset?.name}</div>
              <div><strong>Tujuan:</strong> {detail.purpose || '-'}</div>
              <div><strong>Tgl Pinjam:</strong> {detail.borrow_date}</div>
              <div><strong>Estimasi Kembali:</strong> {detail.estimated_return_date}</div>
              <div><strong>Biaya/Hari:</strong> {fmtIDR(detail.rental_cost_per_day)}</div>
              <div><strong>Diskon:</strong> {detail.discount_percent}%</div>
              <div><strong>Total:</strong> <span style={{ color: '#149E93', fontWeight: 700 }}>{fmtIDR(detail.total_cost)}</span></div>
              <div><strong>Status:</strong> {statusBadge(detail.status)}</div>
              {detail.rejection_reason && <div><strong>Alasan Ditolak:</strong> <span style={{ color: '#df625d' }}>{detail.rejection_reason}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PeminjamanSaya
