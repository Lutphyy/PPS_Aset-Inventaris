import { useState, useEffect } from 'react'
import {
  Package, CheckCircle, ArrowRightLeft, Users, Wrench,
  HeartCrack, RefreshCw, Trash2, Clock, DollarSign,
  Wallet, Hourglass, ShieldCheck
} from 'lucide-react'
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
  const byUnit = stats?.assetsByUnit || []
  const recent = stats?.recentLoans || []
  const upcoming = stats?.upcomingDue || []

  const totalAssets = ov.totalAssets ?? '-'
  const tersedia = byStatus.TERSEDIA ?? 0
  const dipinjam = byStatus.DIPINJAM ?? 0
  const perbaikan = byStatus.DALAM_PERBAIKAN ?? 0
  const rusak = byStatus.RUSAK ?? 0
  const dipindahkan = byStatus.DIPINDAHKAN ?? 0
  const dimusnahkan = byStatus.DIMUSNAHKAN ?? 0

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')

  return (
    <>
      <div className="page-title">
        <div className="welcome-text">
          <h1>Selamat datang, {user.name?.split(' ')[0] || 'User'}</h1>
          <p>{user.role === 'OPERATOR' ? `Ringkasan aset unit ${user.unit?.name || 'Anda'}.` : 'Ringkasan aset dan aktivitas di seluruh unit universitas.'}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Memuat dashboard...</div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard title="Total Seluruh Aset" value={totalAssets} icon={Package} color="purple" />
            <StatCard title="Aset Tersedia" value={tersedia} icon={CheckCircle} color="green" />
            <StatCard title="Aset Dipinjam" value={dipinjam} icon={ArrowRightLeft} color="blue" />
            {user.role === 'SUPER_ADMIN' && (
              <StatCard title="Total Pengguna" value={ov.totalUsers ?? '-'} icon={Users} color="pink" />
            )}
            <StatCard title="Dalam Perbaikan" value={perbaikan} icon={Wrench} color="yellow" />
            <StatCard title="Rusak" value={rusak} icon={HeartCrack} color="red" />
            <StatCard title="Dipindahkan" value={dipindahkan} icon={RefreshCw} color="gray" />
            <StatCard title="Dimusnahkan" value={dimusnahkan} icon={Trash2} color="gray" />
            <StatCard title="Peminjaman Aktif" value={ov.activeLoans ?? '-'} icon={Clock} color="light-blue" />
          </section>

          {/* Super Admin extra cards */}
          {user.role === 'SUPER_ADMIN' && (
            <section className="stats-grid" style={{ marginTop: '14px' }}>
              <StatCard title="Menunggu Approval" value={ov.pendingLoans ?? 0} icon={Hourglass} color="yellow" />
              <StatCard title="Verifikasi Guest" value={ov.pendingGuestVerifications ?? 0} icon={ShieldCheck} color="pink" />
            </section>
          )}

          {/* Admin Unit extra cards: revenue + approval */}
          {user.role === 'ADMIN_UNIT' && (
            <section className="stats-grid" style={{ marginTop: '14px' }}>
              <StatCard title="Dana Masuk Bulan Ini" value={fmtIDR(ov.revenueThisMonth)} icon={DollarSign} color="green" />
              <StatCard title="Total Dana Masuk" value={fmtIDR(ov.revenueTotal)} icon={Wallet} color="purple" />
              <StatCard title="Menunggu Approval" value={ov.pendingLoans ?? 0} icon={Hourglass} color="yellow" />
              <StatCard title="Verifikasi Guest" value={ov.pendingGuestVerifications ?? 0} icon={ShieldCheck} color="pink" />
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
            {byUnit.length > 0 ? (
              <div className="chart-card">
                <div className="chart-header"><div><h3>Aset per Unit</h3><p>Distribusi aset per prodi/unit</p></div></div>
                <div style={{ padding: '0 16px 16px' }}>
                  {byUnit.map((u, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < byUnit.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{u.unit}</span>
                        <span style={{ fontSize: '10px', color: '#527bd8', background: '#e9f0ff', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{u.unit_code}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#149E93' }}>{u.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AssetByLocation data={[]} />
            )}
            <RecentLoans data={recent} />
          </section>

          <UpcomingDueAssets data={upcoming} />
        </>
      )}
    </>
  )
}

export default Dashboard