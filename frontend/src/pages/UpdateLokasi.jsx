import { useState, useEffect } from 'react'
import { MapPin, Save } from 'lucide-react'
import { assetsAPI, locationsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

function UpdateLokasi() {
  const { toast } = useToast()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [newLocId, setNewLocId] = useState('')
  const [locations, setLocations] = useState([])

  useEffect(() => {
    assetsAPI.getAll({ limit: 100 }).then(res => { setAssets(res.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const fetchLocationsForUnit = async (unitId) => {
    try {
      const res = await locationsAPI.getAll({ unit_id: unitId, active_only: true })
      setLocations(res.data || [])
    } catch (err) { console.error(err) }
  }

  const handleStartEdit = (asset) => {
    setEditing(asset.id)
    setNewLocId(asset.location_id || '')
    if (asset.unit_id) fetchLocationsForUnit(asset.unit_id)
  }

  const handleUpdate = async (id) => {
    if (!newLocId) return toast.warning('Pilih lokasi baru')
    try {
      await assetsAPI.update(id, { location_id: newLocId })
      toast.success('Lokasi berhasil diupdate!')
      setEditing(null); setNewLocId('')
      const res = await assetsAPI.getAll({ limit: 100 })
      setAssets(res.data || [])
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header"><div><h1>Update Lokasi</h1><p>Perbarui lokasi penempatan aset unit Anda</p></div></div>
      <div className="asset-table-card">
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>Kode</th><th>Nama Aset</th><th>Unit</th><th>Lokasi Saat Ini</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr> :
               assets.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.code}</td>
                  <td>{a.name}</td>
                  <td><span style={{ fontSize: '11px', fontWeight: 600, color: '#527bd8' }}>{a.unit?.name || '-'}</span></td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{a.location?.name || '-'}</td>
                  <td>
                    {editing === a.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select value={newLocId} onChange={e => setNewLocId(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}>
                          <option value="">Pilih Lokasi</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}{l.floor ? ` (Lt. ${l.floor})` : ''}</option>)}
                        </select>
                        <button className="add-asset-button" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => handleUpdate(a.id)}><Save size={13} /></button>
                        <button style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px' }} onClick={() => setEditing(null)}>Batal</button>
                      </div>
                    ) : (
                      <button style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleStartEdit(a)}><MapPin size={13} /> Update</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UpdateLokasi
