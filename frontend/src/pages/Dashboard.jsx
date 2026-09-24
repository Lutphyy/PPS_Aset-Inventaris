import StatCard from '../components/StatCard'
import DonutChart from '../components/DonutChart'
import StatusChart from '../components/StatusChart'
import RecentLoans from '../components/RecentLoans'
import AssetByLocation from '../components/AssetByLocation'
import UpcomingDueAssets from '../components/UpcomingDueAssets'
import { Sparkles } from 'lucide-react'

function Dashboard() {
  return (
    <>
      {/* =========================================
          PAGE TITLE / WELCOME
      ========================================= */}
      <div className="page-title">
        <div className="welcome-text">
          <h1>Selamat datang, Andi</h1>
          <p>
            Ringkasan aset dan aktivitas di seluruh unit universitas.
          </p>
        </div>

        <button className="add-asset-button">
          <span>+</span>
          Tambah Aset
        </button>
      </div>

      {/* =========================================
          STATISTIK
      ========================================= */}
      <section className="stats-grid">

        <StatCard
          title="Total Seluruh Aset"
          value="30"
          icon="📦"
          color="purple"
          description="↗ +3 bulan ini"
        />

        <StatCard
          title="Aset Tersedia"
          value="17"
          icon="✅"
          color="green"
        />

        <StatCard
          title="Aset Dipinjam"
          value="7"
          icon="↔️"
          color="blue"
        />

        <StatCard
          title="Total Pengguna"
          value="12"
          icon="👥"
          color="pink"
        />

        <StatCard
          title="Dalam Perbaikan"
          value="3"
          icon="🔍"
          color="yellow"
        />

        <StatCard
          title="Rusak"
          value="2"
          icon="💔"
          color="red"
        />

        <StatCard
          title="Dihapuskan"
          value="1"
          icon="🗑️"
          color="gray"
        />

        <StatCard
          title="Peminjaman Aktif"
          value="4"
          icon="⏰"
          color="light-blue"
        />

      </section>

      {/* =========================================
          DIAGRAM
      ========================================= */}
      <section className="charts-grid">

        {/* ASET PER KATEGORI */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Aset per Kategori</h3>
              <p>Distribusi aset berdasarkan kategori</p>
            </div>
          </div>

          <DonutChart
            data={[
              {
                name: 'Elektronik',
                value: 12,
              },
              {
                name: 'Furniture',
                value: 8,
              },
              {
                name: 'Kendaraan',
                value: 5,
              },
              {
                name: 'Lainnya',
                value: 5,
              },
            ]}
          />
        </div>

        {/* KONDISI ASET */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Kondisi Aset</h3>
              <p>Distribusi berdasarkan kondisi</p>
            </div>
          </div>

          <DonutChart
            data={[
              {
                name: 'Baik',
                value: 22,
              },
              {
                name: 'Rusak Ringan',
                value: 5,
              },
              {
                name: 'Rusak Berat',
                value: 3,
              },
            ]}
          />
        </div>

        {/* STATUS ASET */}
        <div className="status-chart-card">
          <div className="chart-header">
            <div>
              <h3>Status Aset</h3>
              <p>Jumlah aset berdasarkan status</p>
            </div>
          </div>

          <StatusChart
            data={[
              {
                name: 'Tersedia',
                value: 17,
              },
              {
                name: 'Dipinjam',
                value: 7,
              },
              {
                name: 'Perbaikan',
                value: 3,
              },
              {
                name: 'Rusak',
                value: 2,
              },
              {
                name: 'Dihapuskan',
                value: 1,
              },
            ]}
          />
        </div>

      </section>

      {/* =========================================
          LOKASI + PEMINJAMAN
      ========================================= */}
      <section className="dashboard-middle-grid">

        <AssetByLocation />

        <RecentLoans />

      </section>

      {/* =========================================
          JATUH TEMPO
      ========================================= */}
      <UpcomingDueAssets />

      {/* =========================================
          ASISTEN ASET
      ========================================= */}
      <button
        type="button"
        className="asset-assistant-button"
        title="Asisten Aset"
      >
        <Sparkles
          size={22}
          strokeWidth={2}
        />

        <span>Asisten Aset</span>
      </button>

    </>
  )
}

export default Dashboard