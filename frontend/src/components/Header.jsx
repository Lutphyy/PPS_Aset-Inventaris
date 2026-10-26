import {
  Search,
  ChevronDown,
  Menu,
} from 'lucide-react'

function Header({ user, onToggleSidebar }) {
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

      {/* HAMBURGER BUTTON (mobile only) */}
      <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
        <Menu size={22} strokeWidth={2} />
      </button>






    </header>
  )
}

export default Header
