import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import DonutChart from '../components/DonutChart'
import StatusChart from '../components/StatusChart'
import RecentLoans from '../components/RecentLoans'
import AssetByLocation from '../components/AssetByLocation'
import UpcomingDueAssets from '../components/UpcomingDueAssets'
import { dashboardAPI } from '../utils/api'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStats()
      if (res.success) setStats(res.data)
    } catch (err) {
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const ov = stats?.overview || {}
  const byStatus = stats?.assetsByStatus || {}
  const byCond = stats?.assetsByCondition || {}
  const byCat = stats?.assetsByCategory || []
  const byLoc = stats?.assetsByLocation || []
  const recent = stats?.recentLoans || []
  const upcoming = stats?.upcomingDue || []

  const totalAssets = ov.totalAssets ?? '-'
  const tersedia = byStatus.TERSEDIA ?? 0
  const dipinjam = byStatus.DIPINJAM ?? 0
  const perbaikan = byStatus.DALAM_PERBAIKAN ?? 0
  const rusak = byStatus.RUSAK ?? 0
  const dihapuskan = byStatus.DIHAPUSKAN ?? 0

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

  return (
    <>
      <div className="page-title">
        <div className="welcome-text">
          <h1>Selamat datang, {user.name?.split(' ')[0] || 'User'}</h1>
          <p>Ringkasan aset dan aktivitas di seluruh unit universitas.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Memuat dashboard...</div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard title="Total Seluruh Aset" value={totalAssets} icon="📦" color="purple" />
            <StatCard title="Aset Tersedia" value={tersedia} icon="✅" color="green" />
            <StatCard title="Aset Dipinjam" value={dipinjam} icon="↔️" color="blue" />
            <StatCard title="Total Pengguna" value={ov.totalUsers ?? '-'} icon="👥" color="pink" />
            <StatCard title="Dalam Perbaikan" value={perbaikan} icon="🔧" color="yellow" />
            <StatCard title="Rusak" value={rusak} icon="💔" color="red" />
            <StatCard title="Dihapuskan" value={dihapuskan} icon="🗑️" color="gray" />
            <StatCard title="Peminjaman Aktif" value={ov.activeLoans ?? '-'} icon="⏰" color="light-blue" />
          </section>

          {/* Revenue cards for admin */}
          {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_UNIT') && (
            <section className="stats-grid" style={{ marginTop: '14px' }}>
              <StatCard title="Dana Masuk Bulan Ini" value={fmtIDR(ov.revenueThisMonth)} icon="💰" color="green" />
              <StatCard title="Total Dana Masuk" value={fmtIDR(ov.revenueTotal)} icon="💵" color="purple" />
              <StatCard title="Menunggu Approval" value={ov.pendingLoans ?? 0} icon="⏳" color="yellow" />
              <StatCard title="Verifikasi Guest" value={ov.pendingGuestVerifications ?? 0} icon="🆔" color="pink" />
            </section>
          )}

          <section className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Aset per Kategori</h3>
                  <p>Distribusi aset berdasarkan kategori</p>
                </div>
              </div>
              <DonutChart data={byCat.map(c => ({ name: c.category, value: c.count }))} />
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Kondisi Aset</h3>
                  <p>Distribusi berdasarkan kondisi</p>
                </div>
              </div>
              <DonutChart data={Object.entries(byCond).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }))} />
            </div>

            <div className="status-chart-card">
              <div className="chart-header">
                <div>
                  <h3>Status Aset</h3>
                  <p>Jumlah aset berdasarkan status</p>
                </div>
              </div>
              <StatusChart data={Object.entries(byStatus).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }))} />
            </div>
          </section>

          <section className="dashboard-middle-grid">
            <AssetByLocation data={byLoc} />
            <RecentLoans data={recent} />
          </section>

          <UpcomingDueAssets data={upcoming} />
        </>
      )}
    </>
  )
}

export default Dashboard