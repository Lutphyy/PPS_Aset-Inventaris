import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, X, ArrowRightLeft } from 'lucide-react'
import { assetsAPI, unitsAPI, locationsAPI, masterDataAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const condLabel = (c) => c?.replace(/_/g, ' ') || c
const statusLabel = (s) => s?.replace(/_/g, ' ') || s
const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

function DataAset() {
  const { toast, showConfirm } = useToast()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', condition: '', status: '', unit_id: '' })
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [saving, setSaving] = useState(false)

  // Master data from API
  const [CATEGORIES, setCategories] = useState(['Elektronik', 'Furnitur', 'Kendaraan', 'Peralatan Laboratorium', 'Alat Kantor', 'Olahraga'])
  const [CONDITIONS, setConditions] = useState(['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT'])
  const [STATUSES, setStatuses] = useState(['TERSEDIA', 'DIPINJAM', 'DALAM_PERBAIKAN', 'RUSAK', 'DIPINDAHKAN', 'DIMUSNAHKAN'])

  // Unit & Location data from API
  const [units, setUnits] = useState([])
  const [locations, setLocations] = useState([])
  const [allLocations, setAllLocations] = useState([])

  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferData, setTransferData] = useState({ to_unit_id: '', to_location_id: '', reason: '' })
  const [transferAsset, setTransferAsset] = useState(null)
  const [transferLocations, setTransferLocations] = useState([])

  const [formData, setFormData] = useState({
    code: '', name: '', category: '', description: '', unit_id: '',
    location_id: '', purchase_year: '', purchase_price: '',
    rental_price_per_day: '', condition: 'BAIK', status: 'TERSEDIA', notes: ''
  })

  useEffect(() => {
    fetchAssets()
    fetchUnits()
    fetchAllLocations()
    fetchMasterData()
  }, [])

  const fetchUnits = async () => {
    try {
      const res = await unitsAPI.getAll({ active_only: true })
      setUnits(res.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchAllLocations = async () => {
    try {
      const res = await locationsAPI.getAll({ active_only: true })
      setAllLocations(res.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchMasterData = async () => {
    try {
      const res = await masterDataAPI.getAll()
      if (res.success && res.data) {
        if (res.data.categories?.length) setCategories(res.data.categories)
        if (res.data.conditions?.length) setConditions(res.data.conditions)
        if (res.data.statuses?.length) setStatuses(res.data.statuses)
      }
    } catch (err) { console.error('Master data fetch error:', err) }
  }

  const fetchLocationsForUnit = async (unitId) => {
    if (!unitId) { setLocations([]); return }
    try {
      const res = await locationsAPI.getAll({ unit_id: unitId, active_only: true })
      setLocations(res.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = { search: searchQuery, category: filters.category, condition: filters.condition, status: filters.status, unit_id: filters.unit_id, limit: 100 }
      const response = await assetsAPI.getAll(params)
      setAssets(response.data || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const doSearch = () => fetchAssets()

  const handleAdd = () => {
    setModalMode('add')
    const defaultUnitId = user.role === 'OPERATOR' && user.unit_id ? user.unit_id : ''
    setFormData({ code: '', name: '', category: '', description: '', unit_id: defaultUnitId, location_id: '', purchase_year: '', purchase_price: '', rental_price_per_day: '', condition: 'BAIK', status: 'TERSEDIA', notes: '' })
    if (defaultUnitId) fetchLocationsForUnit(defaultUnitId)
    setShowModal(true)
  }

  const handleEdit = (asset) => {
    setModalMode('edit')
    setSelectedAsset(asset)
    setFormData({
      code: asset.code || '', name: asset.name || '', category: asset.category || '',
      description: asset.description || '', unit_id: asset.unit_id || '', location_id: asset.location_id || '',
      purchase_year: asset.purchase_year || '',
      purchase_price: asset.purchase_price || '', rental_price_per_day: asset.rental_price_per_day || '',
      condition: asset.condition || 'BAIK', status: asset.status || 'TERSEDIA', notes: asset.notes || ''
    })
    if (asset.unit_id) fetchLocationsForUnit(asset.unit_id)
    setShowModal(true)
  }

  const handleView = async (assetId) => {
    try {
      const response = await assetsAPI.getById(assetId)
      setSelectedAsset(response.data)
      setModalMode('view')
      setShowModal(true)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat detail aset')
    }
  }

  const handleDelete = async (assetId, assetName) => {
    const confirmed = await showConfirm(`Hapus aset "${assetName}"?`, { title: 'Hapus Aset', confirmText: 'Ya, Hapus', variant: 'danger' })
    if (!confirmed) return
    try {
      await assetsAPI.delete(assetId)
      toast.success('Aset berhasil dihapus')
      fetchAssets()
    } catch (error) {
      toast.error('Gagal menghapus aset: ' + error.message)
    }
  }

  const handleTransferOpen = (asset) => {
    setTransferAsset(asset)
    setTransferData({ to_unit_id: '', to_location_id: '', reason: '' })
    setTransferLocations([])
    setShowTransfer(true)
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    try {
      await assetsAPI.transfer(transferAsset.id, transferData)
      toast.success('Aset berhasil dipindahkan!')
      setShowTransfer(false)
      fetchAssets()
    } catch (err) { toast.error(err.message) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) payload[key] = formData[key]
      })

      if (modalMode === 'add') {
        await assetsAPI.create(payload)
        toast.success('Aset berhasil ditambahkan!')
      } else {
        await assetsAPI.update(selectedAsset.id, payload)
        toast.success('Aset berhasil diupdate!')
      }
      setShowModal(false)
      fetchAssets()
    } catch (error) {
      toast.error('Gagal menyimpan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (name === 'unit_id') {
      setFormData(prev => ({ ...prev, unit_id: value, location_id: '' }))
      fetchLocationsForUnit(value)
    }
  }

  const isOperator = user.role === 'OPERATOR'

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>Data Aset</h1>
          <p>{isOperator ? `Kelola aset unit Anda` : 'Kelola seluruh aset dan inventaris'}</p>
        </div>
        <button type="button" className="add-asset-button" onClick={handleAdd}>
          <Plus size={17} strokeWidth={2} />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} strokeWidth={1.8} />
          <input type="text" placeholder="Cari nama atau kode aset..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
        </div>
        {!isOperator && (
          <div className="asset-filter">
            <select value={filters.unit_id} onChange={(e) => setFilters({ ...filters, unit_id: e.target.value })}>
              <option value="">Semua Unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </select>
          </div>
        )}
        <div className="asset-filter">
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="asset-filter">
          <select value={filters.condition} onChange={(e) => setFilters({ ...filters, condition: e.target.value })}>
            <option value="">Semua Kondisi</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{condLabel(c)}</option>)}
          </select>
        </div>
        <div className="asset-filter">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Semua Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={doSearch}>Cari</button>
      </div>

      {/* TABLE */}
      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>Daftar Aset</h3><p>Menampilkan {isOperator ? 'aset unit Anda' : 'seluruh aset'}</p></div>
          <span className="asset-total">{assets.length} Aset</span>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Kode</th><th>Nama Aset</th><th>Kategori</th><th>Unit</th><th>Lokasi</th>
                <th>Sewa/Hari</th><th>Kondisi</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada data aset</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td><span className="asset-code">{asset.code}</span></td>
                    <td><span className="asset-name">{asset.name}</span></td>
                    <td>{asset.category}</td>
                    <td><span style={{ fontSize: '11px', fontWeight: 600, color: '#527bd8' }}>{asset.unit?.name || '-'}</span></td>
                    <td><span className="asset-location">{asset.location?.name || '-'}</span></td>
                    <td style={{ fontWeight: 600, color: '#149E93' }}>{fmtIDR(asset.rental_price_per_day)}</td>
                    <td><span className={`condition-badge ${(asset.condition || '').toLowerCase().replace(/_/g, '-')}`}>{condLabel(asset.condition)}</span></td>
                    <td><span className={`asset-status ${(asset.status || '').toLowerCase().replace(/_/g, '-')}`}>{statusLabel(asset.status)}</span></td>
                    <td>
                      <div className="asset-actions">
                        <button type="button" title="Lihat" onClick={() => handleView(asset.id)}><Eye size={15} /></button>
                        <button type="button" title="Edit" onClick={() => handleEdit(asset)}><Pencil size={15} /></button>
                        {!isOperator && asset.status === 'TERSEDIA' && (
                          <button type="button" title="Pindahkan" onClick={() => handleTransferOpen(asset)} style={{ color: '#527bd8' }}><ArrowRightLeft size={15} /></button>
                        )}
                        <button type="button" className="delete" title="Hapus" onClick={() => handleDelete(asset.id, asset.name)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSET MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Tambah Aset' : modalMode === 'edit' ? 'Edit Aset' : 'Detail Aset'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            {modalMode === 'view' && selectedAsset ? (
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div><strong>Kode:</strong> {selectedAsset.code}</div>
                  <div><strong>Nama:</strong> {selectedAsset.name}</div>
                  <div><strong>Kategori:</strong> {selectedAsset.category}</div>
                  <div><strong>Unit:</strong> {selectedAsset.unit?.name || '-'} ({selectedAsset.unit?.code || '-'})</div>
                  <div><strong>Lokasi:</strong> {selectedAsset.location?.name || '-'}</div>
                  <div><strong>Tahun Perolehan:</strong> {selectedAsset.purchase_year || '-'}</div>
                  <div><strong>Harga Perolehan:</strong> {fmtIDR(selectedAsset.purchase_price)}</div>
                  <div><strong>Harga Sewa/Hari:</strong> {fmtIDR(selectedAsset.rental_price_per_day)}</div>
                  <div><strong>Kondisi:</strong> <span className={`condition-badge ${(selectedAsset.condition||'').toLowerCase().replace(/_/g,'-')}`}>{condLabel(selectedAsset.condition)}</span></div>
                  <div><strong>Status:</strong> <span className={`asset-status ${(selectedAsset.status||'').toLowerCase().replace(/_/g,'-')}`}>{statusLabel(selectedAsset.status)}</span></div>
                  {selectedAsset.description && <div><strong>Deskripsi:</strong> {selectedAsset.description}</div>}
                  {selectedAsset.notes && <div><strong>Catatan:</strong> {selectedAsset.notes}</div>}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                  <div><label>Kode Aset *</label><input type="text" name="code" value={formData.code} onChange={handleInputChange} required /></div>
                  <div><label>Nama Aset *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                  <div>
                    <label>Kategori *</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                      <option value="">Pilih Kategori</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Unit *</label>
                    <select name="unit_id" value={formData.unit_id} onChange={handleInputChange} required disabled={isOperator}>
                      <option value="">Pilih Unit</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Lokasi *</label>
                    <select name="location_id" value={formData.location_id} onChange={handleInputChange} required>
                      <option value="">Pilih Lokasi</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}{l.floor ? ` (Lt. ${l.floor})` : ''}</option>)}
                    </select>
                  </div>
                  <div><label>Tahun Perolehan</label><input type="number" name="purchase_year" value={formData.purchase_year} onChange={handleInputChange} /></div>
                  <div><label>Harga Perolehan</label><input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} /></div>
                  <div><label>Harga Sewa/Hari *</label><input type="number" name="rental_price_per_day" value={formData.rental_price_per_day} onChange={handleInputChange} required /></div>
                  <div>
                    <label>Kondisi</label>
                    <select name="condition" value={formData.condition} onChange={handleInputChange}>
                      {CONDITIONS.map(c => <option key={c} value={c}>{condLabel(c)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}><label>Deskripsi</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label>Catatan</label><textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" /></div>
                </div>
                <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" className="add-asset-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransfer && transferAsset && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pindahkan Aset</h2>
              <button onClick={() => setShowTransfer(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '12px' }}>
                <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>{transferAsset.name}</strong> ({transferAsset.code})<br />
                  <span style={{ color: '#666' }}>Unit saat ini: {transferAsset.unit?.name || '-'}</span>
                </div>
                <div>
                  <label>Unit Tujuan *</label>
                  <select value={transferData.to_unit_id} onChange={e => {
                    setTransferData({ ...transferData, to_unit_id: e.target.value, to_location_id: '' })
                    locationsAPI.getAll({ unit_id: e.target.value }).then(r => setTransferLocations(r.data || []))
                  }} required>
                    <option value="">Pilih Unit Tujuan</option>
                    {units.filter(u => u.id !== transferAsset.unit_id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Lokasi Tujuan *</label>
                  <select value={transferData.to_location_id} onChange={e => setTransferData({ ...transferData, to_location_id: e.target.value })} required>
                    <option value="">Pilih Lokasi</option>
                    {transferLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label>Alasan Pemindahan *</label>
                  <textarea value={transferData.reason} onChange={e => setTransferData({ ...transferData, reason: e.target.value })} rows="2" required />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowTransfer(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="add-asset-button">Pindahkan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataAset