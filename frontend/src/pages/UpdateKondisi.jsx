import { useState, useEffect } from 'react'
import { Wrench, Save } from 'lucide-react'
import { assetsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const CONDITIONS = ['Baik', 'Rusak Ringan', 'Rusak Berat']

const kondisiColor = (k) => {
  if (!k) return { bg: '#f0f0f0', cl: '#666' }
  const kl = k.toLowerCase()
  if (kl.includes('baik')) return { bg: '#e4f6f0', cl: '#299579' }
  if (kl.includes('ringan')) return { bg: '#fff4e5', cl: '#d4850d' }
  if (kl.includes('berat')) return { bg: '#fde8e8', cl: '#d14343' }
  return { bg: '#f0f0f0', cl: '#666' }
}

function UpdateKondisi() {
  const { toast } = useToast()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [newCond, setNewCond] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    assetsAPI.getAll({ limit: 100 }).then(res => { setAssets(res.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleUpdate = async (id) => {
    if (!newCond) return toast.warning('Pilih kondisi baru')
    try {
      await assetsAPI.updateCondition(id, newCond, notes)
      toast.success('Kondisi berhasil diupdate!')
      setEditing(null); setNewCond(''); setNotes('')
      const res = await assetsAPI.getAll({ limit: 100 })
      setAssets(res.data || [])
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const condBadge = (c) => {
    const s = kondisiColor(c)
    return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: s.bg, color: s.cl }}>{c || '-'}</span>
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header"><div><h1>Update Kondisi</h1><p>Perbarui kondisi fisik aset unit Anda</p></div></div>
      <div className="asset-table-card">
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>Kode Barang</th><th>Nama Barang</th><th>Unit</th><th>Lokasi</th><th>Kondisi Saat Ini</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr> :
               assets.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.kode_barang || '-'}</td>
                  <td>{a.nama_barang}</td>
                  <td><span style={{ fontSize: '11px', fontWeight: 600, color: '#527bd8' }}>{a.unit?.name || '-'}</span></td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{a.location?.name || '-'}</td>
                  <td>{condBadge(a.kondisi)}</td>
                  <td>
                    {editing === a.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select value={newCond} onChange={e => setNewCond(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}>
                          <option value="">Pilih</option>
                          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan" style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', width: '120px' }} />
                        <button className="add-asset-button" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => handleUpdate(a.id)}><Save size={13} /></button>
                        <button style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px' }} onClick={() => setEditing(null)}>Batal</button>
                      </div>
                    ) : (
                      <button style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => { setEditing(a.id); setNewCond(a.kondisi) }}><Wrench size={13} /> Update</button>
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

export default UpdateKondisi
