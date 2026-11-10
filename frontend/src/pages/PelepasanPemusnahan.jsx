import { useState, useEffect, useRef } from 'react'
import { Trash2, Search, Plus, X, Package, Eye, Upload, AlertTriangle, FileText } from 'lucide-react'
import { disposedAssetsAPI, assetsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const kondisiColor = (k) => {
  if (!k) return { bg: '#f0f0f0', color: '#666' }
  const kl = k.toLowerCase()
  if (kl.includes('baik')) return { bg: '#e4f6f0', color: '#299579' }
  if (kl.includes('ringan')) return { bg: '#fff4e5', color: '#d4850d' }
  if (kl.includes('berat')) return { bg: '#fde8e8', color: '#d14343' }
  return { bg: '#f0f0f0', color: '#666' }
}
const statusColor = (s) => {
  const map = {
    GUDANG: { bg: '#f5f0ff', color: '#7C57D6' },
    TERSEDIA: { bg: '#e4f6f0', color: '#299579' },
    DIPINJAM: { bg: '#fff4e5', color: '#d4850d' },
    PROSES_TRANSFER: { bg: '#e9f0ff', color: '#527bd8' },
    DALAM_PERBAIKAN: { bg: '#fff4e5', color: '#d4850d' },
    RUSAK: { bg: '#fde8e8', color: '#d14343' },
    DIMUSNAHKAN: { bg: '#f0f0f0', color: '#666' },
    DILEPASKAN: { bg: '#e9f0ff', color: '#527bd8' },
  }
  return map[s] || { bg: '#f0f0f0', color: '#666' }
}
const rentalLabel = (unit) => {
  const map = { per_jam: '/jam', per_hari: '/hari', per_minggu: '/minggu', per_bulan: '/bulan' }
  return map[unit] || '/hari'
}

function PelepasanPemusnahan() {
  const { toast, showConfirm } = useToast()
  const [disposedAssets, setDisposedAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [detailAsset, setDetailAsset] = useState(null)

  // Asset selection
  const [availableAssets, setAvailableAssets] = useState([])
  const [assetSearch, setAssetSearch] = useState('')
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [disposalType, setDisposalType] = useState('DILEPASKAN')
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0])
  const [disposalReason, setDisposalReason] = useState('')
  const [disposalDestination, setDisposalDestination] = useState('')
  const [buktiFile, setBuktiFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchDisposedAssets() }, [])

  const fetchDisposedAssets = async (page = 1) => {
    try {
      setLoading(true)
      const params = { limit: 25, page }
      if (search) params.search = search
      if (filterType) params.disposal_type = filterType
      const res = await disposedAssetsAPI.getAll(params)
      setDisposedAssets(res.data || [])
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 })
    } catch (err) {
      console.error('Error fetching disposed assets:', err)
      setDisposedAssets([])
    } finally { setLoading(false) }
  }

  const fetchAvailableAssets = async (searchQuery = '') => {
    try {
      setLoadingAssets(true)
      const params = { limit: 100, include_gudang: 'true' }
      if (searchQuery) params.search = searchQuery
      const res = await assetsAPI.getAll(params)
      setAvailableAssets(res.data || [])
    } catch (err) {
      console.error('Error fetching assets:', err)
      setAvailableAssets([])
    } finally { setLoadingAssets(false) }
  }

  const openModal = () => {
    setShowModal(true)
    setSelectedAsset(null)
    setDisposalType('DILEPASKAN')
    setDisposalDate(new Date().toISOString().split('T')[0])
    setDisposalReason('')
    setDisposalDestination('')
    setBuktiFile(null)
    setAssetSearch('')
    fetchAvailableAssets()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedAsset) return toast.error('Pilih aset terlebih dahulu')
    if (!disposalReason) return toast.error('Alasan wajib diisi')
    if (!buktiFile) return toast.error('Bukti dokumen wajib diupload')

    const label = disposalType === 'DIMUSNAHKAN' ? 'musnahkan' : 'lepaskan'
    const confirmed = await showConfirm(
      `Yakin ingin ${label} aset "${selectedAsset.nama_barang}"?\n\nAksi ini tidak dapat dibatalkan.`,
      { title: `Konfirmasi ${disposalType === 'DIMUSNAHKAN' ? 'Pemusnahan' : 'Pelepasan'}`, confirmText: `Ya, ${label}`, variant: 'danger' }
    )
    if (!confirmed) return

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('disposal_type', disposalType)
      formData.append('disposal_date', disposalDate)
      formData.append('disposal_reason', disposalReason)
      if (disposalDestination) formData.append('disposal_destination', disposalDestination)
      formData.append('bukti', buktiFile)

      await disposedAssetsAPI.dispose(selectedAsset.id, formData)
      toast.success(`Aset berhasil di${label}`)
      setShowModal(false)
      fetchDisposedAssets()
    } catch (err) {
      toast.error('Gagal: ' + (err.message || 'Terjadi kesalahan'))
    } finally { setSubmitting(false) }
  }

  const handleView = async (asset) => {
    setDetailAsset(asset)
    setShowDetail(true)
    // Fetch full asset details with all relationships
    try {
      const res = await assetsAPI.getById(asset.id)
      if (res.data) setDetailAsset({ ...res.data, disposal_type: asset.disposal_type, disposal_date: asset.disposal_date, disposal_reason: asset.disposal_reason, disposal_destination: asset.disposal_destination, disposal_document: asset.disposal_document, disposed_by: asset.disposed_by, disposed_at: asset.disposed_at })
    } catch (err) { console.error('Failed to fetch full asset details:', err) }
  }

  const statusBadge = (type) => {
    if (type === 'DIMUSNAHKAN') return { bg: '#ffe9e7', color: '#df625d', label: '🔥 Dimusnahkan' }
    if (type === 'DILEPASKAN') return { bg: '#e9f0ff', color: '#527bd8', label: '📤 Dilepaskan' }
    return { bg: '#f0f0f0', color: '#666', label: type }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>Pelepasan & Pemusnahan</h1>
          <p>Kelola aset yang dimusnahkan atau dilepaskan dari tanggung jawab BMN/Fakultas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="asset-total" style={{ background: '#f5f0ff', color: '#7C57D6', padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }}>
            {pagination.total} Aset
          </span>
          <button type="button" className="add-asset-button" onClick={openModal}>
            <Plus size={17} strokeWidth={2} />
            <span>Lepas / Musnahkan Aset</span>
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} strokeWidth={1.8} />
          <input type="text" placeholder="Cari nama barang, kode, tujuan..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDisposedAssets(1)} />
        </div>
        <div className="asset-filter">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Semua Tipe</option>
            <option value="DILEPASKAN">Dilepaskan</option>
            <option value="DIMUSNAHKAN">Dimusnahkan</option>
          </select>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={() => fetchDisposedAssets(1)}>Cari</button>
      </div>

      {/* TABLE */}
      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>Daftar Aset Dilepas/Dimusnahkan</h3><p>Data aset yang sudah tidak menjadi tanggung jawab unit</p></div>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Kode Register</th>
                <th>Tipe</th>
                <th>Tanggal</th>
                <th>Alasan</th>
                <th>Tujuan</th>
                <th>Oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Memuat data...</td></tr>
              ) : disposedAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    <Trash2 size={36} strokeWidth={1} style={{ marginBottom: '8px', opacity: 0.4 }} /><br />
                    {search || filterType ? 'Tidak ada data yang sesuai filter' : 'Belum ada aset yang dilepaskan atau dimusnahkan'}
                  </td>
                </tr>
              ) : disposedAssets.map((asset) => {
                const sb = statusBadge(asset.disposal_type)
                return (
                  <tr key={asset.id}>
                    <td>
                      <span className="asset-name">{asset.nama_barang}</span>
                      <div style={{ fontSize: '11px', color: '#888' }}>{asset.merk} {asset.tipe}</div>
                    </td>
                    <td><span className="asset-code">{asset.kode_register || '-'}</span></td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sb.bg, color: sb.color }}>
                        {sb.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(asset.disposal_date)}</td>
                    <td style={{ fontSize: '12px', color: '#555', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.disposal_reason || '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#555' }}>{asset.disposal_destination || '-'}</td>
                    <td style={{ fontSize: '12px', fontWeight: 500 }}>{asset.disposed_by?.name || '-'}</td>
                    <td>
                      <div className="asset-actions">
                        <button type="button" title="Lihat Detail" onClick={() => handleView(asset)}>
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #eee' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} aset)
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => fetchDisposedAssets(pagination.page - 1)} disabled={pagination.page <= 1}
                style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.4 : 1 }}>
                ‹ Prev
              </button>
              <button onClick={() => fetchDisposedAssets(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Lepas/Musnahkan Aset */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lepas / Musnahkan Aset</h2>
              <button onClick={() => !submitting && setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>

                {/* Pilih Aset */}
                <div>
                  <label>Pilih Aset *</label>
                  <input type="text" placeholder="Cari aset berdasarkan nama, kode, merk..."
                    value={assetSearch}
                    onChange={e => { setAssetSearch(e.target.value); fetchAvailableAssets(e.target.value) }}
                    style={{ marginBottom: '8px' }}
                  />
                  {selectedAsset && (
                    <div style={{ background: '#f5f0ff', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{selectedAsset.nama_barang}</strong>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                          {selectedAsset.kode_register || '-'} • {selectedAsset.merk || '-'} • {selectedAsset.status}
                          {selectedAsset.unit?.name ? ` • ${selectedAsset.unit.name}` : ' • Gudang'}
                        </div>
                      </div>
                      <button type="button" onClick={() => setSelectedAsset(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                        <X size={16} color="#888" />
                      </button>
                    </div>
                  )}
                  {!selectedAsset && (
                    <div style={{ maxHeight: '180px', overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                      {loadingAssets ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontSize: '12px' }}>Memuat aset...</div>
                      ) : availableAssets.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontSize: '12px' }}>Tidak ada aset ditemukan</div>
                      ) : availableAssets.map(asset => {
                        const kc = kondisiColor(asset.kondisi)
                        return (
                          <div key={asset.id} onClick={() => setSelectedAsset(asset)}
                            style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f8f8ff'}
                            onMouseOut={e => e.currentTarget.style.background = '#fff'}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>{asset.nama_barang}</div>
                              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                {asset.kode_register || '-'} • {asset.merk || '-'}
                                {asset.unit?.name ? ` • ${asset.unit.name}` : ' • 📦 Gudang'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: kc.bg, color: kc.color }}>
                                {asset.kondisi}
                              </span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: '#f0f0f5', color: '#555' }}>
                                {asset.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Tipe Penghapusan */}
                <div>
                  <label>Tipe Penghapusan *</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', border: `2px solid ${disposalType === 'DILEPASKAN' ? '#527bd8' : '#e0e0e0'}`,
                      borderRadius: '8px', cursor: 'pointer', background: disposalType === 'DILEPASKAN' ? '#e9f0ff' : '#fff', fontSize: '13px'
                    }}>
                      <input type="radio" name="disposal_type" value="DILEPASKAN" checked={disposalType === 'DILEPASKAN'} onChange={() => setDisposalType('DILEPASKAN')} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>📤 Dilepaskan</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>Diserahkan ke pihak lain</div>
                      </div>
                    </label>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', border: `2px solid ${disposalType === 'DIMUSNAHKAN' ? '#df625d' : '#e0e0e0'}`,
                      borderRadius: '8px', cursor: 'pointer', background: disposalType === 'DIMUSNAHKAN' ? '#ffe9e7' : '#fff', fontSize: '13px'
                    }}>
                      <input type="radio" name="disposal_type" value="DIMUSNAHKAN" checked={disposalType === 'DIMUSNAHKAN'} onChange={() => setDisposalType('DIMUSNAHKAN')} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>🔥 Dimusnahkan</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>Aset dihancurkan</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Tanggal */}
                <div>
                  <label>Tanggal *</label>
                  <input type="date" value={disposalDate} onChange={e => setDisposalDate(e.target.value)} required />
                </div>

                {/* Tujuan (hanya jika dilepaskan) */}
                {disposalType === 'DILEPASKAN' && (
                  <div>
                    <label>Tujuan Pelepasan</label>
                    <input type="text" value={disposalDestination} onChange={e => setDisposalDestination(e.target.value)}
                      placeholder="Contoh: Universitas Jember, Kementerian XYZ" />
                  </div>
                )}

                {/* Alasan */}
                <div>
                  <label>Alasan *</label>
                  <textarea value={disposalReason} onChange={e => setDisposalReason(e.target.value)} required rows={3}
                    placeholder="Jelaskan alasan pelepasan / pemusnahan aset..." />
                </div>

                {/* Upload Bukti */}
                <div>
                  <label>Bukti Dokumen * <span style={{ fontSize: '10px', color: '#888', fontWeight: 400 }}>(PDF, JPG, PNG — maks 10MB)</span></label>
                  <div style={{
                    border: `2px dashed ${buktiFile ? '#299579' : '#ddd'}`, borderRadius: '10px', padding: '20px',
                    textAlign: 'center', cursor: 'pointer', background: buktiFile ? '#f0fff4' : '#fafbff'
                  }} onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.size > 10 * 1024 * 1024) {
                          toast.error('Ukuran file maksimal 10MB')
                          return
                        }
                        setBuktiFile(file)
                      }}
                    />
                    {buktiFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FileText size={20} color="#299579" />
                        <span style={{ fontSize: '13px', color: '#299579', fontWeight: 600 }}>
                          ✅ {buktiFile.name}
                        </span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setBuktiFile(null) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                          <X size={14} color="#888" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} strokeWidth={1.2} style={{ color: '#bbb', marginBottom: '6px' }} />
                        <div style={{ fontSize: '12px', color: '#888' }}>Klik untuk upload bukti dokumen</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Warning */}
                <div style={{
                  display: 'flex', gap: '10px', padding: '10px 14px', borderRadius: '8px',
                  background: '#fff7e6', border: '1px solid #ffe0a0', fontSize: '11px', color: '#b78a00'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span><strong>Perhatian!</strong> Aset yang dilepaskan/dimusnahkan tidak bisa dikembalikan. Data tetap tersimpan untuk audit.</span>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting}
                  style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" className="add-asset-button" disabled={!selectedAsset || !disposalReason || !buktiFile || submitting}
                  style={{
                    background: disposalType === 'DIMUSNAHKAN' ? '#df625d' : undefined,
                    opacity: (!selectedAsset || !disposalReason || !buktiFile || submitting) ? 0.5 : 1
                  }}>
                  {submitting ? 'Memproses...' : (disposalType === 'DIMUSNAHKAN' ? '🔥 Musnahkan' : '📤 Lepaskan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && detailAsset && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Aset {detailAsset.disposal_type === 'DIMUSNAHKAN' ? 'Dimusnahkan' : 'Dilepaskan'}</h2>
              <button onClick={() => setShowDetail(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>

                {/* DISPOSAL STATUS BADGE */}
                {(() => {
                  const sb = statusBadge(detailAsset.disposal_type)
                  return (
                    <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: sb.bg, color: sb.color }}>
                      {sb.label}
                    </span>
                  )
                })()}

                {/* INFO PELEPASAN / PEMUSNAHAN */}
                <div style={{ background: detailAsset.disposal_type === 'DIMUSNAHKAN' ? '#fff5f5' : '#f0f4ff', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: detailAsset.disposal_type === 'DIMUSNAHKAN' ? '#df625d' : '#527bd8', marginBottom: '6px', fontSize: '12px' }}>
                    {detailAsset.disposal_type === 'DIMUSNAHKAN' ? '🔥 INFO PEMUSNAHAN' : '📤 INFO PELEPASAN'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Tanggal:</strong> {formatDate(detailAsset.disposal_date)}</div>
                    <div><strong>Diproses Oleh:</strong> {detailAsset.disposed_by?.name || '-'}</div>
                    {detailAsset.disposal_type === 'DILEPASKAN' && (
                      <div style={{ gridColumn: '1 / -1' }}><strong>Tujuan:</strong> {detailAsset.disposal_destination || '-'}</div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}><strong>Alasan:</strong> {detailAsset.disposal_reason || '-'}</div>
                  </div>
                  {detailAsset.disposal_document && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Bukti Dokumen:</strong>
                      <div style={{ marginTop: '6px' }}>
                        {detailAsset.disposal_document.match(/\.(jpg|jpeg|png)$/i) ? (
                          <img src={`${API_BASE}${detailAsset.disposal_document}`} alt="Bukti"
                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid #eee' }} />
                        ) : (
                          <a href={`${API_BASE}${detailAsset.disposal_document}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f5f0ff', borderRadius: '8px', color: '#7C57D6', fontWeight: 600, fontSize: '12px', textDecoration: 'none' }}>
                            <FileText size={16} /> Lihat Dokumen PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* IDENTIFIKASI */}
                <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#7C57D6', marginBottom: '6px', fontSize: '12px' }}>IDENTIFIKASI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>No Urut:</strong> {detailAsset.no_urut || '-'}</div>
                    <div><strong>Kode Register:</strong> {detailAsset.kode_register || '-'}</div>
                    <div><strong>Kode Barang:</strong> {detailAsset.kode_barang || '-'}</div>
                    <div><strong>NUP:</strong> {detailAsset.nup || '-'}</div>
                    <div><strong>Jenis BMN:</strong> {detailAsset.jenis_bmn || '-'}</div>
                    <div><strong>Kode Satker:</strong> {detailAsset.kode_satker || '-'}</div>
                    <div><strong>Nama Satker:</strong> {detailAsset.nama_satker || '-'}</div>
                  </div>
                </div>
                <div><strong>Nama Barang:</strong> <span style={{ fontSize: '15px', fontWeight: 700 }}>{detailAsset.nama_barang}</span></div>

                {/* SPESIFIKASI */}
                <div style={{ background: '#fef9f0', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#d4850d', marginBottom: '6px', fontSize: '12px' }}>SPESIFIKASI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Merk:</strong> {detailAsset.merk || '-'}</div>
                    <div><strong>Tipe:</strong> {detailAsset.tipe || '-'}</div>
                    <div><strong>Kondisi:</strong> <span style={{ ...kondisiColor(detailAsset.kondisi), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{detailAsset.kondisi}</span></div>
                    <div><strong>Umur Aset:</strong> {detailAsset.umur_aset || '0'} tahun</div>
                    <div><strong>Intra/Ekstra:</strong> {detailAsset.intra_ekstra || '-'}</div>
                    <div><strong>Jumlah Lantai:</strong> {detailAsset.jumlah_lantai || '-'}</div>
                    <div><strong>Jumlah Foto:</strong> {detailAsset.jumlah_foto || '-'}</div>
                  </div>
                </div>

                {/* STATUS BMN */}
                <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#527bd8', marginBottom: '6px', fontSize: '12px' }}>STATUS BMN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Status:</strong> <span style={{ ...statusColor(detailAsset.status), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{detailAsset.status}</span></div>
                    <div><strong>Status Penggunaan:</strong> {detailAsset.status_penggunaan || '-'}</div>
                    <div><strong>Henti Guna:</strong> {detailAsset.henti_guna || '-'}</div>
                    <div><strong>Status SBSN:</strong> {detailAsset.status_sbsn || '-'}</div>
                    <div><strong>Status BMN Idle:</strong> {detailAsset.status_bmn_idle || '-'}</div>
                    <div><strong>Status Kemitraan:</strong> {detailAsset.status_kemitraan || '-'}</div>
                    <div><strong>BPYBDS:</strong> {detailAsset.bpybds || '-'}</div>
                    <div><strong>Usulan Barang Hilang:</strong> {detailAsset.usulan_barang_hilang || '-'}</div>
                    <div><strong>Usulan Barang RB:</strong> {detailAsset.usulan_barang_rb || '-'}</div>
                    <div><strong>Usul Hapus:</strong> {detailAsset.usul_hapus || '-'}</div>
                    <div><strong>Hibah DKTP:</strong> {detailAsset.hibah_dktp || '-'}</div>
                    <div><strong>Konsensi Jasa:</strong> {detailAsset.konsensi_jasa || '-'}</div>
                    <div><strong>Properti Investasi:</strong> {detailAsset.properti_investasi || '-'}</div>
                  </div>
                </div>

                {/* DOKUMEN */}
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#555', marginBottom: '6px', fontSize: '12px' }}>DOKUMEN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Jenis Dokumen:</strong> {detailAsset.jenis_dokumen || '-'}</div>
                    <div><strong>No Dokumen:</strong> {detailAsset.no_dokumen || '-'}</div>
                    <div><strong>No BPKP:</strong> {detailAsset.no_bpkp || '-'}</div>
                    <div><strong>No Polisi:</strong> {detailAsset.no_polisi || '-'}</div>
                    <div><strong>Kepemilikan:</strong> {detailAsset.kepemilikan || '-'}</div>
                    <div><strong>No Sertifikat:</strong> {detailAsset.no_sertifikat || '-'}</div>
                    <div><strong>No PSP:</strong> {detailAsset.no_psp || '-'}</div>
                    <div><strong>Tanggal PSP:</strong> {detailAsset.tanggal_psp || '-'}</div>
                  </div>
                </div>

                {/* KEUANGAN */}
                <div style={{ background: '#f0f7f4', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#299579', marginBottom: '6px', fontSize: '12px' }}>KEUANGAN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Nilai Perolehan:</strong> {fmtIDR(detailAsset.nilai_perolehan)}</div>
                    <div><strong>Nilai Buku:</strong> {fmtIDR(detailAsset.nilai_buku)}</div>
                    <div><strong>Nilai Penyusutan:</strong> {fmtIDR(detailAsset.nilai_penyusutan)}</div>
                    <div><strong>Nilai Mutasi:</strong> {fmtIDR(detailAsset.nilai_mutasi)}</div>
                    <div><strong>Tgl Perolehan:</strong> {detailAsset.tanggal_perolehan || '-'}</div>
                    <div><strong>Tgl Buku Pertama:</strong> {detailAsset.tanggal_buku_pertama || '-'}</div>
                    <div><strong>Tgl Penghapusan:</strong> {detailAsset.tanggal_penghapusan || '-'}</div>
                  </div>
                </div>

                {/* LUAS */}
                <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#7C57D6', marginBottom: '6px', fontSize: '12px' }}>LUAS (m²)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Tanah Seluruhnya:</strong> {detailAsset.luas_tanah_seluruhnya || '-'}</div>
                    <div><strong>Tanah Bangunan:</strong> {detailAsset.luas_tanah_bangunan || '-'}</div>
                    <div><strong>Tanah Sarana Lingkungan:</strong> {detailAsset.luas_tanah_sarana_lingkungan || '-'}</div>
                    <div><strong>Lahan Kosong:</strong> {detailAsset.luas_lahan_kosong || '-'}</div>
                    <div><strong>Bangunan:</strong> {detailAsset.luas_bangunan || '-'}</div>
                    <div><strong>Tapak Bangunan:</strong> {detailAsset.luas_tapak_bangunan || '-'}</div>
                    <div><strong>Pemanfaatan:</strong> {detailAsset.luas_pemanfaatan || '-'}</div>
                  </div>
                </div>

                {/* LOKASI */}
                <div style={{ background: '#fef9f0', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#d4850d', marginBottom: '6px', fontSize: '12px' }}>LOKASI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Unit:</strong> {detailAsset.unit?.name || '📦 Gudang'}</div>
                    <div><strong>Lokasi (sistem):</strong> {detailAsset.location?.name || '-'}</div>
                    <div><strong>Alamat:</strong> {detailAsset.alamat || '-'}</div>
                    <div><strong>RT/RW:</strong> {detailAsset.rt_rw || '-'}</div>
                    <div><strong>Kelurahan/Desa:</strong> {detailAsset.kelurahan_desa || '-'}</div>
                    <div><strong>Kecamatan:</strong> {detailAsset.kecamatan || '-'}</div>
                    <div><strong>Kab/Kota:</strong> {detailAsset.kab_kota || '-'}</div>
                    <div><strong>Kode Kab/Kota:</strong> {detailAsset.kode_kab_kota || '-'}</div>
                    <div><strong>Provinsi:</strong> {detailAsset.provinsi || '-'}</div>
                    <div><strong>Kode Provinsi:</strong> {detailAsset.kode_provinsi || '-'}</div>
                    <div><strong>Kode Pos:</strong> {detailAsset.kode_pos || '-'}</div>
                    <div><strong>Lokasi Ruang:</strong> {detailAsset.lokasi_ruang || '-'}</div>
                  </div>
                </div>

                {/* PENGELOLAAN */}
                <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#527bd8', marginBottom: '6px', fontSize: '12px' }}>PENGELOLAAN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>SBSK:</strong> {detailAsset.sbsk || '-'}</div>
                    <div><strong>Optimalisasi:</strong> {detailAsset.optimalisasi || '-'}</div>
                    <div><strong>Penghuni:</strong> {detailAsset.penghuni || '-'}</div>
                    <div><strong>Pengguna BMN:</strong> {detailAsset.pengguna_bmn || '-'}</div>
                    <div><strong>Kode KPKNL:</strong> {detailAsset.kode_kpknl || '-'}</div>
                    <div><strong>Uraian KPKNL:</strong> {detailAsset.uraian_kpknl || '-'}</div>
                    <div><strong>Uraian Kanwil DJKN:</strong> {detailAsset.uraian_kanwil_djkn || '-'}</div>
                    <div><strong>Nama K/L:</strong> {detailAsset.nama_kl || '-'}</div>
                    <div><strong>Nama E1:</strong> {detailAsset.nama_e1 || '-'}</div>
                    <div><strong>Nama Korwil:</strong> {detailAsset.nama_korwil || '-'}</div>
                  </div>
                </div>

                {/* PEMINJAMAN */}
                <div style={{ background: '#e9f0ff', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#527bd8', marginBottom: '6px', fontSize: '12px' }}>PEMINJAMAN</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div><strong>Bisa Dipinjam:</strong> {detailAsset.is_borrowable ? '✅ Ya' : '❌ Tidak'}</div>
                    <div><strong>Harga Sewa:</strong> {detailAsset.rental_price ? fmtIDR(detailAsset.rental_price) + rentalLabel(detailAsset.rental_unit) : '-'}</div>
                    <div><strong>Diklaim Oleh:</strong> {detailAsset.claimed_by?.name || '-'}</div>
                    <div><strong>Tgl Klaim:</strong> {detailAsset.claimed_at || '-'}</div>
                  </div>
                </div>

                {detailAsset.notes && <div><strong>Catatan:</strong> {detailAsset.notes}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PelepasanPemusnahan
