import { useState, useEffect, useCallback } from 'react'
import './App.css'

import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { ToastProvider } from './components/ToastContext'

import Dashboard from './pages/Dashboard'
import DataAset from './pages/DataAset'
import Peminjaman from './pages/Peminjaman'
import Pengembalian from './pages/Pengembalian'
import UserRole from './pages/UserRole'
import Laporan from './pages/Laporan'
import AuditLog from './pages/AuditLog'
import Settings from './pages/Settings'
import DaftarAset from './pages/DaftarAset'
import AjukanPeminjaman from './pages/AjukanPeminjaman'
import PeminjamanSaya from './pages/PeminjamanSaya'
import Riwayat from './pages/Riwayat'
import MonitoringAgreement from './pages/MonitoringAgreement'
import PengaturanBiaya from './pages/PengaturanBiaya'
import UpdateKondisi from './pages/UpdateKondisi'
import UpdateLokasi from './pages/UpdateLokasi'
import Login from './pages/Login'

import { dashboardAPI } from './utils/api'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [badgeCounts, setBadgeCounts] = useState({})

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Fetch badge counts for sidebar notifications
  const fetchBadgeCounts = useCallback(async () => {
    if (!user) return
    try {
      const res = await dashboardAPI.getStats()
      console.log('[BADGE DEBUG] API response:', JSON.stringify(res))
      const data = res.data?.overview || {}
      console.log('[BADGE DEBUG] overview:', JSON.stringify(data))
      const counts = {}

      // Map dashboard stats to menu item IDs
      if (data.pendingLoans > 0) counts['peminjaman'] = data.pendingLoans
      if (data.pendingGuestVerifications > 0) counts['user-role'] = data.pendingGuestVerifications

      console.log('[BADGE DEBUG] final counts:', JSON.stringify(counts))
      setBadgeCounts(counts)
    } catch (err) {
      console.error('[BADGE DEBUG] Error:', err)
    }
  }, [user])

  // Fetch badge counts on login and periodically
  useEffect(() => {
    if (user) {
      fetchBadgeCounts()
      const interval = setInterval(fetchBadgeCounts, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user, fetchBadgeCounts])

  // Refresh badges when page changes (user might have taken action)
  useEffect(() => {
    if (user) fetchBadgeCounts()
  }, [activePage, user, fetchBadgeCounts])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setActivePage('dashboard')
    setBadgeCounts({})
  }

  // Navigation handler that can pass data between pages
  const handleNavigate = (page, assetId) => {
    setActivePage(page)
    if (assetId) setSelectedAssetId(assetId)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'data-aset':
        return <DataAset />
      case 'peminjaman':
        return <Peminjaman />
      case 'pengembalian':
        return <Pengembalian />
      case 'user-role':
        return <UserRole />
      case 'laporan':
        return <Laporan />
      case 'audit-log':
        return <AuditLog />
      case 'settings':
        return <Settings />
      case 'daftar-aset':
        return <DaftarAset onNavigate={handleNavigate} />
      case 'ajukan-peminjaman':
        return <AjukanPeminjaman selectedAssetId={selectedAssetId} />
      case 'peminjaman-saya':
        return <PeminjamanSaya />
      case 'riwayat':
        return <Riwayat />
      case 'monitoring-agreement':
        return <MonitoringAgreement />
      case 'pengaturan-biaya':
        return <PengaturanBiaya />
      case 'update-kondisi':
        return <UpdateKondisi />
      case 'update-lokasi':
        return <UpdateLokasi />
      default:
        return <Dashboard />
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontSize: '18px', color: '#888'
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="app">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
          onLogout={handleLogout}
          badgeCounts={badgeCounts}
        />

        <main className="main-content">
          <Header user={user} onLogout={handleLogout} />
          {renderPage()}
        </main>
      </div>
    </ToastProvider>
  )
}

export default App