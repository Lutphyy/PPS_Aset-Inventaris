import { useState, useEffect } from 'react'
import { MapPin, Save } from 'lucide-react'
import { assetsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

function UpdateLokasi() {
  const { toast } = useToast()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [newLoc, setNewLoc] = useState('')

  useEffect(() => {
    assetsAPI.getAll({ limit: 100 }).then(res => { setAssets(res.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleUpdate = async (id) => {
    if (!newLoc.trim()) return toast.warning('Masukkan lokasi baru')
    try {
      await assetsAPI.update(id, { location: newLoc })
      toast.success('Lokasi berhasil diupdate!')
      setEditing(null); setNewLoc('')
      const res = await assetsAPI.getAll({ limit: 100 })
      setAssets(res.data || [])
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header"><div><h1>Update Lokasi</h1><p>Perbarui lokasi penempatan aset</p></div></div>
      <div className="asset-table-card">
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>Kode</th><th>Nama Aset</th><th>Lokasi Saat Ini</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr> :
               assets.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.code}</td>
                  <td>{a.name}</td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{a.location}</td>
                  <td>
                    {editing === a.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="text" value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder="Lokasi baru" style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', width: '200px' }} />
                        <button className="add-asset-button" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => handleUpdate(a.id)}><Save size={13} /></button>
                        <button style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px' }} onClick={() => setEditing(null)}>Batal</button>
                      </div>
                    ) : (
                      <button style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => { setEditing(a.id); setNewLoc(a.location) }}><MapPin size={13} /> Update</button>
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
