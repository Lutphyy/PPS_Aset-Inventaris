import { useState, useEffect } from 'react'
import { Undo2, X, Eye } from 'lucide-react'
import { loansAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const CONDITIONS = ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT']
const condLabel = (c) => c?.replace(/_/g, ' ') || c

function Pengembalian() {
  const { toast } = useToast()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReturnModal, setShowReturnModal] = useState(null)
  const [returnCondition, setReturnCondition] = useState('BAIK')
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => { fetchLoans() }, [])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const res = await loansAPI.getAll({ status: 'DISETUJUI', limit: 50 })
      const res2 = await loansAPI.getAll({ status: 'AKTIF', limit: 50 })
      setLoans([...(res.data || []), ...(res2.data || [])])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleReturn = async () => {
    try {
      await loansAPI.returnAsset(showReturnModal.id, returnCondition, returnNotes)
      toast.success('Aset berhasil dikembalikan!')
      setShowReturnModal(null)
      setReturnCondition('BAIK')
      setReturnNotes('')
      fetchLoans()
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Pengembalian</h1><p>Proses pengembalian aset yang sedang dipinjam</p></div>
      </div>

      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>Peminjaman Aktif</h3><p>Aset yang sedang dipinjam dan siap untuk dikembalikan</p></div>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>ID</th><th>Aset</th><th>Peminjam</th><th>Tgl Pinjam</th><th>Estimasi Kembali</th><th>Biaya</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada peminjaman aktif</td></tr>
              ) : loans.map(loan => (
                <tr key={loan.id}>
                  <td style={{ fontWeight: 600 }}>#{loan.id}</td>
                  <td>{loan.asset?.name || '-'}</td>
                  <td>{loan.borrower?.name || '-'}</td>
                  <td>{loan.borrow_date}</td>
                  <td>
                    <span style={{
                      color: new Date(loan.estimated_return_date) < new Date() ? '#df625d' : '#292936',
                      fontWeight: new Date(loan.estimated_return_date) < new Date() ? 700 : 400
                    }}>
                      {loan.estimated_return_date}
                      {new Date(loan.estimated_return_date) < new Date() && ' ⚠️'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#149E93' }}>{fmtIDR(loan.total_cost)}</td>
                  <td>
                    <button className="add-asset-button" style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => setShowReturnModal(loan)}>
                      <Undo2 size={13} /> Kembalikan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Konfirmasi Pengembalian</h2>
              <button onClick={() => setShowReturnModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '12px' }}>
              <div style={{ background: '#f5f7fc', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>{showReturnModal.asset?.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Peminjam: {showReturnModal.borrower?.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Kondisi saat dipinjam: {condLabel(showReturnModal.condition_when_borrowed)}</div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Kondisi Saat Dikembalikan *</label>
                <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{condLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Catatan</label>
                <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} placeholder="Catatan pengembalian (opsional)" />
              </div>
              {new Date(showReturnModal.estimated_return_date) < new Date() && (
                <div style={{ background: '#ffe9e7', color: '#df625d', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                  ⚠️ Pengembalian terlambat! Denda keterlambatan akan dikenakan.
                </div>
              )}
            </div>
            <div style={{ padding: '12px 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowReturnModal(null)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleReturn} className="add-asset-button">Konfirmasi Pengembalian</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pengembalian
