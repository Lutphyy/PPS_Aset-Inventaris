import {
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react'

function Header() {
  return (
    <header className="header">

      {/* Search */}
      <div className="search-box">
        <Search size={16} strokeWidth={1.8} />

        <input
          type="text"
          placeholder="Cari aset, kode, atau peminjaman..."
        />
      </div>


      {/* Header Right */}
      <div className="header-right">

        {/* Notification */}
        <button
          className="notification"
          type="button"
          aria-label="Notifikasi"
        >
          <Bell size={17} strokeWidth={1.8} />
        </button>


        {/* Profile */}
        <div className="profile">

          <div className="profile-avatar">
            AW
          </div>

          <div className="profile-info">
            <strong>Andi Wijaya</strong>
            <span>Super Admin</span>
          </div>

          <ChevronDown
            className="arrow"
            size={15}
            strokeWidth={1.8}
          />

        </div>

      </div>

    </header>
  )
}

export default Header