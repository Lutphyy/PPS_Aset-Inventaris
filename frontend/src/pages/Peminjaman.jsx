import { useState, useEffect } from 'react'
import { Search, Check, X, Eye, Clock } from 'lucide-react'
import { loansAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const statusLabel = (s) => s?.replace(/_/g, ' ') || s
const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

const STATUS_TABS = ['Semua', 'MENUNGGU', 'DISETUJUI', 'AKTIF', 'DITOLAK', 'DIKEMBALIKAN', 'TERLAMBAT']

function Peminjaman() {
  const { toast, showConfirm } = useToast()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Semua')
  const [showDetail, setShowDetail] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(null)

  useEffect(() => { fetchLoans() }, [activeTab])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const params = activeTab !== 'Semua' ? { status: activeTab, limit: 50 } : { limit: 50 }
      const res = await loansAPI.getAll(params)
      setLoans(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    const confirmed = await showConfirm('Setujui peminjaman ini?', { title: 'Setujui Peminjaman', confirmText: 'Ya, Setujui' })
    if (!confirmed) return
    try {
      await loansAPI.approve(id)
      toast.success('Peminjaman disetujui!')
      fetchLoans()
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.warning('Masukkan alasan penolakan')
    try {
      await loansAPI.reject(showRejectModal, rejectReason)
      toast.success('Peminjaman ditolak')
      setShowRejectModal(null)
      setRejectReason('')
      fetchLoans()
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const statusBadge = (s) => {
    const colors = {
      MENUNGGU: { bg: '#fff4dd', color: '#d79b32' },
      DISETUJUI: { bg: '#e4f6f0', color: '#299579' },
      AKTIF: { bg: '#e9f0ff', color: '#527bd8' },
      DITOLAK: { bg: '#ffe9e7', color: '#df625d' },
      DIKEMBALIKAN: { bg: '#f0eef7', color: '#817995' },
      TERLAMBAT: { bg: '#ffe9e7', color: '#df625d' },
    }
    const c = colors[s] || { bg: '#f0f0f0', color: '#666' }
    return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: c.bg, color: c.color }}>{statusLabel(s)}</span>
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Peminjaman</h1><p>Kelola pengajuan dan status peminjaman aset</p></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f5f5f7', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '18px' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#fff' : 'transparent',
              color: activeTab === tab ? '#292936' : '#888',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,.1)' : 'none'
            }}>{tab === 'Semua' ? 'Semua' : statusLabel(tab)}</button>
        ))}
      </div>

      <div className="asset-table-card">
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr><th>ID</th><th>Aset</th><th>Peminjam</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Total Biaya</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada data peminjaman</td></tr>
              ) : loans.map(loan => (
                <tr key={loan.id}>
                  <td style={{ fontWeight: 600 }}>#{loan.id}</td>
                  <td>{loan.asset?.name || '-'}</td>
                  <td>{loan.borrower?.name || '-'}</td>
                  <td>{loan.borrow_date || '-'}</td>
                  <td>{loan.estimated_return_date || '-'}</td>
                  <td style={{ fontWeight: 600, color: '#149E93' }}>{fmtIDR(loan.total_cost)}</td>
                  <td>{statusBadge(loan.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {loan.status === 'MENUNGGU' && (
                        <>
                          <button className="add-asset-button" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => handleApprove(loan.id)}><Check size={13} /> Setujui</button>
                          <button style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid #df625d', borderRadius: '6px', background: '#ffe9e7', color: '#df625d', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowRejectModal(loan.id)}><X size={13} /> Tolak</button>
                        </>
                      )}
                      <button style={{ padding: '5px 8px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer' }} onClick={() => setShowDetail(loan)}><Eye size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Peminjaman #{showDetail.id}</h2>
              <button onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '10px' }}>
              <div><strong>Aset:</strong> {showDetail.asset?.name} ({showDetail.asset?.code})</div>
              <div><strong>Peminjam:</strong> {showDetail.borrower?.name} ({showDetail.borrower?.email})</div>
              <div><strong>Tujuan:</strong> {showDetail.purpose || '-'}</div>
              <div><strong>Tanggal Pinjam:</strong> {showDetail.borrow_date}</div>
              <div><strong>Estimasi Kembali:</strong> {showDetail.estimated_return_date}</div>
              <div><strong>Biaya/Hari:</strong> {fmtIDR(showDetail.rental_cost_per_day)}</div>
              <div><strong>Total Hari:</strong> {showDetail.total_days}</div>
              <div><strong>Diskon:</strong> {showDetail.discount_percent}% ({fmtIDR(showDetail.discount_amount)})</div>
              <div><strong>Total Biaya:</strong> <span style={{ color: '#149E93', fontWeight: 700 }}>{fmtIDR(showDetail.total_cost)}</span></div>
              {showDetail.deposit_amount > 0 && <div><strong>Deposit:</strong> {fmtIDR(showDetail.deposit_amount)}</div>}
              {showDetail.late_fee > 0 && <div><strong>Denda Keterlambatan:</strong> <span style={{ color: '#df625d' }}>{fmtIDR(showDetail.late_fee)}</span></div>}
              <div><strong>Status:</strong> {statusBadge(showDetail.status)}</div>
              {showDetail.rejection_reason && <div><strong>Alasan Penolakan:</strong> {showDetail.rejection_reason}</div>}
              <div><strong>Kondisi Saat Dipinjam:</strong> {statusLabel(showDetail.condition_when_borrowed)}</div>
              {showDetail.condition_when_returned && <div><strong>Kondisi Saat Dikembalikan:</strong> {statusLabel(showDetail.condition_when_returned)}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Tolak Peminjaman</h2>
              <button onClick={() => setShowRejectModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Alasan Penolakan *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} placeholder="Masukkan alasan penolakan..." />
            </div>
            <div style={{ padding: '12px 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowRejectModal(null)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleReject} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#df625d', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Tolak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Peminjaman
