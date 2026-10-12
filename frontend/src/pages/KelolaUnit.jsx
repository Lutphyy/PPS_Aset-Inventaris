import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, X, Building2, MapPin, Users, Package } from 'lucide-react'
import { unitsAPI, locationsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

function KelolaUnit() {
  const { toast, showConfirm } = useToast()
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', code: '', description: '' })

  // Locations state
  const [showLocModal, setShowLocModal] = useState(false)
  const [locModalMode, setLocModalMode] = useState('add')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [locForm, setLocForm] = useState({ name: '', unit_id: '', floor: '', description: '' })
  const [locations, setLocations] = useState([])
  const [locSaving, setLocSaving] = useState(false)
  const [activeUnitId, setActiveUnitId] = useState(null)

  useEffect(() => { fetchUnits() }, [])

  const fetchUnits = async () => {
    try {
      setLoading(true)
      const res = await unitsAPI.getAll({ search })
      setUnits(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchLocations = async (unitId) => {
    try {
      const res = await locationsAPI.getAll({ unit_id: unitId })
      setLocations(res.data || [])
    } catch (err) { console.error(err) }
  }

  const handleAddUnit = () => {
    setModalMode('add')
    setFormData({ name: '', code: '', description: '' })
    setShowModal(true)
  }

  const handleEditUnit = (unit) => {
    setModalMode('edit')
    setSelectedUnit(unit)
    setFormData({ name: unit.name, code: unit.code, description: unit.description || '' })
    setShowModal(true)
  }

  const handleDeleteUnit = async (unit) => {
    const ok = await showConfirm(`Hapus unit "${unit.name}"?`, { title: 'Hapus Unit', confirmText: 'Ya, Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await unitsAPI.delete(unit.id)
      toast.success('Unit berhasil dihapus')
      fetchUnits()
    } catch (err) { toast.error(err.message) }
  }

  const handleSubmitUnit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modalMode === 'add') {
        await unitsAPI.create(formData)
        toast.success('Unit berhasil dibuat')
      } else {
        await unitsAPI.update(selectedUnit.id, formData)
        toast.success('Unit berhasil diupdate')
      }
      setShowModal(false)
      fetchUnits()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  // Location handlers
  const handleViewLocations = (unit) => {
    setActiveUnitId(unit.id)
    setSelectedUnit(unit)
    fetchLocations(unit.id)
  }

  const handleAddLocation = () => {
    setLocModalMode('add')
    setLocForm({ name: '', unit_id: activeUnitId, floor: '', description: '' })
    setShowLocModal(true)
  }

  const handleEditLocation = (loc) => {
    setLocModalMode('edit')
    setSelectedLoc(loc)
    setLocForm({ name: loc.name, unit_id: loc.unit_id, floor: loc.floor || '', description: loc.description || '' })
    setShowLocModal(true)
  }

  const handleDeleteLocation = async (loc) => {
    const ok = await showConfirm(`Hapus lokasi "${loc.name}"?`, { title: 'Hapus Lokasi', confirmText: 'Ya, Hapus', variant: 'danger' })
    if (!ok) return
    try {
      await locationsAPI.delete(loc.id)
      toast.success('Lokasi berhasil dihapus')
      fetchLocations(activeUnitId)
    } catch (err) { toast.error(err.message) }
  }

  const handleSubmitLocation = async (e) => {
    e.preventDefault()
    setLocSaving(true)
    try {
      if (locModalMode === 'add') {
        await locationsAPI.create(locForm)
        toast.success('Lokasi berhasil dibuat')
      } else {
        await locationsAPI.update(selectedLoc.id, locForm)
        toast.success('Lokasi berhasil diupdate')
      }
      setShowLocModal(false)
      fetchLocations(activeUnitId)
      fetchUnits() // refresh counts
    } catch (err) { toast.error(err.message) }
    finally { setLocSaving(false) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>Kelola Unit & Lokasi</h1>
          <p>Manajemen unit (prodi) dan lokasi aset</p>
        </div>
        <button type="button" className="add-asset-button" onClick={handleAddUnit}>
          <Plus size={17} strokeWidth={2} />
          <span>Tambah Unit</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} strokeWidth={1.8} />
          <input type="text" placeholder="Cari unit..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUnits()} />
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={fetchUnits}>Cari</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeUnitId ? '1fr 1fr' : '1fr', gap: '16px' }}>
        {/* UNITS LIST */}
        <div className="asset-table-card">
          <div className="asset-table-header">
            <div><h3>Daftar Unit</h3><p>{units.length} unit terdaftar</p></div>
          </div>
          <div className="asset-table-wrapper">
            <table className="asset-table">
              <thead>
                <tr><th>Kode</th><th>Nama Unit</th><th>Aset</th><th>Lokasi</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td></tr>
                ) : units.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada unit</td></tr>
                ) : units.map(unit => (
                  <tr key={unit.id} style={{ background: activeUnitId === unit.id ? '#f0f4ff' : undefined, cursor: 'pointer' }}
                    onClick={() => handleViewLocations(unit)}>
                    <td><span className="asset-code">{unit.code}</span></td>
                    <td><span className="asset-name">{unit.name}</span></td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><Package size={13} />{unit.assets_count || 0}</span></td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><MapPin size={13} />{unit.locations_count || 0}</span></td>
                    <td>
                      <div className="asset-actions" onClick={e => e.stopPropagation()}>
                        <button type="button" title="Edit" onClick={() => handleEditUnit(unit)}><Pencil size={15} /></button>
                        <button type="button" className="delete" title="Hapus" onClick={() => handleDeleteUnit(unit)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOCATIONS LIST (shown when a unit is selected) */}
        {activeUnitId && (
          <div className="asset-table-card">
            <div className="asset-table-header">
              <div>
                <h3>Lokasi — {selectedUnit?.name}</h3>
                <p>{locations.length} lokasi</p>
              </div>
              <button className="add-asset-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleAddLocation}>
                <Plus size={14} /> Tambah Lokasi
              </button>
            </div>
            <div className="asset-table-wrapper">
              <table className="asset-table">
                <thead>
                  <tr><th>Nama Lokasi</th><th>Lantai</th><th>Aset</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {locations.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Belum ada lokasi</td></tr>
                  ) : locations.map(loc => (
                    <tr key={loc.id}>
                      <td><span className="asset-name">{loc.name}</span></td>
                      <td>{loc.floor || '-'}</td>
                      <td>{loc.assets_count || 0}</td>
                      <td>
                        <div className="asset-actions">
                          <button type="button" title="Edit" onClick={() => handleEditLocation(loc)}><Pencil size={15} /></button>
                          <button type="button" className="delete" title="Hapus" onClick={() => handleDeleteLocation(loc)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* UNIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Tambah Unit' : 'Edit Unit'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitUnit}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '12px' }}>
                <div><label>Kode Unit *</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required placeholder="cth: TI" /></div>
                <div><label>Nama Unit *</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="cth: Teknik Informatika" /></div>
                <div><label>Deskripsi</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="2" /></div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="add-asset-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCATION MODAL */}
      {showLocModal && (
        <div className="modal-overlay" onClick={() => setShowLocModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{locModalMode === 'add' ? 'Tambah Lokasi' : 'Edit Lokasi'}</h2>
              <button onClick={() => setShowLocModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitLocation}>
              <div className="modal-body" style={{ padding: '1.5rem', display: 'grid', gap: '12px' }}>
                <div><label>Nama Lokasi *</label><input type="text" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} required placeholder="cth: Lab Komputer 1" /></div>
                <div><label>Lantai</label><input type="text" value={locForm.floor} onChange={e => setLocForm({ ...locForm, floor: e.target.value })} placeholder="cth: 2" /></div>
                <div><label>Deskripsi</label><textarea value={locForm.description} onChange={e => setLocForm({ ...locForm, description: e.target.value })} rows="2" /></div>
              </div>
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowLocModal(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="add-asset-button" disabled={locSaving}>{locSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default KelolaUnit
