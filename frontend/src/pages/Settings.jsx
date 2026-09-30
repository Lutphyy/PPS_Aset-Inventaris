import { useState } from 'react'
import { Settings as SettingsIcon, User, Lock } from 'lucide-react'
import { authAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

function Settings() {
  const { toast } = useToast()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authAPI.updateProfile({ name, phone })
      if (res.data) {
        localStorage.setItem('user', JSON.stringify({ ...user, name, phone }))
        toast.success('Profil berhasil diupdate!')
        window.location.reload()
      }
    } catch (err) { toast.error('Gagal: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPw || !newPw) return toast.warning('Isi semua field')
    if (newPw.length < 6) return toast.warning('Password baru minimal 6 karakter')
    try {
      await authAPI.changePassword(currentPw, newPw)
      toast.success('Password berhasil diubah!')
      setCurrentPw('')
      setNewPw('')
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const roleLabel = (r) => ({ SUPER_ADMIN: 'Super Admin', ADMIN_UNIT: 'Admin Unit', OPERATOR: 'Operator', BORROWER: 'Peminjam', GUEST: 'Tamu', VIEWER: 'Viewer' }[r] || r)

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Settings</h1><p>Pengaturan profil dan keamanan akun</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '800px' }}>
        {/* Profile */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Profil</h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Email</label>
              <input type="text" value={user.email || ''} disabled style={{ width: '100%', padding: '9px 12px', border: '1px solid #eee', borderRadius: '8px', background: '#f8f8fa', fontSize: '13px', color: '#999' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Role</label>
              <input type="text" value={roleLabel(user.role)} disabled style={{ width: '100%', padding: '9px 12px', border: '1px solid #eee', borderRadius: '8px', background: '#f8f8fa', fontSize: '13px', color: '#999' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Nama</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Telepon</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            <button type="submit" className="add-asset-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
          </form>
        </div>

        {/* Password */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16} /> Ubah Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Password Lama</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} placeholder="Masukkan password lama" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Password Baru</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} placeholder="Minimal 6 karakter" />
            </div>
            <button type="submit" className="add-asset-button">Ubah Password</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings
