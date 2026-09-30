import { useState, useEffect } from 'react'
import { ClipboardCheck, AlertTriangle, X, Eye } from 'lucide-react'
import { agreementsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const statusLabel = (s) => s?.replace(/_/g, ' ') || s

function MonitoringAgreement() {
  const { toast } = useToast()
  const [agreements, setAgreements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Semua')
  const [showDetail, setShowDetail] = useState(null)
  const [violateId, setViolateId] = useState(null)
  const [violateNotes, setViolateNotes] = useState('')

  useEffect(() => { fetchAgreements() }, [filter])

  const fetchAgreements = async () => {
    try {
      setLoading(true)
      const params = filter !== 'Semua' ? { status: filter, limit: 50 } : { limit: 50 }
      const res = await agreementsAPI.getAll(params)
      setAgreements(res.data || [])
    } catch (err) { console.error(err); setAgreements([]) }
    finally { setLoading(false) }
  }

  const handleViolate = async () => {
    if (!violateNotes.trim()) return toast.warning('Masukkan catatan pelanggaran')
    try {
      await agreementsAPI.markAsViolated(violateId, violateNotes)
      toast.success('Agreement ditandai sebagai dilanggar')
      setViolateId(null); setViolateNotes(''); fetchAgreements()
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const statusBadge = (s) => {
    const colors = { BERLAKU: { bg: '#e9f0ff', c: '#527bd8' }, SELESAI: { bg: '#f0eef7', c: '#817995' }, DILANGGAR: { bg: '#ffe9e7', c: '#df625d' } }
    const cl = colors[s] || { bg: '#f0f0f0', c: '#666' }
    return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: cl.bg, color: cl.c }}>{statusLabel(s)}</span>
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header"><div><h1>Monitoring Agreement</h1><p>Pantau seluruh perjanjian peminjaman</p></div></div>

      <div style={{ display: 'flex', gap: '4px', background: '#f5f5f7', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '18px' }}>
        {['Semua', 'BERLAKU', 'SELESAI', 'DILANGGAR'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === tab ? '#fff' : 'transparent', color: filter === tab ? '#292936' : '#888',
              boxShadow: filter === tab ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>{tab === 'Semua' ? 'Semua' : statusLabel(tab)}</button>
        ))}
      </div>

      <div className="asset-table-card">
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>ID</th><th>Peminjam</th><th>Aset</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr> :
               agreements.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada data agreement</td></tr> :
               agreements.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>#{a.id}</td>
                  <td>{a.user?.name || '-'}</td>
                  <td>{a.loan?.asset?.name || '-'}</td>
                  <td style={{ fontSize: '12px' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td>{statusBadge(a.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={{ padding: '5px 8px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer' }} onClick={() => setShowDetail(a)}><Eye size={14} /></button>
                      {a.status === 'BERLAKU' && (
                        <button style={{ padding: '5px 8px', border: '1px solid #df625d', borderRadius: '6px', background: '#ffe9e7', cursor: 'pointer', color: '#df625d' }} onClick={() => setViolateId(a.id)} title="Tandai Pelanggaran"><AlertTriangle size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Detail Agreement #{showDetail.id}</h2><button onClick={() => setShowDetail(null)}><X size={20} /></button></div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#555', lineHeight: 1.6, background: '#f8f8fc', padding: '16px', borderRadius: '10px', border: '1px solid #e7e3f6' }}>{showDetail.content || 'Konten perjanjian tidak tersedia'}</pre>
              <div style={{ marginTop: '12px' }}><strong>Status:</strong> {statusBadge(showDetail.status)}</div>
            </div>
          </div>
        </div>
      )}

      {violateId && (
        <div className="modal-overlay" onClick={() => setViolateId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header"><h2>Tandai Pelanggaran</h2><button onClick={() => setViolateId(null)}><X size={20} /></button></div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Catatan Pelanggaran *</label>
              <textarea value={violateNotes} onChange={e => setViolateNotes(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} placeholder="Jelaskan pelanggaran..." />
            </div>
            <div style={{ padding: '12px 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setViolateId(null)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleViolate} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#df625d', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Tandai Pelanggaran</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonitoringAgreement
