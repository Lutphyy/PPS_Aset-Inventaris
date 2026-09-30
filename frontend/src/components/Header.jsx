import {
  Search,
  ChevronDown,
} from 'lucide-react'

function Header({ user }) {
  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getRoleName = (role) => {
    const roleNames = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN_UNIT': 'Admin Unit',
      'OPERATOR': 'Operator',
      'BORROWER': 'Peminjam',
      'GUEST': 'Tamu',
      'VIEWER': 'Viewer'
    }
    return roleNames[role] || role
  }

  return (
    <header className="header">
      
      {/* SEARCH BOX */}
      <div className="search-box">
        <Search size={16} strokeWidth={1.8} />

        <input
          type="text"
          placeholder="Cari aset, peminjaman, atau user..."
        />
      </div>

      {/* RIGHT SECTION */}
      <div className="header-right">

        {/* USER PROFILE */}
        <div className="profile">
          <div className="profile-avatar">
            {getInitials(user?.name)}
          </div>

          <div className="profile-info">
            <strong>{user?.name || 'User'}</strong>
            <span>{getRoleName(user?.role)}</span>
          </div>

          <ChevronDown
            className="arrow"
            size={14}
            strokeWidth={2}
          />
        </div>

      </div>

    </header>
  )
}

export default Header
