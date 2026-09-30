import { useState, useEffect } from 'react'
import { loansAPI } from '../utils/api'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const statusLabel = (s) => s?.replace(/_/g, ' ') || s

function Riwayat() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loansAPI.getMyLoans().then(res => { setLoans(res.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const statusBadge = (s) => {
    const colors = { DIKEMBALIKAN: { bg: '#e4f6f0', c: '#299579' }, TERLAMBAT: { bg: '#ffe9e7', c: '#df625d' }, DITOLAK: { bg: '#ffe9e7', c: '#df625d' }, MENUNGGU: { bg: '#fff4dd', c: '#d79b32' }, DISETUJUI: { bg: '#e9f0ff', c: '#527bd8' }, AKTIF: { bg: '#e9f0ff', c: '#527bd8' } }
    const cl = colors[s] || { bg: '#f0f0f0', c: '#666' }
    return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: cl.bg, color: cl.c }}>{statusLabel(s)}</span>
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
               loans.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Belum ada riwayat</td></tr> :
               loans.map(l => (
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
      </div>
    </div>
  )
}

export default Riwayat
