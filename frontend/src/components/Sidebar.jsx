import {
  LayoutDashboard, Package, ArrowRightLeft, Undo2, Users,
  FileText, History, Settings, LogOut, Wrench, MapPin,
  Plus, ClipboardCheck, DollarSign, Eye,
} from 'lucide-react'

// Menu config per role — matches the HTML mockup spec
const ROLE_MENUS = {
  SUPER_ADMIN: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-aset', label: 'Data Aset', icon: Package },
    { id: 'peminjaman', label: 'Peminjaman', icon: ArrowRightLeft },
    { id: 'pengembalian', label: 'Pengembalian', icon: Undo2 },
    { id: 'user-role', label: 'User & Role', icon: Users },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'audit-log', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  ADMIN_UNIT: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-aset', label: 'Data Aset Unit', icon: Package },
    { id: 'peminjaman', label: 'Peminjaman', icon: ArrowRightLeft },
    { id: 'pengembalian', label: 'Pengembalian', icon: Undo2 },
    { id: 'monitoring-agreement', label: 'Monitoring Agreement', icon: ClipboardCheck },
    { id: 'pengaturan-biaya', label: 'Pengaturan Biaya', icon: DollarSign },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ],
  OPERATOR: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-aset', label: 'Data Aset', icon: Package },
    { id: 'update-kondisi', label: 'Update Kondisi', icon: Wrench },
    { id: 'update-lokasi', label: 'Update Lokasi', icon: MapPin },
    { id: 'peminjaman', label: 'Peminjaman', icon: ArrowRightLeft },
    { id: 'pengembalian', label: 'Pengembalian', icon: Undo2 },
  ],
  BORROWER: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daftar-aset', label: 'Daftar Aset', icon: Package },
    { id: 'ajukan-peminjaman', label: 'Ajukan Peminjaman', icon: Plus },
    { id: 'peminjaman-saya', label: 'Peminjaman Saya', icon: ArrowRightLeft },
    { id: 'pengembalian', label: 'Pengembalian', icon: Undo2 },
    { id: 'riwayat', label: 'Riwayat', icon: History },
  ],
  GUEST: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daftar-aset', label: 'Daftar Aset', icon: Package },
    { id: 'ajukan-peminjaman', label: 'Ajukan Peminjaman', icon: Plus },
    { id: 'peminjaman-saya', label: 'Peminjaman Saya', icon: ArrowRightLeft },
    { id: 'riwayat', label: 'Riwayat', icon: History },
  ],
  VIEWER: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-aset', label: 'Data Aset', icon: Package },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ],
}

const ROLE_COLORS = {
  SUPER_ADMIN: { bg: '#f0eafc', color: '#7C57D6' },
  ADMIN_UNIT: { bg: '#e9effd', color: '#3E6FE0' },
  OPERATOR: { bg: '#e3f6f2', color: '#149E93' },
  BORROWER: { bg: '#fce7e2', color: '#E85C4A' },
  GUEST: { bg: '#eeebf7', color: '#8B85A3' },
  VIEWER: { bg: '#eeebf7', color: '#8B85A3' },
}

function roleName(role) {
  const map = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_UNIT: 'Admin Unit',
    OPERATOR: 'Operator',
    BORROWER: 'Peminjam',
    GUEST: 'Tamu / Guest',
    VIEWER: 'Viewer',
  }
  return map[role] || role
}

function Sidebar({ activePage, setActivePage, user, onLogout, badgeCounts = {} }) {
  const role = user?.role || 'VIEWER'
  const menuItems = ROLE_MENUS[role] || ROLE_MENUS.VIEWER
  const rc = ROLE_COLORS[role] || ROLE_COLORS.VIEWER

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="logo">
        <div className="logo-icon">
          <Package size={21} strokeWidth={2} />
        </div>
        <div className="logo-text">
          <div className="logo-name">SISETRIS</div>
          <div className="logo-subtitle">Aset & Inventaris</div>
        </div>
      </div>

      {/* MENU */}
      <p className="menu-title">MENU</p>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon
          const badgeCount = badgeCounts[item.id] || 0
          return (
            <a
              key={item.id}
              className={`menu-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <span className="sidebar-badge">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </a>
          )
        })}
      </nav>

      {/* FOOTER */}
      <div style={{
        marginTop: 'auto', padding: '16px',
        borderTop: '1px solid #eeeeee'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'inline-block', padding: '4px 10px',
            borderRadius: '999px', fontSize: '10px', fontWeight: 700,
            background: rc.bg, color: rc.color
          }}>
            {roleName(role)}
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#292936', marginBottom: '2px' }}>
            {user?.name || 'User'}
          </div>
          <div style={{ fontSize: '11px', color: '#888888' }}>
            {user?.email || ''}
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', border: '1px solid #eeeeee', borderRadius: '8px',
            background: '#f8f8fa', color: '#df625d', fontSize: '12px',
            fontWeight: 600, cursor: 'pointer', transition: '0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#ffe9e7'; e.currentTarget.style.borderColor = '#ffccc8' }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#f8f8fa'; e.currentTarget.style.borderColor = '#eeeeee' }}
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
