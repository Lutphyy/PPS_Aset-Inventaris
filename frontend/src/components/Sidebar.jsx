import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Undo2,
  Users,
  FileText,
  History,
  Settings,
} from 'lucide-react'

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">

      {/* =========================
          LOGO APLIKASI
      ========================= */}
      <div className="logo">

        {/* ICON LOGO */}
        <div className="logo-icon">
          <Package size={21} strokeWidth={2} />
        </div>

        {/* TEXT LOGO */}
        <div className="logo-text">
          <div className="logo-name">
            SISETRIS
          </div>

          <div className="logo-subtitle">
            Aset & Inventaris
          </div>
        </div>

      </div>


      {/* =========================
          MENU
      ========================= */}
      <p className="menu-title">
        MENU
      </p>


      <nav>

        {/* DASHBOARD */}
        <a
          className={`menu-item ${
            activePage === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => setActivePage('dashboard')}
        >
          <LayoutDashboard
            size={18}
            strokeWidth={1.8}
          />
          <span>Dashboard</span>
        </a>


        {/* DATA ASET */}
        <a
          className={`menu-item ${
            activePage === 'data-aset' ? 'active' : ''
          }`}
          onClick={() => setActivePage('data-aset')}
        >
          <Package
            size={18}
            strokeWidth={1.8}
          />
          <span>Data Aset</span>
        </a>


        {/* PEMINJAMAN */}
        <a
          className={`menu-item ${
            activePage === 'peminjaman' ? 'active' : ''
          }`}
          onClick={() => setActivePage('peminjaman')}
        >
          <ArrowRightLeft
            size={18}
            strokeWidth={1.8}
          />
          <span>Peminjaman</span>
        </a>


        {/* PENGEMBALIAN */}
        <a
          className={`menu-item ${
            activePage === 'pengembalian' ? 'active' : ''
          }`}
          onClick={() => setActivePage('pengembalian')}
        >
          <Undo2
            size={18}
            strokeWidth={1.8}
          />
          <span>Pengembalian</span>
        </a>


        {/* USER & ROLE */}
        <a
          className={`menu-item ${
            activePage === 'user-role' ? 'active' : ''
          }`}
          onClick={() => setActivePage('user-role')}
        >
          <Users
            size={18}
            strokeWidth={1.8}
          />
          <span>User & Role</span>
        </a>


        {/* LAPORAN */}
        <a
          className={`menu-item ${
            activePage === 'laporan' ? 'active' : ''
          }`}
          onClick={() => setActivePage('laporan')}
        >
          <FileText
            size={18}
            strokeWidth={1.8}
          />
          <span>Laporan</span>
        </a>


        {/* AUDIT LOG */}
        <a
          className={`menu-item ${
            activePage === 'audit-log' ? 'active' : ''
          }`}
          onClick={() => setActivePage('audit-log')}
        >
          <History
            size={18}
            strokeWidth={1.8}
          />
          <span>Audit Log</span>
        </a>


        {/* SETTINGS */}
        <a
          className={`menu-item ${
            activePage === 'settings' ? 'active' : ''
          }`}
          onClick={() => setActivePage('settings')}
        >
          <Settings
            size={18}
            strokeWidth={1.8}
          />
          <span>Settings</span>
        </a>

      </nav>

    </aside>
  )
}

export default Sidebar