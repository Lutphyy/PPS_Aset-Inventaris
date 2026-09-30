import { useState, useEffect } from 'react'
import { Search, X, UserCheck, Trash2, ToggleLeft, ToggleRight, UserPlus, Eye, Phone, Mail, MapPin, CreditCard, Image } from 'lucide-react'
import { usersAPI, authAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

const CAMPUS_ROLES = ['SUPER_ADMIN', 'ADMIN_UNIT', 'OPERATOR', 'BORROWER', 'VIEWER']
const ALL_ROLES = [...CAMPUS_ROLES, 'GUEST']
const roleLabel = (r) => ({ SUPER_ADMIN: 'Super Admin', ADMIN_UNIT: 'Admin Unit', OPERATOR: 'Operator', BORROWER: 'Peminjam Kampus', GUEST: 'Tamu / Eksternal', VIEWER: 'Viewer' }[r] || r)
const roleBg = (r) => ({ SUPER_ADMIN: '#f0eafc', ADMIN_UNIT: '#e9effd', OPERATOR: '#e4f6f0', BORROWER: '#fce7e2', GUEST: '#f0eef7', VIEWER: '#f0eef7' }[r] || '#f0f0f0')
const roleColor = (r) => ({ SUPER_ADMIN: '#7C57D6', ADMIN_UNIT: '#3E6FE0', OPERATOR: '#149E93', BORROWER: '#E85C4A', GUEST: '#8B85A3', VIEWER: '#8B85A3' }[r] || '#666')

const UNITS = ['Fakultas Teknik dan Kemaritiman', 'Fakultas Ekonomi dan Bisnis Maritim', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Fakultas Kelautan dan Ilmu Perikanan', 'Fakultas Ilmu Keguruan dan Pendidikan', 'Fakultas Kedokteran', 'Rektorat', 'Perpustakaan', 'Bagian Umum']

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function UserRole() {
  const { toast, showConfirm } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('Semua') // 'Semua', 'Kampus', 'Tamu'
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGuestDetail, setShowGuestDetail] = useState(null) // Guest user detail modal
  const [saving, setSaving] = useState(false)

  // Add campus user form
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', phone: '', role: 'BORROWER', unit: ''
  })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = { search: search || undefined, role: roleFilter || undefined, limit: 100 }
      const res = await usersAPI.getAll(params)
      setUsers(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const doSearch = () => fetchUsers()

  const handleToggleStatus = async (id) => {
    try { await usersAPI.toggleStatus(id); fetchUsers() }
    catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const handleVerifyGuest = async (id, status) => {
    const label = status === 'TERVERIFIKASI' ? 'verifikasi' : 'tolak'
    const confirmed = await showConfirm(`${label} guest ini?`, {
      title: status === 'TERVERIFIKASI' ? 'Verifikasi Guest' : 'Tolak Guest',
      confirmText: status === 'TERVERIFIKASI' ? 'Ya, Verifikasi' : 'Ya, Tolak',
      variant: status === 'DITOLAK' ? 'danger' : undefined,
    })
    if (!confirmed) return
    try {
      await usersAPI.verifyGuest(id, status)
      if (status === 'TERVERIFIKASI') {
        toast.success('Guest berhasil diverifikasi! Mereka sekarang bisa meminjam aset.')
      } else {
        toast.warning('Guest ditolak')
      }
      setShowGuestDetail(null)
      fetchUsers()
    } catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(`Hapus user "${name}"?`, {
      title: 'Hapus User',
      confirmText: 'Ya, Hapus',
      variant: 'danger',
    })
    if (!confirmed) return
    try { await usersAPI.delete(id); toast.success('User berhasil dihapus'); fetchUsers() }
    catch (err) { toast.error('Gagal: ' + err.message) }
  }

  const handleAddCampusUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authAPI.register(newUser)
      toast.success('User kampus berhasil ditambahkan!')
      setShowAddModal(false)
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'BORROWER', unit: '' })
      fetchUsers()
    } catch (err) { toast.error('Gagal: ' + err.message) }
    finally { setSaving(false) }
  }

  // View guest detail before verification
  const handleViewGuest = (user) => {
    setShowGuestDetail(user)
  }

  // Filter by type
  const filtered = users.filter(u => {
    if (typeFilter === 'Kampus') return !u.is_guest
    if (typeFilter === 'Tamu') return u.is_guest
    return true
  })

  const campusCount = users.filter(u => !u.is_guest).length
  const guestCount = users.filter(u => u.is_guest).length
  const pendingGuests = users.filter(u => u.is_guest && u.verification_status !== 'TERVERIFIKASI').length

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>User & Role Management</h1>
          <p>Kelola pengguna, hak akses, dan verifikasi tamu</p>
        </div>
        <button className="add-asset-button" onClick={() => setShowAddModal(true)}>
          <UserPlus size={15} /> Tambah User Kampus
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total User</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#292936' }}>{users.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>🎓 Civitas Kampus</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#149E93' }}>{campusCount}</div>
          <div style={{ fontSize: '10px', color: '#149E93' }}>Mendapat diskon 50%</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>👤 Tamu / Eksternal</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#8B85A3' }}>{guestCount}</div>
          <div style={{ fontSize: '10px', color: '#8B85A3' }}>Tarif penuh + deposit</div>
        </div>
        <div style={{ background: pendingGuests > 0 ? '#fff4dd' : '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>⏳ Menunggu Verifikasi</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: pendingGuests > 0 ? '#d79b32' : '#292936' }}>{pendingGuests}</div>
          {pendingGuests > 0 && <div style={{ fontSize: '10px', color: '#d79b32' }}>Perlu diverifikasi</div>}
        </div>
      </div>

      {/* Filters */}
      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} />
          <input type="text" placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
        </div>
        <div className="asset-filter">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Semua Role</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={doSearch}>Cari</button>
      </div>

      {/* Type Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f5f5f7', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '16px' }}>
        {['Semua', 'Kampus', 'Tamu'].map(tab => (
          <button key={tab} onClick={() => setTypeFilter(tab)}
            style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: typeFilter === tab ? '#fff' : 'transparent',
              color: typeFilter === tab ? '#292936' : '#888',
              boxShadow: typeFilter === tab ? '0 1px 3px rgba(0,0,0,.1)' : 'none'
            }}>
            {tab === 'Kampus' ? '🎓 Kampus' : tab === 'Tamu' ? '👤 Tamu' : 'Semua'}
            {tab === 'Tamu' && pendingGuests > 0 && <span style={{ marginLeft: '6px', background: '#d79b32', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>{pendingGuests}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>{typeFilter === 'Kampus' ? 'Civitas Kampus' : typeFilter === 'Tamu' ? 'Tamu / Eksternal' : 'Semua Pengguna'}</h3><p>
            {typeFilter === 'Kampus' ? 'User dengan diskon kampus 50%' : typeFilter === 'Tamu' ? 'User tanpa diskon (tarif penuh + deposit 50%)' : 'Seluruh pengguna sistem'}
          </p></div>
          <span className="asset-total">{filtered.length} User</span>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>Nama</th><th>Email</th><th>Tipe</th><th>Role</th><th>Unit</th><th>Status</th><th>Verifikasi</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Tidak ada data user</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: '#666', fontSize: '11px' }}>{u.email}</td>
                  <td>
                    {u.is_guest ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: '#f0eef7', color: '#8B85A3' }}>
                        👤 Tamu
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: '#e4f6f0', color: '#149E93' }}>
                        🎓 Kampus
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: roleBg(u.role), color: roleColor(u.role) }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: '#666' }}>{u.unit || '-'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                      background: u.is_active ? '#e4f6f0' : '#ffe9e7', color: u.is_active ? '#299579' : '#df625d' }}>
                      {u.is_active ? '● Aktif' : '● Nonaktif'}
                    </span>
                  </td>
                  <td>
                    {u.is_guest ? (
                      u.verification_status === 'TERVERIFIKASI' ? (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#e4f6f0', color: '#299579' }}>✓ Terverifikasi</span>
                      ) : u.verification_status === 'DITOLAK' ? (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#ffe9e7', color: '#df625d' }}>✗ Ditolak</span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#fff4dd', color: '#d79b32' }}>⏳ Menunggu</span>
                      )
                    ) : <span style={{ color: '#999', fontSize: '11px' }}>-</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => handleToggleStatus(u.id)}
                        style={{ padding: '5px 8px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: u.is_active ? '#df625d' : '#299579' }}>
                        {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      {/* View detail button for guests */}
                      {u.is_guest && (
                        <button title="Lihat Detail" onClick={() => handleViewGuest(u)}
                          style={{ padding: '5px 8px', border: '1px solid #3E6FE0', borderRadius: '6px', background: '#e9effd', cursor: 'pointer', color: '#3E6FE0' }}>
                          <Eye size={14} />
                        </button>
                      )}
                      {u.is_guest && u.verification_status !== 'TERVERIFIKASI' && u.verification_status !== 'DITOLAK' && (
                        <>
                          <button title="Verifikasi" onClick={() => handleVerifyGuest(u.id, 'TERVERIFIKASI')}
                            style={{ padding: '5px 8px', border: '1px solid #299579', borderRadius: '6px', background: '#e4f6f0', cursor: 'pointer', color: '#299579' }}>
                            <UserCheck size={14} />
                          </button>
                          <button title="Tolak" onClick={() => handleVerifyGuest(u.id, 'DITOLAK')}
                            style={{ padding: '5px 8px', border: '1px solid #df625d', borderRadius: '6px', background: '#ffe9e7', cursor: 'pointer', color: '#df625d' }}>
                            <X size={14} />
                          </button>
                        </>
                      )}
                      <button title="Hapus" onClick={() => handleDelete(u.id, u.name)}
                        style={{ padding: '5px 8px', border: '1px solid #df625d', borderRadius: '6px', background: '#ffe9e7', cursor: 'pointer', color: '#df625d' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Detail Review Modal */}
      {showGuestDetail && (
        <div className="modal-overlay" onClick={() => setShowGuestDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>Detail Akun Tamu</h2>
              <button onClick={() => setShowGuestDetail(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {/* Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: '#f0eef7', color: '#8B85A3',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700,
                  }}>
                    {showGuestDetail.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#292936' }}>{showGuestDetail.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>Tamu / Eksternal</div>
                  </div>
                </div>
                <div>
                  {showGuestDetail.verification_status === 'TERVERIFIKASI' ? (
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#e4f6f0', color: '#299579' }}>✓ Terverifikasi</span>
                  ) : showGuestDetail.verification_status === 'DITOLAK' ? (
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#ffe9e7', color: '#df625d' }}>✗ Ditolak</span>
                  ) : (
                    <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#fff4dd', color: '#d79b32' }}>⏳ Menunggu Verifikasi</span>
                  )}
                </div>
              </div>

              {/* Data Fields */}
              <div style={{ background: '#f8f8fa', borderRadius: '12px', padding: '16px', display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={15} color="#888" />
                  <div>
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>EMAIL</div>
                    <div style={{ fontSize: '13px', color: '#292936' }}>{showGuestDetail.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={15} color="#888" />
                  <div>
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>NO. TELEPON</div>
                    <div style={{ fontSize: '13px', color: '#292936' }}>{showGuestDetail.phone || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={15} color="#888" />
                  <div>
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>NO. KTP / NIK</div>
                    <div style={{ fontSize: '13px', color: '#292936', fontFamily: 'monospace', letterSpacing: '1px' }}>{showGuestDetail.identity_number || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={15} color="#888" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>ALAMAT</div>
                    <div style={{ fontSize: '13px', color: '#292936', lineHeight: 1.5 }}>{showGuestDetail.address || '-'}</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Image size={15} color="#888" />
                    <div style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>FOTO KTP / IDENTITAS</div>
                  </div>
                  {showGuestDetail.identity_photo ? (
                    <div style={{
                      border: '2px solid #eee',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#f0f0f0',
                    }}>
                      <img
                        src={`${API_BASE}${showGuestDetail.identity_photo}`}
                        alt="Foto KTP"
                        style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                      />
                      <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', padding: '30px', color: '#999', fontSize: '12px' }}>
                        Foto tidak dapat ditampilkan
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px',
                      background: '#f5f5f7',
                      borderRadius: '10px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '12px',
                    }}>
                      Tidak ada foto KTP yang diupload
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Date */}
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#999', textAlign: 'right' }}>
                Terdaftar: {showGuestDetail.created_at ? new Date(showGuestDetail.created_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>

            {/* Action buttons for pending guests */}
            {showGuestDetail.is_guest && showGuestDetail.verification_status !== 'TERVERIFIKASI' && showGuestDetail.verification_status !== 'DITOLAK' && (
              <div style={{ padding: '12px 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #eee' }}>
                <button onClick={() => handleVerifyGuest(showGuestDetail.id, 'DITOLAK')}
                  style={{ padding: '9px 18px', border: '1px solid #df625d', borderRadius: '8px', background: '#ffe9e7', cursor: 'pointer', color: '#df625d', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={14} /> Tolak
                </button>
                <button onClick={() => handleVerifyGuest(showGuestDetail.id, 'TERVERIFIKASI')}
                  className="add-asset-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={14} /> Verifikasi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Campus User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah User Kampus</h2>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCampusUser}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div style={{ background: '#e4f6f0', padding: '12px 14px', borderRadius: '8px', fontSize: '12px', color: '#0B6A62', marginBottom: '16px', lineHeight: 1.5 }}>
                  🎓 <strong>User Kampus</strong> (dosen, mahasiswa, staff) otomatis mendapat diskon {50}% untuk peminjaman aset. Tidak perlu verifikasi KTP.
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Nama Lengkap *</label>
                    <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Email *</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Password *</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required minLength={6}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Telepon</label>
                      <input type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Role *</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }}>
                        {CAMPUS_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '4px' }}>Unit Kerja *</label>
                    <select value={newUser.unit} onChange={e => setNewUser({...newUser, unit: e.target.value})} required
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }}>
                      <option value="">Pilih Unit</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Batal</button>
                <button type="submit" className="add-asset-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Tambah User Kampus'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRole
