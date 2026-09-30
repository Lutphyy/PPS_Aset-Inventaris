import { useState, useEffect } from 'react'
import { Send, AlertTriangle } from 'lucide-react'
import { assetsAPI, loansAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

function AjukanPeminjaman({ selectedAssetId }) {
  const { toast } = useToast()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isGuest = user.role === 'GUEST'
  const discountPercent = isGuest ? 0 : 50

  const [form, setForm] = useState({
    asset_id: selectedAssetId || '',
    purpose: '',
    borrow_date: new Date().toISOString().split('T')[0],
    estimated_return_date: '',
  })

  useEffect(() => {
    assetsAPI.getAll({ status: 'TERSEDIA', limit: 100 }).then(res => {
      setAssets(res.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const selectedAsset = assets.find(a => String(a.id) === String(form.asset_id))
  const days = form.borrow_date && form.estimated_return_date
    ? Math.max(1, Math.ceil((new Date(form.estimated_return_date) - new Date(form.borrow_date)) / 86400000))
    : 0
  const rentalTotal = (selectedAsset?.rental_price_per_day || 0) * days
  const discountAmt = (rentalTotal * discountPercent) / 100
  const totalCost = rentalTotal - discountAmt
  const deposit = isGuest ? totalCost * 0.5 : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!agreed) return toast.warning('Anda harus menyetujui perjanjian peminjaman')
    if (!form.asset_id || !form.purpose || !form.estimated_return_date) return toast.warning('Lengkapi semua field')
    setSubmitting(true)
    try {
      await loansAPI.create({ ...form, agreed_to_terms: true })
      toast.success('Pengajuan peminjaman berhasil! Menunggu approval admin.')
      setForm({ asset_id: '', purpose: '', borrow_date: new Date().toISOString().split('T')[0], estimated_return_date: '' })
      setAgreed(false)
    } catch (err) { toast.error('Gagal: ' + err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Ajukan Peminjaman</h1><p>Isi form untuk mengajukan peminjaman aset</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', maxWidth: '900px' }}>
        {/* Form */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>Form Peminjaman</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Pilih Aset *</label>
              <select value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }}>
                <option value="">-- Pilih aset --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code}) - {fmtIDR(a.rental_price_per_day)}/hari</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Tujuan Peminjaman *</label>
              <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required rows="3"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }}
                placeholder="Jelaskan tujuan peminjaman..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Tanggal Pinjam *</label>
                <input type="date" value={form.borrow_date} onChange={(e) => setForm({ ...form, borrow_date: e.target.value })} required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Estimasi Kembali *</label>
                <input type="date" value={form.estimated_return_date} onChange={(e) => setForm({ ...form, estimated_return_date: e.target.value })} required
                  min={form.borrow_date} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
              </div>
            </div>

            {/* Agreement */}
            <div style={{ background: '#f8f8fc', border: '1px solid #e7e3f6', borderRadius: '12px', padding: '16px', marginTop: '4px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>📋 Perjanjian Peminjaman</h4>
              <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: '#555', lineHeight: 1.8 }}>
                <li>Peminjam wajib menjaga aset dengan baik dan menggunakannya sesuai fungsi</li>
                <li>Peminjam bertanggung jawab penuh atas kerusakan atau kehilangan</li>
                <li>Wajib mengembalikan sesuai tanggal yang disepakati</li>
                <li>Keterlambatan dikenakan denda Rp 25.000/hari</li>
                <li>Kerusakan dikenakan biaya perbaikan/penggantian</li>
                <li>Pelanggaran dapat menjadi dasar gugatan hukum</li>
              </ul>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '12px', padding: '10px 12px', background: '#e3f6f2', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#149E93' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0B6A62', lineHeight: 1.4 }}>Saya telah membaca, memahami, dan menyetujui seluruh isi perjanjian. Perjanjian ini mengikat secara hukum.</span>
              </label>
            </div>

            {isGuest && (
              <div style={{ background: '#fff4dd', color: '#8A5F09', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', display: 'flex', gap: '8px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Sebagai tamu, Anda dikenakan tarif penuh tanpa diskon dan wajib membayar deposit 50% sebelum aset diambil.</span>
              </div>
            )}

            <button type="submit" className="add-asset-button" disabled={submitting || !agreed} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              <Send size={15} /> {submitting ? 'Mengirim...' : 'Ajukan Peminjaman'}
            </button>
          </form>
        </div>

        {/* Cost Breakdown */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px', alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>💰 Rincian Biaya</h3>
          {selectedAsset && days > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#666' }}>Biaya sewa/hari</span><span>{fmtIDR(selectedAsset.rental_price_per_day)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#666' }}>Durasi</span><span>{days} hari</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#666' }}>Subtotal</span><span>{fmtIDR(rentalTotal)}</span></div>
              {discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#149E93' }}>Diskon kampus ({discountPercent}%)</span>
                  <span style={{ color: '#149E93' }}>-{fmtIDR(discountAmt)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#149E93' }}>
                <span>Total</span><span>{fmtIDR(totalCost)}</span>
              </div>
              {deposit > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#fff4dd', padding: '8px 10px', borderRadius: '8px' }}>
                  <span style={{ color: '#8A5F09', fontWeight: 600 }}>Deposit (50%)</span>
                  <span style={{ color: '#8A5F09', fontWeight: 600 }}>{fmtIDR(deposit)}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '12px' }}>Pilih aset dan tanggal untuk melihat rincian biaya</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AjukanPeminjaman
