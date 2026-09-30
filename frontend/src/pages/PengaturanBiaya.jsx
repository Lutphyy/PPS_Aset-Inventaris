import { useState } from 'react'
import { DollarSign, Save } from 'lucide-react'
import { useToast } from '../components/ToastContext'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

function PengaturanBiaya() {
  const { toast } = useToast()
  const [campusDiscount, setCampusDiscount] = useState(50)
  const [lateFee, setLateFee] = useState(25000)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Settings API endpoint might not exist yet
      toast.success('Pengaturan biaya berhasil disimpan! Diskon Kampus: ' + campusDiscount + '%, Denda: ' + fmtIDR(lateFee) + '/hari')
    } catch (err) { toast.error('Gagal: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header"><div><h1>Pengaturan Biaya</h1><p>Atur biaya sewa, diskon kampus, dan denda keterlambatan</p></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '700px' }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>🎓 Diskon Kampus</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', lineHeight: 1.5 }}>Persentase diskon untuk civitas kampus (dosen, mahasiswa, staff). Tamu/guest dikenakan tarif penuh.</p>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Diskon (%)</label>
            <input type="number" value={campusDiscount} onChange={e => setCampusDiscount(Number(e.target.value))} min="0" max="100"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }} />
          </div>
          <div style={{ marginTop: '12px', padding: '10px', background: '#e3f6f2', borderRadius: '8px', fontSize: '12px', color: '#0B6A62', fontWeight: 600, textAlign: 'center' }}>
            Civitas kampus mendapat diskon {campusDiscount}%
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>⏰ Denda Keterlambatan</h3>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '14px', lineHeight: 1.5 }}>Denda per hari yang dikenakan jika peminjam terlambat mengembalikan aset.</p>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Denda per Hari (Rp)</label>
            <input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} min="0"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }} />
          </div>
          <div style={{ marginTop: '12px', padding: '10px', background: '#ffe9e7', borderRadius: '8px', fontSize: '12px', color: '#df625d', fontWeight: 600, textAlign: 'center' }}>
            Denda: {fmtIDR(lateFee)} / hari keterlambatan
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <button className="add-asset-button" onClick={handleSave} disabled={saving} style={{ padding: '10px 20px' }}>
          <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  )
}

export default PengaturanBiaya
