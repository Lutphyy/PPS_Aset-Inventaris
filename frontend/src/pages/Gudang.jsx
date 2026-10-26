import { useState, useEffect } from 'react'
import { Search, Package, ArrowDownToLine, Eye, X } from 'lucide-react'
import { assetsAPI, assetRequestsAPI, unitsAPI, locationsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const kondisiColor = (k) => {
  if (!k) return { bg: '#f0f0f0', color: '#666' }
  const kl = k.toLowerCase()
  if (kl.includes('baik')) return { bg: '#e4f6f0', color: '#299579' }
  if (kl.includes('ringan')) return { bg: '#fff4e5', color: '#d4850d' }
  if (kl.includes('berat')) return { bg: '#fde8e8', color: '#d14343' }
  return { bg: '#f0f0f0', color: '#666' }
}

function Gudang() {
  const { toast, showConfirm } = useToast()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterKondisi, setFilterKondisi] = useState('')
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  // Detail modal
  const [showDetail, setShowDetail] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  // Admin assign modal
  const [showAssign, setShowAssign] = useState(false)
  const [assignAsset, setAssignAsset] = useState(null)
  const [assignData, setAssignData] = useState({ unit_id: '', location_id: '' })
  const [units, setUnits] = useState([])
  const [locations, setLocations] = useState([])

  const isAdmin = ['SUPER_ADMIN', 'ADMIN_UNIT'].includes(user.role)
  const isOperator = user.role === 'OPERATOR'

  useEffect(() => {
    fetchGudang()
    if (isAdmin) fetchUnits()
  }, [])

  const fetchGudang = async (page = 1) => {
    try {
      setLoading(true)
      const params = { search, jenis_bmn: filterJenis, kondisi: filterKondisi, limit: 10, page }
      const res = await assetsAPI.getGudang(params)
      setAssets(res.data || [])
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchUnits = async () => {
    try {
      const res = await unitsAPI.getAll({ active_only: true })
      setUnits(res.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchLocationsForUnit = async (unitId) => {
    if (!unitId) { setLocations([]); return }
    try {
      const res = await locationsAPI.getAll({ unit_id: unitId, active_only: true })
      setLocations(res.data || [])
    } catch (err) { console.error(err) }
  }

  // Operator request klaim aset (butuh persetujuan admin)
  const handleClaim = async (asset) => {
    const confirmed = await showConfirm(
      `Ajukan permintaan klaim aset "${asset.nama_barang}" ke unit Anda?\n\nPermintaan akan ditinjau oleh Admin Unit.`,
      { title: 'Ajukan Klaim Aset', confirmText: 'Ya, Ajukan', variant: 'primary' }
    )
    if (!confirmed) return
    try {
      const res = await assetRequestsAPI.requestClaim(asset.id, 'Permintaan klaim aset dari gudang')
      toast.success(res.message)
      fetchGudang(pagination.page)
    } catch (err) {
      toast.error('Gagal mengajukan klaim: ' + err.message)
    }
  }

  // Admin assign aset ke unit
  const handleAssignOpen = (asset) => {
    setAssignAsset(asset)
    setAssignData({ unit_id: '', location_id: '' })
    setLocations([])
    setShowAssign(true)
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await assetsAPI.assignToUnit(assignAsset.id, assignData)
      toast.success(res.message)
      setShowAssign(false)
      fetchGudang(pagination.page)
    } catch (err) {
      toast.error('Gagal assign: ' + err.message)
    }
  }

  // View detail
  const handleView = async (assetId) => {
    try {
      const res = await assetsAPI.getById(assetId)
      setSelectedAsset(res.data)
      setShowDetail(true)
    } catch (err) { toast.error('Gagal memuat detail') }
  }

  // Pagination buttons
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    const pages = []
    const current = pagination.page
    const total = pagination.totalPages

    // Always show first
    if (current > 3) pages.push(1)
    if (current > 4) pages.push('...')

    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i)
    }

    if (current < total - 3) pages.push('...')
    if (current < total - 2) pages.push(total)

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #eee' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>
          Halaman {current} dari {total} ({pagination.total} aset)
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => fetchGudang(current - 1)} disabled={current <= 1}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: current <= 1 ? 'not-allowed' : 'pointer', opacity: current <= 1 ? 0.4 : 1 }}>
            ‹ Prev
          </button>
          {pages.map((p, i) =>
            p === '...' ? <span key={`e${i}`} style={{ padding: '5px 4px', fontSize: '12px', color: '#999' }}>…</span> : (
              <button key={p} onClick={() => fetchGudang(p)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer',
                  background: p === current ? '#7C57D6' : '#fff', color: p === current ? '#fff' : '#333',
                }}>
                {p}
              </button>
            )
          )}
          <button onClick={() => fetchGudang(current + 1)} disabled={current >= total}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: current >= total ? 'not-allowed' : 'pointer', opacity: current >= total ? 0.4 : 1 }}>
            Next ›
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>📦 Gudang Aset</h1>
          <p>Aset yang belum diklaim oleh unit manapun</p>
        </div>
        <span className="asset-total" style={{ background: '#f5f0ff', color: '#7C57D6', padding: '8px 16px', borderRadius: '10px', fontWeight: 700 }}>
          {pagination.total} Aset di Gudang
        </span>
      </div>

      {/* FILTERS */}
      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} strokeWidth={1.8} />
          <input type="text" placeholder="Cari nama barang, kode, merk..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGudang(1)} />
        </div>
        <div className="asset-filter">
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
            <option value="">Semua Jenis BMN</option>
            <option value="MESIN PERALATAN NON TIK">Mesin Peralatan Non TIK</option>
            <option value="ASET TETAP LAINNYA">Aset Tetap Lainnya</option>
            <option value="MESIN PERALATAN KHUSUS TIK">Mesin Peralatan Khusus TIK</option>
            <option value="INSTALASI DAN JARINGAN">Instalasi dan Jaringan</option>
            <option value="BANGUNAN DAN GEDUNG">Bangunan dan Gedung</option>
            <option value="KENDARAAN BERMOTOR">Kendaraan Bermotor</option>
          </select>
        </div>
        <div className="asset-filter">
          <select value={filterKondisi} onChange={(e) => setFilterKondisi(e.target.value)}>
            <option value="">Semua Kondisi</option>
            <option value="Baik">Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={() => fetchGudang(1)}>Cari</button>
      </div>

      {/* TABLE */}
      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>Daftar Aset di Gudang</h3><p>Aset yang tersedia untuk diklaim oleh operator unit</p></div>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Kode Barang</th>
                <th>NUP</th>
                <th>Nama Barang</th>
                <th>Jenis BMN</th>
                <th>Merk</th>
                <th>Kondisi</th>
                <th>Nilai Perolehan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Memuat data gudang...</td></tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    <Package size={36} strokeWidth={1} style={{ marginBottom: '8px', opacity: 0.4 }} /><br />
                    Gudang kosong — tidak ada aset yang belum diklaim
                  </td>
                </tr>
              ) : (
                assets.map(asset => {
                  const kc = kondisiColor(asset.kondisi)
                  return (
                    <tr key={asset.id}>
                      <td><span className="asset-code">{asset.kode_barang || '-'}</span></td>
                      <td style={{ fontWeight: 600, fontSize: '12px' }}>{asset.nup || '-'}</td>
                      <td><span className="asset-name">{asset.nama_barang}</span></td>
                      <td style={{ fontSize: '11px' }}>{asset.jenis_bmn || '-'}</td>
                      <td style={{ fontSize: '12px', color: '#666' }}>{asset.merk || '-'}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: kc.bg, color: kc.color }}>
                          {asset.kondisi}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#149E93', fontSize: '12px' }}>{fmtIDR(asset.nilai_perolehan)}</td>
                      <td>
                        <div className="asset-actions">
                          <button type="button" title="Lihat Detail" onClick={() => handleView(asset.id)}><Eye size={15} /></button>
                          {isOperator && (
                            <button type="button" title="Ajukan Klaim ke Unit Saya" onClick={() => handleClaim(asset)}
                              style={{ color: '#7C57D6' }}>
                              <ArrowDownToLine size={15} />
                            </button>
                          )}
                          {isAdmin && (
                            <button type="button" title="Assign ke Unit" onClick={() => handleAssignOpen(asset)}
                              style={{ color: '#527bd8' }}>
                              <ArrowDownToLine size={15} />
                            </button>
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
        {renderPagination()}
      </div>

      {/* DETAIL MODAL */}
      {showDetail && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Aset</h2>
              <button onClick={() => setShowDetail(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto', fontSize: '13px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div><strong>Nama Barang:</strong> <span style={{ fontSize: '15px', fontWeight: 700 }}>{selectedAsset.nama_barang}</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div><strong>Kode Barang:</strong> {selectedAsset.kode_barang || '-'}</div>
                  <div><strong>NUP:</strong> {selectedAsset.nup || '-'}</div>
                  <div><strong>Kode Register:</strong> {selectedAsset.kode_register || '-'}</div>
                  <div><strong>Jenis BMN:</strong> {selectedAsset.jenis_bmn || '-'}</div>
                  <div><strong>Merk:</strong> {selectedAsset.merk || '-'}</div>
                  <div><strong>Tipe:</strong> {selectedAsset.tipe || '-'}</div>
                  <div><strong>Kondisi:</strong> {selectedAsset.kondisi}</div>
                  <div><strong>Umur Aset:</strong> {selectedAsset.umur_aset || '0'} tahun</div>
                  <div><strong>Nilai Perolehan:</strong> {fmtIDR(selectedAsset.nilai_perolehan)}</div>
                  <div><strong>Nilai Buku:</strong> {fmtIDR(selectedAsset.nilai_buku)}</div>
                  <div><strong>Tgl Perolehan:</strong> {selectedAsset.tanggal_perolehan || '-'}</div>
                  <div><strong>Intra/Ekstra:</strong> {selectedAsset.intra_ekstra || '-'}</div>
                  <div><strong>Satker:</strong> {selectedAsset.nama_satker || '-'}</div>
                  <div><strong>Status Penggunaan:</strong> {selectedAsset.status_penggunaan || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ASSIGN MODAL */}
      {showAssign && assignAsset && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Aset ke Unit</h2>
              <button onClick={() => setShowAssign(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '12px' }}>
                <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>{assignAsset.nama_barang}</strong><br />
                  <span style={{ color: '#666', fontSize: '12px' }}>{assignAsset.kode_barang || '-'} / NUP {assignAsset.nup || '-'}</span>
                </div>
                <div>
                  <label>Unit Tujuan *</label>
                  <select value={assignData.unit_id} required onChange={e => {
                    setAssignData({ ...assignData, unit_id: e.target.value, location_id: '' })
                    fetchLocationsForUnit(e.target.value)
                  }}>
                    <option value="">Pilih Unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                  </select>
                </div>
                <div>
                  <label>Lokasi</label>
                  <select value={assignData.location_id} onChange={e => setAssignData({ ...assignData, location_id: e.target.value })}>
                    <option value="">Pilih Lokasi</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowAssign(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="add-asset-button">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gudang
