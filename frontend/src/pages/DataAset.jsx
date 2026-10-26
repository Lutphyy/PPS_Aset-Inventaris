import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, X, ArrowRightLeft, Upload, FileSpreadsheet, CheckCircle, XCircle, Package } from 'lucide-react'
import { assetsAPI, assetRequestsAPI, unitsAPI, locationsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const rentalLabel = (unit) => {
  const map = { per_jam: '/jam', per_hari: '/hari', per_minggu: '/minggu', per_bulan: '/bulan' }
  return map[unit] || '/hari'
}
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
  }
  return map[s] || { bg: '#f0f0f0', color: '#666' }
}

function DataAset() {
  const { toast, showConfirm } = useToast()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ jenis_bmn: '', kondisi: '', status: '', unit_id: '' })
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add, edit, view
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [saving, setSaving] = useState(false)

  // Import state
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  // Dropdown data
  const [units, setUnits] = useState([])
  const [locations, setLocations] = useState([])

  // Pagination
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })

  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferData, setTransferData] = useState({ to_unit_id: '', to_location_id: '', reason: '' })
  const [transferAsset, setTransferAsset] = useState(null)
  const [transferLocations, setTransferLocations] = useState([])

  const defaultFormData = {
    // Identifikasi
    kode_register: '', no_urut: '', jenis_bmn: '', kode_satker: '', nama_satker: '',
    kode_barang: '', nup: '', nama_barang: '',
    // Spesifikasi
    merk: '', tipe: '', kondisi: 'Baik', umur_aset: '', intra_ekstra: '', henti_guna: '',
    jumlah_lantai: '', jumlah_foto: '',
    // Status BMN
    status_sbsn: '', status_bmn_idle: '', status_kemitraan: '', bpybds: '',
    usulan_barang_hilang: '', usulan_barang_rb: '', usul_hapus: '',
    hibah_dktp: '', konsensi_jasa: '', properti_investasi: '',
    status_penggunaan: '',
    // Dokumen
    jenis_dokumen: '', no_dokumen: '', no_bpkp: '', no_polisi: '',
    kepemilikan: '', no_sertifikat: '', no_psp: '', tanggal_psp: '',
    // Keuangan
    nilai_perolehan: '', nilai_buku: '', nilai_penyusutan: '', nilai_mutasi: '',
    tanggal_perolehan: '', tanggal_buku_pertama: '', tanggal_penghapusan: '',
    // Luas
    luas_tanah_seluruhnya: '', luas_tanah_bangunan: '', luas_tanah_sarana_lingkungan: '',
    luas_lahan_kosong: '', luas_bangunan: '', luas_tapak_bangunan: '', luas_pemanfaatan: '',
    // Lokasi
    alamat: '', rt_rw: '', kelurahan_desa: '', kecamatan: '', kab_kota: '',
    kode_kab_kota: '', provinsi: '', kode_provinsi: '', kode_pos: '', lokasi_ruang: '',
    // Pengelolaan
    sbsk: '', optimalisasi: '', penghuni: '', pengguna_bmn: '',
    kode_kpknl: '', uraian_kpknl: '', uraian_kanwil_djkn: '',
    nama_kl: '', nama_e1: '', nama_korwil: '',
    // Peminjaman / Sistem
    is_borrowable: false, rental_price: '', rental_unit: 'per_hari',
    // System
    unit_id: '', location_id: '', notes: ''
  }

  const [formData, setFormData] = useState({ ...defaultFormData })
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    fetchAssets()
    fetchUnits()
  }, [])

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

  const fetchAssets = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        search: searchQuery,
        jenis_bmn: filters.jenis_bmn,
        kondisi: filters.kondisi,
        status: filters.status,
        unit_id: filters.unit_id,
        limit: 25,
        page,
      }
      const response = await assetsAPI.getAll(params)
      setAssets(response.data || [])
      setPagination(response.pagination || { total: 0, page: 1, totalPages: 1 })
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const doSearch = () => fetchAssets(1)

  const isAdmin = ['SUPER_ADMIN', 'ADMIN_UNIT'].includes(user.role)
  const isAdminUnit = user.role === 'ADMIN_UNIT'
  const isOperator = user.role === 'OPERATOR'
  const canImport = isAdminUnit
  const canAddAsset = isAdminUnit || isOperator
  const canToggleBorrowable = isAdminUnit
  const canTransfer = isAdmin || isOperator

  // Dynamic title based on role
  const selectedUnit = units.find(u => String(u.id) === String(filters.unit_id))
  const pageTitle = isOperator
    ? `Data Aset ${user.unit?.name || 'Unit Saya'}`
    : selectedUnit
      ? `Data Aset ${selectedUnit.name}`
      : 'Data Aset Seluruh Unit'

  // ===== IMPORT HANDLER =====
  const handleImport = async () => {
    if (!importFile) return toast.error('Pilih file Excel terlebih dahulu')
    setImporting(true)
    setImportResult(null)
    try {
      const result = await assetsAPI.importExcel(importFile)
      setImportResult(result.data)
      toast.success(result.message)
      fetchAssets()
    } catch (err) {
      toast.error('Gagal import: ' + err.message)
      setImportResult({ error: err.message })
    } finally {
      setImporting(false)
    }
  }

  // ===== BORROWABLE TOGGLE =====
  const handleToggleBorrowable = async (asset) => {
    try {
      const res = await assetsAPI.toggleBorrowable(asset.id)
      toast.success(res.message)
      fetchAssets(pagination.page)
    } catch (err) { toast.error(err.message) }
  }

  // ===== CRUD HANDLERS =====
  const handleAdd = () => {
    setModalMode('add')
    setFormData({ ...defaultFormData })
    setActiveTab(0)
    setShowModal(true)
  }

  const handleEdit = (asset) => {
    setModalMode('edit')
    setSelectedAsset(asset)
    const populated = {}
    Object.keys(defaultFormData).forEach(key => {
      populated[key] = asset[key] !== null && asset[key] !== undefined ? asset[key] : defaultFormData[key]
    })
    setFormData(populated)
    setActiveTab(0)
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
      toast.error('Gagal memuat detail aset')
    }
  }

  const handleDelete = async (assetId, assetName) => {
    const confirmed = await showConfirm(`Hapus aset "${assetName}"?`, { title: 'Hapus Aset', confirmText: 'Ya, Hapus', variant: 'danger' })
    if (!confirmed) return
    try {
      await assetsAPI.delete(assetId)
      toast.success('Aset berhasil dihapus')
      fetchAssets(pagination.page)
    } catch (error) {
      toast.error('Gagal menghapus aset: ' + error.message)
    }
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
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'unit_id') {
      setFormData(prev => ({ ...prev, unit_id: value, location_id: '' }))
      fetchLocationsForUnit(value)
    }
  }

  // ===== TRANSFER =====
  const handleTransferOpen = (asset) => {
    setTransferAsset(asset)
    setTransferData({ to_unit_id: '', to_location_id: '', reason: '' })
    setTransferLocations([])
    setShowTransfer(true)
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isOperator) {
        // Operator: create transfer request (needs admin approval)
        await assetRequestsAPI.requestTransfer(transferAsset.id, transferData)
        toast.success('Permintaan transfer berhasil diajukan! Menunggu persetujuan Admin Unit.')
      } else {
        // Admin: direct transfer
        await assetsAPI.transfer(transferAsset.id, transferData)
        toast.success('Aset berhasil dipindahkan!')
      }
      setShowTransfer(false)
      fetchAssets(pagination.page)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>{pageTitle}</h1>
          <p>{isOperator ? 'Kelola aset unit Anda' : 'Kelola seluruh aset dan inventaris BMN'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canImport && (
            <button type="button" className="add-asset-button"
              style={{ background: 'linear-gradient(135deg, #149E93, #0d7a71)', border: 'none' }}
              onClick={() => { setShowImport(true); setImportFile(null); setImportResult(null) }}>
              <Upload size={17} strokeWidth={2} />
              <span>Import Excel</span>
            </button>
          )}
          {canAddAsset && (
            <button type="button" className="add-asset-button" onClick={handleAdd}>
              <Plus size={17} strokeWidth={2} />
              <span>Tambah Aset</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} strokeWidth={1.8} />
          <input type="text" placeholder="Cari nama barang, kode, merk..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
          <select value={filters.jenis_bmn} onChange={(e) => setFilters({ ...filters, jenis_bmn: e.target.value })}>
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
          <select value={filters.kondisi} onChange={(e) => setFilters({ ...filters, kondisi: e.target.value })}>
            <option value="">Semua Kondisi</option>
            <option value="Baik">Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>
        </div>
        <div className="asset-filter">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Semua Status</option>
            <option value="GUDANG">Gudang</option>
            <option value="TERSEDIA">Tersedia</option>
            <option value="DIPINJAM">Dipinjam</option>
            <option value="PROSES_TRANSFER">Proses Transfer</option>
            <option value="DALAM_PERBAIKAN">Dalam Perbaikan</option>
            <option value="RUSAK">Rusak</option>
          </select>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={doSearch}>Cari</button>
      </div>

      {/* TABLE */}
      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>{pageTitle}</h3><p>Menampilkan {isOperator ? 'aset unit Anda' : selectedUnit ? `aset ${selectedUnit.name}` : 'seluruh aset'}</p></div>
          <span className="asset-total">{pagination.total} Aset</span>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Kode Barang</th><th>NUP</th><th>Nama Barang</th><th>Jenis BMN</th>
                <th>Merk</th><th>Kondisi</th><th>Nilai Perolehan</th>
                <th>Unit</th><th>Status</th>
                {canToggleBorrowable && <th>Pinjam?</th>}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canToggleBorrowable ? 11 : 10} style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={canToggleBorrowable ? 11 : 10} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada data aset</td></tr>
              ) : (
                assets.map((asset) => {
                  const kc = kondisiColor(asset.kondisi)
                  const sc = statusColor(asset.status)
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
                        <span style={{ fontSize: '11px', fontWeight: 600, color: asset.unit ? '#527bd8' : '#7C57D6' }}>
                          {asset.unit?.name || '📦 Gudang'}
                        </span>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {asset.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {canToggleBorrowable && (
                        <td>
                          {asset.status !== 'GUDANG' ? (
                            <button type="button"
                              onClick={() => handleToggleBorrowable(asset)}
                              style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                background: asset.is_borrowable ? '#e4f6f0' : '#fde8e8',
                                color: asset.is_borrowable ? '#299579' : '#d14343',
                              }}>
                              {asset.is_borrowable ? 'Ya' : 'Tidak'}
                            </button>
                          ) : <span style={{ fontSize: '10px', color: '#999' }}>-</span>}
                        </td>
                      )}
                      <td>
                        <div className="asset-actions">
                          <button type="button" title="Lihat Detail" onClick={() => handleView(asset.id)}><Eye size={15} /></button>
                          {(canAddAsset) && <button type="button" title="Edit" onClick={() => handleEdit(asset)}><Pencil size={15} /></button>}
                          {canTransfer && asset.status === 'TERSEDIA' && (
                            <button type="button" title="Pindahkan ke Unit Lain" onClick={() => handleTransferOpen(asset)} style={{ color: '#527bd8' }}>
                              <ArrowRightLeft size={15} />
                            </button>
                          )}
                          {isAdmin && (
                            <button type="button" className="delete" title="Hapus" onClick={() => handleDelete(asset.id, asset.nama_barang)}>
                              <Trash2 size={15} />
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
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '16px', borderTop: '1px solid #eee' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchAssets(p)}
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

      {/* ===== IMPORT MODAL ===== */}
      {showImport && (
        <div className="modal-overlay" onClick={() => !importing && setShowImport(false)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FileSpreadsheet size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Import Data Aset dari Excel</h2>
              <button onClick={() => !importing && setShowImport(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ background: '#f5f0ff', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', color: '#5a4b8a' }}>
                <strong>📦 Info:</strong> Semua aset yang diimport akan masuk ke <strong>Gudang</strong> terlebih dahulu.
                Operator dari masing-masing unit dapat mengklaim aset dari Gudang ke unit mereka.
              </div>

              {/* File input area */}
              <div
                onClick={() => !importing && fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #d0dcf4', borderRadius: '12px', padding: '32px', textAlign: 'center',
                  cursor: importing ? 'not-allowed' : 'pointer', transition: '0.2s',
                  background: importFile ? '#f0f7f4' : '#fafbff',
                }}>
                {importFile ? (
                  <div>
                    <CheckCircle size={32} color="#299579" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#299579' }}>{importFile.name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {(importFile.size / 1024).toFixed(1)} KB — Klik untuk ganti file
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="#527bd8" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Klik untuk pilih file Excel</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Format: .xlsx atau .xls (maks 20MB)</div>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={(e) => setImportFile(e.target.files[0] || null)} />

              {/* Import result */}
              {importResult && !importResult.error && (
                <div style={{ marginTop: '16px', background: '#f0f7f4', border: '1px solid #c3e6d5', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#299579', marginBottom: '10px' }}>
                    ✅ Import Berhasil!
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px' }}>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#299579' }}>{importResult.imported}</div>
                      <div style={{ color: '#666', fontSize: '11px' }}>Diimport</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#d4850d' }}>{importResult.skipped}</div>
                      <div style={{ color: '#666', fontSize: '11px' }}>Dilewati (duplikat)</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#d14343' }}>{importResult.errors?.length || 0}</div>
                      <div style={{ color: '#666', fontSize: '11px' }}>Error</div>
                    </div>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto', fontSize: '12px', color: '#d14343' }}>
                      {importResult.errors.map((err, i) => (
                        <div key={i}>Baris {err.row}: {err.message}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {importResult?.error && (
                <div style={{ marginTop: '16px', background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: '10px', padding: '14px', color: '#d14343', fontSize: '13px' }}>
                  <XCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  {importResult.error}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
              <button type="button" onClick={() => setShowImport(false)} disabled={importing}
                style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                {importResult ? 'Tutup' : 'Batal'}
              </button>
              {!importResult && (
                <button type="button" className="add-asset-button"
                  style={{ background: 'linear-gradient(135deg, #149E93, #0d7a71)', border: 'none' }}
                  disabled={!importFile || importing} onClick={handleImport}>
                  {importing ? (
                    <><span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Mengimport...</>
                  ) : (
                    <><Upload size={15} /> Import Sekarang</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== VIEW / EDIT MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Tambah Aset' : modalMode === 'edit' ? 'Edit Aset' : 'Detail Aset BMN'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            {modalMode === 'view' && selectedAsset ? (
              <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                  {/* IDENTIFIKASI */}
                  <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#7C57D6', marginBottom: '6px', fontSize: '12px' }}>IDENTIFIKASI</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>No Urut:</strong> {selectedAsset.no_urut || '-'}</div>
                      <div><strong>Kode Register:</strong> {selectedAsset.kode_register || '-'}</div>
                      <div><strong>Kode Barang:</strong> {selectedAsset.kode_barang || '-'}</div>
                      <div><strong>NUP:</strong> {selectedAsset.nup || '-'}</div>
                      <div><strong>Jenis BMN:</strong> {selectedAsset.jenis_bmn || '-'}</div>
                      <div><strong>Kode Satker:</strong> {selectedAsset.kode_satker || '-'}</div>
                      <div><strong>Nama Satker:</strong> {selectedAsset.nama_satker || '-'}</div>
                    </div>
                  </div>
                  <div><strong>Nama Barang:</strong> <span style={{ fontSize: '15px', fontWeight: 700 }}>{selectedAsset.nama_barang}</span></div>

                  {/* SPESIFIKASI */}
                  <div style={{ background: '#fef9f0', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#d4850d', marginBottom: '6px', fontSize: '12px' }}>SPESIFIKASI</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Merk:</strong> {selectedAsset.merk || '-'}</div>
                      <div><strong>Tipe:</strong> {selectedAsset.tipe || '-'}</div>
                      <div><strong>Kondisi:</strong> <span style={{ ...kondisiColor(selectedAsset.kondisi), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{selectedAsset.kondisi}</span></div>
                      <div><strong>Umur Aset:</strong> {selectedAsset.umur_aset || '0'} tahun</div>
                      <div><strong>Intra/Ekstra:</strong> {selectedAsset.intra_ekstra || '-'}</div>
                      <div><strong>Jumlah Lantai:</strong> {selectedAsset.jumlah_lantai || '-'}</div>
                      <div><strong>Jumlah Foto:</strong> {selectedAsset.jumlah_foto || '-'}</div>
                    </div>
                  </div>

                  {/* STATUS BMN */}
                  <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#527bd8', marginBottom: '6px', fontSize: '12px' }}>STATUS BMN</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Status:</strong> <span style={{ ...statusColor(selectedAsset.status), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{selectedAsset.status}</span></div>
                      <div><strong>Status Penggunaan:</strong> {selectedAsset.status_penggunaan || '-'}</div>
                      <div><strong>Henti Guna:</strong> {selectedAsset.henti_guna || '-'}</div>
                      <div><strong>Status SBSN:</strong> {selectedAsset.status_sbsn || '-'}</div>
                      <div><strong>Status BMN Idle:</strong> {selectedAsset.status_bmn_idle || '-'}</div>
                      <div><strong>Status Kemitraan:</strong> {selectedAsset.status_kemitraan || '-'}</div>
                      <div><strong>BPYBDS:</strong> {selectedAsset.bpybds || '-'}</div>
                      <div><strong>Usulan Barang Hilang:</strong> {selectedAsset.usulan_barang_hilang || '-'}</div>
                      <div><strong>Usulan Barang RB:</strong> {selectedAsset.usulan_barang_rb || '-'}</div>
                      <div><strong>Usul Hapus:</strong> {selectedAsset.usul_hapus || '-'}</div>
                      <div><strong>Hibah DKTP:</strong> {selectedAsset.hibah_dktp || '-'}</div>
                      <div><strong>Konsensi Jasa:</strong> {selectedAsset.konsensi_jasa || '-'}</div>
                      <div><strong>Properti Investasi:</strong> {selectedAsset.properti_investasi || '-'}</div>
                    </div>
                  </div>

                  {/* DOKUMEN */}
                  <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#555', marginBottom: '6px', fontSize: '12px' }}>DOKUMEN</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Jenis Dokumen:</strong> {selectedAsset.jenis_dokumen || '-'}</div>
                      <div><strong>No Dokumen:</strong> {selectedAsset.no_dokumen || '-'}</div>
                      <div><strong>No BPKP:</strong> {selectedAsset.no_bpkp || '-'}</div>
                      <div><strong>No Polisi:</strong> {selectedAsset.no_polisi || '-'}</div>
                      <div><strong>Kepemilikan:</strong> {selectedAsset.kepemilikan || '-'}</div>
                      <div><strong>No Sertifikat:</strong> {selectedAsset.no_sertifikat || '-'}</div>
                      <div><strong>No PSP:</strong> {selectedAsset.no_psp || '-'}</div>
                      <div><strong>Tanggal PSP:</strong> {selectedAsset.tanggal_psp || '-'}</div>
                    </div>
                  </div>

                  {/* KEUANGAN */}
                  <div style={{ background: '#f0f7f4', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#299579', marginBottom: '6px', fontSize: '12px' }}>KEUANGAN</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Nilai Perolehan:</strong> {fmtIDR(selectedAsset.nilai_perolehan)}</div>
                      <div><strong>Nilai Buku:</strong> {fmtIDR(selectedAsset.nilai_buku)}</div>
                      <div><strong>Nilai Penyusutan:</strong> {fmtIDR(selectedAsset.nilai_penyusutan)}</div>
                      <div><strong>Nilai Mutasi:</strong> {fmtIDR(selectedAsset.nilai_mutasi)}</div>
                      <div><strong>Tgl Perolehan:</strong> {selectedAsset.tanggal_perolehan || '-'}</div>
                      <div><strong>Tgl Buku Pertama:</strong> {selectedAsset.tanggal_buku_pertama || '-'}</div>
                      <div><strong>Tgl Penghapusan:</strong> {selectedAsset.tanggal_penghapusan || '-'}</div>
                    </div>
                  </div>

                  {/* LUAS */}
                  <div style={{ background: '#f5f0ff', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#7C57D6', marginBottom: '6px', fontSize: '12px' }}>LUAS (m²)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Tanah Seluruhnya:</strong> {selectedAsset.luas_tanah_seluruhnya || '-'}</div>
                      <div><strong>Tanah Bangunan:</strong> {selectedAsset.luas_tanah_bangunan || '-'}</div>
                      <div><strong>Tanah Sarana Lingkungan:</strong> {selectedAsset.luas_tanah_sarana_lingkungan || '-'}</div>
                      <div><strong>Lahan Kosong:</strong> {selectedAsset.luas_lahan_kosong || '-'}</div>
                      <div><strong>Bangunan:</strong> {selectedAsset.luas_bangunan || '-'}</div>
                      <div><strong>Tapak Bangunan:</strong> {selectedAsset.luas_tapak_bangunan || '-'}</div>
                      <div><strong>Pemanfaatan:</strong> {selectedAsset.luas_pemanfaatan || '-'}</div>
                    </div>
                  </div>

                  {/* LOKASI */}
                  <div style={{ background: '#fef9f0', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#d4850d', marginBottom: '6px', fontSize: '12px' }}>LOKASI</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Unit:</strong> {selectedAsset.unit?.name || '📦 Gudang'}</div>
                      <div><strong>Lokasi (sistem):</strong> {selectedAsset.location?.name || '-'}</div>
                      <div><strong>Alamat:</strong> {selectedAsset.alamat || '-'}</div>
                      <div><strong>RT/RW:</strong> {selectedAsset.rt_rw || '-'}</div>
                      <div><strong>Kelurahan/Desa:</strong> {selectedAsset.kelurahan_desa || '-'}</div>
                      <div><strong>Kecamatan:</strong> {selectedAsset.kecamatan || '-'}</div>
                      <div><strong>Kab/Kota:</strong> {selectedAsset.kab_kota || '-'}</div>
                      <div><strong>Kode Kab/Kota:</strong> {selectedAsset.kode_kab_kota || '-'}</div>
                      <div><strong>Provinsi:</strong> {selectedAsset.provinsi || '-'}</div>
                      <div><strong>Kode Provinsi:</strong> {selectedAsset.kode_provinsi || '-'}</div>
                      <div><strong>Kode Pos:</strong> {selectedAsset.kode_pos || '-'}</div>
                      <div><strong>Lokasi Ruang:</strong> {selectedAsset.lokasi_ruang || '-'}</div>
                    </div>
                  </div>

                  {/* PENGELOLAAN */}
                  <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#527bd8', marginBottom: '6px', fontSize: '12px' }}>PENGELOLAAN</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>SBSK:</strong> {selectedAsset.sbsk || '-'}</div>
                      <div><strong>Optimalisasi:</strong> {selectedAsset.optimalisasi || '-'}</div>
                      <div><strong>Penghuni:</strong> {selectedAsset.penghuni || '-'}</div>
                      <div><strong>Pengguna BMN:</strong> {selectedAsset.pengguna_bmn || '-'}</div>
                      <div><strong>Kode KPKNL:</strong> {selectedAsset.kode_kpknl || '-'}</div>
                      <div><strong>Uraian KPKNL:</strong> {selectedAsset.uraian_kpknl || '-'}</div>
                      <div><strong>Uraian Kanwil DJKN:</strong> {selectedAsset.uraian_kanwil_djkn || '-'}</div>
                      <div><strong>Nama K/L:</strong> {selectedAsset.nama_kl || '-'}</div>
                      <div><strong>Nama E1:</strong> {selectedAsset.nama_e1 || '-'}</div>
                      <div><strong>Nama Korwil:</strong> {selectedAsset.nama_korwil || '-'}</div>
                    </div>
                  </div>

                  {/* PEMINJAMAN */}
                  <div style={{ background: '#e9f0ff', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#527bd8', marginBottom: '6px', fontSize: '12px' }}>PEMINJAMAN</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div><strong>Bisa Dipinjam:</strong> {selectedAsset.is_borrowable ? '✅ Ya' : '❌ Tidak'}</div>
                      <div><strong>Harga Sewa:</strong> {selectedAsset.rental_price ? fmtIDR(selectedAsset.rental_price) + rentalLabel(selectedAsset.rental_unit) : '-'}</div>
                      <div><strong>Diklaim Oleh:</strong> {selectedAsset.claimed_by?.name || '-'}</div>
                      <div><strong>Tgl Klaim:</strong> {selectedAsset.claimed_at || '-'}</div>
                    </div>
                  </div>

                  {selectedAsset.notes && <div><strong>Catatan:</strong> {selectedAsset.notes}</div>}
                </div>
              </div>
            ) : (() => {
              const tabs = [
                { label: '📋 Identifikasi', color: '#7C57D6' },
                { label: '⚙️ Spesifikasi', color: '#d4850d' },
                { label: '📊 Status BMN', color: '#527bd8' },
                { label: '📄 Dokumen', color: '#555' },
                { label: '💰 Keuangan', color: '#299579' },
                { label: '📐 Luas', color: '#7C57D6' },
                { label: '📍 Lokasi', color: '#d4850d' },
                { label: '🏛️ Pengelolaan', color: '#527bd8' },
                { label: '🔧 Sistem', color: '#149E93' },
              ]

              const FormField = ({ label, name, type = 'text', required, children }) => (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>{label}{required && ' *'}</label>
                  {children || (
                    <input type={type} name={name} value={formData[name]} onChange={handleInputChange}
                      required={required} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff', transition: '0.2s' }} />
                  )}
                </div>
              )

              const SectionGrid = ({ children }) => (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
              )

              const tabContent = [
                // 0: Identifikasi
                <SectionGrid key="tab0">
                  <FormField label="Nama Barang" name="nama_barang" required />
                  <FormField label="Kode Register" name="kode_register" />
                  <FormField label="Kode Barang" name="kode_barang" />
                  <FormField label="NUP" name="nup" />
                  <FormField label="No Urut" name="no_urut" type="number" />
                  <FormField label="Jenis BMN" name="jenis_bmn">
                    <select name="jenis_bmn" value={formData.jenis_bmn} onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                      <option value="">Pilih Jenis</option>
                      <option value="MESIN PERALATAN NON TIK">Mesin Peralatan Non TIK</option>
                      <option value="ASET TETAP LAINNYA">Aset Tetap Lainnya</option>
                      <option value="MESIN PERALATAN KHUSUS TIK">Mesin Peralatan Khusus TIK</option>
                      <option value="INSTALASI DAN JARINGAN">Instalasi dan Jaringan</option>
                      <option value="BANGUNAN DAN GEDUNG">Bangunan dan Gedung</option>
                      <option value="KENDARAAN BERMOTOR">Kendaraan Bermotor</option>
                    </select>
                  </FormField>
                  <FormField label="Kode Satker" name="kode_satker" />
                  <FormField label="Nama Satker" name="nama_satker" />
                </SectionGrid>,

                // 1: Spesifikasi
                <SectionGrid key="tab1">
                  <FormField label="Merk" name="merk" />
                  <FormField label="Tipe" name="tipe" />
                  <FormField label="Kondisi" name="kondisi">
                    <select name="kondisi" value={formData.kondisi} onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                      <option value="Baik">Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                    </select>
                  </FormField>
                  <FormField label="Umur Aset (tahun)" name="umur_aset" type="number" />
                  <FormField label="Intra/Ekstra" name="intra_ekstra">
                    <select name="intra_ekstra" value={formData.intra_ekstra} onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                      <option value="">Pilih</option>
                      <option value="Intrakomptabel">Intrakomptabel</option>
                      <option value="Ekstrakomptabel">Ekstrakomptabel</option>
                    </select>
                  </FormField>
                  <FormField label="Henti Guna" name="henti_guna">
                    <select name="henti_guna" value={formData.henti_guna} onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                      <option value="">Pilih</option>
                      <option value="Ya">Ya</option>
                      <option value="Tidak">Tidak</option>
                    </select>
                  </FormField>
                  <FormField label="Jumlah Lantai" name="jumlah_lantai" type="number" />
                  <FormField label="Jumlah Foto" name="jumlah_foto" type="number" />
                </SectionGrid>,

                // 2: Status BMN
                <SectionGrid key="tab2">
                  <FormField label="Status Penggunaan" name="status_penggunaan" />
                  <FormField label="Status SBSN" name="status_sbsn" />
                  <FormField label="Status BMN Idle" name="status_bmn_idle" />
                  <FormField label="Status Kemitraan" name="status_kemitraan" />
                  <FormField label="BPYBDS" name="bpybds" />
                  <FormField label="Usulan Barang Hilang" name="usulan_barang_hilang" />
                  <FormField label="Usulan Barang RB" name="usulan_barang_rb" />
                  <FormField label="Usul Hapus" name="usul_hapus" />
                  <FormField label="Hibah DKTP" name="hibah_dktp" />
                  <FormField label="Konsensi Jasa" name="konsensi_jasa" />
                  <FormField label="Properti Investasi" name="properti_investasi" />
                </SectionGrid>,

                // 3: Dokumen
                <SectionGrid key="tab3">
                  <FormField label="Jenis Dokumen" name="jenis_dokumen" />
                  <FormField label="No Dokumen" name="no_dokumen" />
                  <FormField label="No BPKP" name="no_bpkp" />
                  <FormField label="No Polisi" name="no_polisi" />
                  <FormField label="Kepemilikan" name="kepemilikan" />
                  <FormField label="No Sertifikat" name="no_sertifikat" />
                  <FormField label="No PSP" name="no_psp" />
                  <FormField label="Tanggal PSP" name="tanggal_psp" type="date" />
                </SectionGrid>,

                // 4: Keuangan
                <SectionGrid key="tab4">
                  <FormField label="Nilai Perolehan" name="nilai_perolehan" type="number" />
                  <FormField label="Nilai Buku" name="nilai_buku" type="number" />
                  <FormField label="Nilai Penyusutan" name="nilai_penyusutan" type="number" />
                  <FormField label="Nilai Mutasi" name="nilai_mutasi" type="number" />
                  <FormField label="Tanggal Perolehan" name="tanggal_perolehan" type="date" />
                  <FormField label="Tanggal Buku Pertama" name="tanggal_buku_pertama" type="date" />
                  <FormField label="Tanggal Penghapusan" name="tanggal_penghapusan" type="date" />
                </SectionGrid>,

                // 5: Luas (m²)
                <SectionGrid key="tab5">
                  <FormField label="Tanah Seluruhnya (m²)" name="luas_tanah_seluruhnya" type="number" />
                  <FormField label="Tanah Bangunan (m²)" name="luas_tanah_bangunan" type="number" />
                  <FormField label="Tanah Sarana Lingkungan (m²)" name="luas_tanah_sarana_lingkungan" type="number" />
                  <FormField label="Lahan Kosong (m²)" name="luas_lahan_kosong" type="number" />
                  <FormField label="Bangunan (m²)" name="luas_bangunan" type="number" />
                  <FormField label="Tapak Bangunan (m²)" name="luas_tapak_bangunan" type="number" />
                  <FormField label="Pemanfaatan (m²)" name="luas_pemanfaatan" type="number" />
                </SectionGrid>,

                // 6: Lokasi
                <div key="tab6" style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FormField label="Alamat" name="alamat" />
                    <FormField label="RT/RW" name="rt_rw" />
                    <FormField label="Kelurahan/Desa" name="kelurahan_desa" />
                    <FormField label="Kecamatan" name="kecamatan" />
                    <FormField label="Kab/Kota" name="kab_kota" />
                    <FormField label="Kode Kab/Kota" name="kode_kab_kota" />
                    <FormField label="Provinsi" name="provinsi" />
                    <FormField label="Kode Provinsi" name="kode_provinsi" />
                    <FormField label="Kode Pos" name="kode_pos" />
                    <FormField label="Lokasi Ruang" name="lokasi_ruang" />
                  </div>
                </div>,

                // 7: Pengelolaan
                <SectionGrid key="tab7">
                  <FormField label="SBSK" name="sbsk" />
                  <FormField label="Optimalisasi" name="optimalisasi" />
                  <FormField label="Penghuni" name="penghuni" />
                  <FormField label="Pengguna BMN" name="pengguna_bmn" />
                  <FormField label="Kode KPKNL" name="kode_kpknl" />
                  <FormField label="Uraian KPKNL" name="uraian_kpknl" />
                  <FormField label="Uraian Kanwil DJKN" name="uraian_kanwil_djkn" />
                  <FormField label="Nama K/L" name="nama_kl" />
                  <FormField label="Nama E1" name="nama_e1" />
                  <FormField label="Nama Korwil" name="nama_korwil" />
                </SectionGrid>,

                // 8: Sistem
                <div key="tab8" style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {isAdmin && (
                      <>
                        <FormField label="Unit (kosongkan untuk Gudang)" name="unit_id">
                          <select name="unit_id" value={formData.unit_id} onChange={handleInputChange}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                            <option value="">📦 Gudang</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </FormField>
                        <FormField label="Lokasi" name="location_id">
                          <select name="location_id" value={formData.location_id} onChange={handleInputChange}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                            <option value="">Pilih Lokasi</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}{l.floor ? ` (Lt. ${l.floor})` : ''}</option>)}
                          </select>
                        </FormField>
                      </>
                    )}
                    <FormField label="Harga Sewa" name="rental_price" type="number" />
                    <FormField label="Satuan Sewa" name="rental_unit">
                      <select name="rental_unit" value={formData.rental_unit} onChange={handleInputChange}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff' }}>
                        <option value="per_jam">Per Jam</option>
                        <option value="per_hari">Per Hari</option>
                        <option value="per_minggu">Per Minggu</option>
                        <option value="per_bulan">Per Bulan</option>
                      </select>
                    </FormField>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>Catatan</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fafbff', resize: 'vertical' }} />
                  </div>
                </div>,
              ]

              return (
                <form onSubmit={handleSubmit}>
                  {/* Tab Navigation */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '12px 16px', borderBottom: '1px solid #eee',
                    background: '#fafbff', overflowX: 'auto'
                  }}>
                    {tabs.map((tab, i) => (
                      <button key={i} type="button" onClick={() => setActiveTab(i)}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer',
                          transition: '0.2s', whiteSpace: 'nowrap',
                          background: activeTab === i ? tab.color : 'transparent',
                          color: activeTab === i ? '#fff' : '#888',
                          boxShadow: activeTab === i ? `0 2px 8px ${tab.color}33` : 'none',
                        }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '55vh', overflowY: 'auto' }}>
                    <div style={{
                      background: `${tabs[activeTab].color}10`, padding: '10px 14px', borderRadius: '10px',
                      borderLeft: `3px solid ${tabs[activeTab].color}`, marginBottom: '16px',
                      fontSize: '12px', color: tabs[activeTab].color, fontWeight: 600,
                    }}>
                      {tabs[activeTab].label.replace(/^.\s/, '')}
                    </div>
                    {tabContent[activeTab]}
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: '12px 16px', display: 'flex', gap: '0.5rem', justifyContent: 'space-between',
                    alignItems: 'center', borderTop: '1px solid #eee',
                  }}>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      Tab {activeTab + 1} dari {tabs.length}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {activeTab > 0 && (
                        <button type="button" onClick={() => setActiveTab(activeTab - 1)}
                          style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          ← Sebelumnya
                        </button>
                      )}
                      {activeTab < tabs.length - 1 && (
                        <button type="button" onClick={() => setActiveTab(activeTab + 1)}
                          style={{
                            padding: '8px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                            background: tabs[activeTab].color, color: '#fff',
                          }}>
                          Selanjutnya →
                        </button>
                      )}
                      <button type="button" onClick={() => setShowModal(false)}
                        style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                        Batal
                      </button>
                      <button type="submit" className="add-asset-button" disabled={saving}
                        style={{ fontSize: '12px' }}>
                        {saving ? 'Menyimpan...' : '💾 Simpan'}
                      </button>
                    </div>
                  </div>
                </form>
              )
            })()}
          </div>
        </div>
      )}

      {/* ===== TRANSFER MODAL ===== */}
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
                  <strong>{transferAsset.nama_barang}</strong> ({transferAsset.kode_barang || '-'})<br />
                  <span style={{ color: '#666' }}>Unit saat ini: {transferAsset.unit?.name || 'Gudang'}</span>
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
                  <label>Lokasi Tujuan</label>
                  <select value={transferData.to_location_id} onChange={e => setTransferData({ ...transferData, to_location_id: e.target.value })}>
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