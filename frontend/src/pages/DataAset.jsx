import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, X } from 'lucide-react'
import { assetsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const CATEGORIES = ['Elektronik', 'Furnitur', 'Kendaraan', 'Peralatan Laboratorium', 'Alat Kantor', 'Olahraga']
const CONDITIONS = ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT']
const STATUSES = ['TERSEDIA', 'DIPINJAM', 'DALAM_PERBAIKAN', 'RUSAK', 'DIHAPUSKAN']
const UNITS = ['Fakultas Teknik dan Kemaritiman', 'Fakultas Ekonomi dan Bisnis Maritim', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Fakultas Kelautan dan Ilmu Perikanan', 'Fakultas Ilmu Keguruan dan Pendidikan', 'Fakultas Kedokteran', 'Rektorat', 'Perpustakaan', 'Bagian Umum']

const condLabel = (c) => c?.replace(/_/g, ' ') || c
const statusLabel = (s) => s?.replace(/_/g, ' ') || s
const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

function DataAset() {
  const { toast, showConfirm } = useToast()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', condition: '', status: '' })
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    code: '', name: '', category: '', description: '', unit: '',
    location: '', floor: '', purchase_year: '', purchase_price: '',
    rental_price_per_day: '', condition: 'BAIK', status: 'TERSEDIA', notes: ''
  })

  useEffect(() => { fetchAssets() }, [])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = { search: searchQuery, category: filters.category, condition: filters.condition, status: filters.status, limit: 100 }
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
    setFormData({ code: '', name: '', category: '', description: '', unit: '', location: '', floor: '', purchase_year: '', purchase_price: '', rental_price_per_day: '', condition: 'BAIK', status: 'TERSEDIA', notes: '' })
    setShowModal(true)
  }

  const handleEdit = (asset) => {
    setModalMode('edit')
    setSelectedAsset(asset)
    setFormData({
      code: asset.code || '', name: asset.name || '', category: asset.category || '',
      description: asset.description || '', unit: asset.unit || '', location: asset.location || '',
      floor: asset.floor || '', purchase_year: asset.purchase_year || '',
      purchase_price: asset.purchase_price || '', rental_price_per_day: asset.rental_price_per_day || '',
      condition: asset.condition || 'BAIK', status: asset.status || 'TERSEDIA', notes: asset.notes || ''
    })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Send as JSON, not FormData (unless there's a photo)
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
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>Data Aset</h1>
          <p>Kelola seluruh aset dan inventaris universitas</p>
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
          <div><h3>Daftar Aset</h3><p>Menampilkan seluruh aset yang terdaftar</p></div>
          <span className="asset-total">{assets.length} Aset</span>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Kode</th><th>Nama Aset</th><th>Kategori</th><th>Unit / Lokasi</th>
                <th>Sewa/Hari</th><th>Kondisi</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada data aset</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td><span className="asset-code">{asset.code}</span></td>
                    <td><span className="asset-name">{asset.name}</span></td>
                    <td>{asset.category}</td>
                    <td><span className="asset-location">{asset.location}</span></td>
                    <td style={{ fontWeight: 600, color: '#149E93' }}>{fmtIDR(asset.rental_price_per_day)}</td>
                    <td><span className={`condition-badge ${(asset.condition || '').toLowerCase().replace(/_/g, '-')}`}>{condLabel(asset.condition)}</span></td>
                    <td><span className={`asset-status ${(asset.status || '').toLowerCase().replace(/_/g, '-')}`}>{statusLabel(asset.status)}</span></td>
                    <td>
                      <div className="asset-actions">
                        <button type="button" title="Lihat" onClick={() => handleView(asset.id)}><Eye size={15} /></button>
                        <button type="button" title="Edit" onClick={() => handleEdit(asset)}><Pencil size={15} /></button>
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

      {/* MODAL */}
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
                  <div><strong>Unit:</strong> {selectedAsset.unit}</div>
                  <div><strong>Lokasi:</strong> {selectedAsset.location}</div>
                  <div><strong>Lantai:</strong> {selectedAsset.floor || '-'}</div>
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
                    <select name="unit" value={formData.unit} onChange={handleInputChange} required>
                      <option value="">Pilih Unit</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div><label>Lokasi *</label><input type="text" name="location" value={formData.location} onChange={handleInputChange} required placeholder="cth: Gedung A - Lab 1" /></div>
                  <div><label>Lantai</label><input type="text" name="floor" value={formData.floor} onChange={handleInputChange} /></div>
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
    </div>
  )
}

export default DataAset