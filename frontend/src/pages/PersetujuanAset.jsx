import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Package, Eye, X, Filter } from 'lucide-react'
import { assetRequestsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

const statusStyle = (s) => {
  const map = {
    PENDING: { bg: '#fff4e5', color: '#d4850d', label: '⏳ Menunggu' },
    APPROVED: { bg: '#e4f6f0', color: '#299579', label: '✅ Disetujui' },
    REJECTED: { bg: '#fde8e8', color: '#d14343', label: '❌ Ditolak' },
  }
  return map[s] || { bg: '#f0f0f0', color: '#666', label: s }
}

const typeStyle = (t) => {
  const map = {
    CLAIM: { bg: '#f5f0ff', color: '#7C57D6', label: '📦 Klaim Gudang' },
    TRANSFER: { bg: '#e9f0ff', color: '#527bd8', label: '🔄 Transfer Unit' },
  }
  return map[t] || { bg: '#f0f0f0', color: '#666', label: t }
}

function PersetujuanAset() {
  const { toast } = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [filterType, setFilterType] = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  // Detail modal
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)

  // Reject modal
  const [showReject, setShowReject] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [filterStatus, filterType])

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true)
      const params = { status: filterStatus, type: filterType, limit: 20, page }
      const res = await assetRequestsAPI.getAll(params)
      setRequests(res.data || [])
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setProcessing(true)
    try {
      const res = await assetRequestsAPI.approve(id, '')
      toast.success(res.message || 'Permintaan berhasil disetujui')
      fetchRequests(pagination.page)
      setShowDetail(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectOpen = (id) => {
    setRejectId(id)
    setRejectNotes('')
    setShowReject(true)
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectNotes.trim()) return toast.error('Alasan penolakan wajib diisi')
    setProcessing(true)
    try {
      const res = await assetRequestsAPI.reject(rejectId, rejectNotes)
      toast.success(res.message || 'Permintaan berhasil ditolak')
      setShowReject(false)
      setShowDetail(false)
      fetchRequests(pagination.page)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleView = (req) => {
    setSelected(req)
    setShowDetail(true)
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>📋 Persetujuan Aset</h1>
          <p>Kelola permintaan klaim dan transfer aset dari operator</p>
        </div>
        <span className="asset-total" style={{ background: '#fff4e5', color: '#d4850d', padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }}>
          {pagination.total} Permintaan
        </span>
      </div>

      {/* FILTERS */}
      <div className="asset-filter-card">
        <div className="asset-filter">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
        <div className="asset-filter">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Semua Tipe</option>
            <option value="CLAIM">Klaim dari Gudang</option>
            <option value="TRANSFER">Transfer Antar Unit</option>
          </select>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={() => fetchRequests(1)}>
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* TABLE */}
      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>Daftar Permintaan</h3><p>Permintaan klaim dan transfer aset dari operator</p></div>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Aset</th>
                <th>Pengaju</th>
                <th>Dari / Ke</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Memuat data...</td></tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    <Clock size={36} strokeWidth={1} style={{ marginBottom: '8px', opacity: 0.4 }} /><br />
                    {filterStatus === 'PENDING' ? 'Tidak ada permintaan yang menunggu persetujuan' : 'Tidak ada data permintaan'}
                  </td>
                </tr>
              ) : (
                requests.map(req => {
                  const ss = statusStyle(req.admin_status)
                  const ts = typeStyle(req.request_type)
                  return (
                    <tr key={req.id}>
                      <td style={{ fontSize: '11px', color: '#888' }}>{fmtDate(req.created_at)}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: ts.bg, color: ts.color }}>
                          {ts.label}
                        </span>
                      </td>
                      <td>
                        <span className="asset-name">{req.asset?.nama_barang || '-'}</span>
                        <div style={{ fontSize: '10px', color: '#999' }}>{req.asset?.kode_barang || ''}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{req.requester?.name || '-'}</td>
                      <td style={{ fontSize: '11px' }}>
                        {req.request_type === 'CLAIM' ? (
                          <span>📦 Gudang → <strong style={{ color: '#7C57D6' }}>{req.from_unit?.name || '-'}</strong></span>
                        ) : (
                          <span><strong>{req.from_unit?.name || '-'}</strong> → <strong style={{ color: '#527bd8' }}>{req.to_unit?.name || '-'}</strong></span>
                        )}
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: ss.bg, color: ss.color }}>
                          {ss.label}
                        </span>
                      </td>
                      <td>
                        <div className="asset-actions">
                          <button type="button" title="Lihat Detail" onClick={() => handleView(req)}><Eye size={15} /></button>
                          {req.admin_status === 'PENDING' && (
                            <>
                              <button type="button" title="Setujui" onClick={() => handleApprove(req.id)} style={{ color: '#299579' }} disabled={processing}>
                                <CheckCircle size={15} />
                              </button>
                              <button type="button" title="Tolak" onClick={() => handleRejectOpen(req.id)} style={{ color: '#d14343' }} disabled={processing}>
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '16px', borderTop: '1px solid #eee' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchRequests(p)}
                style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer',
                  background: p === pagination.page ? '#527bd8' : '#fff', color: p === pagination.page ? '#fff' : '#333',
                }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetail && selected && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Permintaan</h2>
              <button onClick={() => setShowDetail(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                {/* Tipe & Status */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(() => { const ts = typeStyle(selected.request_type); return (
                    <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: ts.bg, color: ts.color }}>{ts.label}</span>
                  )})()}
                  {(() => { const ss = statusStyle(selected.admin_status); return (
                    <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: ss.bg, color: ss.color }}>{ss.label}</span>
                  )})()}
                </div>

                {/* Info Aset */}
                <div style={{ background: '#f5f0ff', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#7C57D6', marginBottom: '6px', fontSize: '12px' }}>INFORMASI ASET</div>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{selected.asset?.nama_barang || '-'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div><strong>Kode:</strong> {selected.asset?.kode_barang || '-'}</div>
                    <div><strong>NUP:</strong> {selected.asset?.nup || '-'}</div>
                    <div><strong>Merk:</strong> {selected.asset?.merk || '-'}</div>
                    <div><strong>Kondisi:</strong> {selected.asset?.kondisi || '-'}</div>
                    <div><strong>Nilai:</strong> {fmtIDR(selected.asset?.nilai_perolehan)}</div>
                  </div>
                </div>

                {/* Info Permintaan */}
                <div style={{ background: '#fef9f0', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#d4850d', marginBottom: '6px', fontSize: '12px' }}>DETAIL PERMINTAAN</div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div><strong>Pengaju:</strong> {selected.requester?.name || '-'}</div>
                    <div><strong>Tanggal Pengajuan:</strong> {fmtDate(selected.created_at)}</div>
                    {selected.request_type === 'CLAIM' ? (
                      <div><strong>Tujuan:</strong> 📦 Gudang → <strong style={{ color: '#7C57D6' }}>{selected.from_unit?.name || '-'}</strong></div>
                    ) : (
                      <div><strong>Transfer:</strong> <strong>{selected.from_unit?.name || '-'}</strong> → <strong style={{ color: '#527bd8' }}>{selected.to_unit?.name || '-'}</strong></div>
                    )}
                    <div><strong>Alasan:</strong> {selected.reason || '-'}</div>
                  </div>
                </div>

                {/* Info Review (jika sudah diproses) */}
                {selected.admin_status !== 'PENDING' && (
                  <div style={{ background: selected.admin_status === 'APPROVED' ? '#f0f7f4' : '#fde8e8', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: selected.admin_status === 'APPROVED' ? '#299579' : '#d14343', marginBottom: '6px', fontSize: '12px' }}>
                      HASIL REVIEW
                    </div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <div><strong>Ditinjau oleh:</strong> {selected.admin_reviewer?.name || '-'}</div>
                      <div><strong>Tanggal:</strong> {fmtDate(selected.admin_reviewed_at)}</div>
                      {selected.admin_notes && <div><strong>Catatan:</strong> {selected.admin_notes}</div>}
                    </div>
                  </div>
                )}

                {/* Action buttons for PENDING */}
                {selected.admin_status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                    <button type="button" onClick={() => handleApprove(selected.id)} disabled={processing}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #299579, #1e7a63)', color: '#fff',
                        fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        opacity: processing ? 0.6 : 1,
                      }}>
                      <CheckCircle size={16} /> {processing ? 'Memproses...' : 'Setujui Permintaan'}
                    </button>
                    <button type="button" onClick={() => handleRejectOpen(selected.id)} disabled={processing}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #d14343, #b33636)', color: '#fff',
                        fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        opacity: processing ? 0.6 : 1,
                      }}>
                      <XCircle size={16} /> Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showReject && (
        <div className="modal-overlay" onClick={() => !processing && setShowReject(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tolak Permintaan</h2>
              <button onClick={() => !processing && setShowReject(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div style={{ background: '#fde8e8', padding: '12px', borderRadius: '10px', marginBottom: '12px', fontSize: '13px', color: '#d14343' }}>
                  <strong>⚠️ Perhatian:</strong> Permintaan yang ditolak tidak bisa dikembalikan.
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>Alasan Penolakan *</label>
                  <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows="3" required
                    placeholder="Jelaskan alasan penolakan..."
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowReject(false)} disabled={processing}
                  style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={processing}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: '#d14343', color: '#fff', fontWeight: 600,
                    opacity: processing ? 0.6 : 1,
                  }}>
                  {processing ? 'Memproses...' : 'Tolak Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersetujuanAset
