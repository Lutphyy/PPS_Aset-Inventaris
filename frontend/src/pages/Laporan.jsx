import { useState } from 'react'
import { FileText, Download, Package, Wrench, ArrowRightLeft, DollarSign } from 'lucide-react'
import { reportsAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

function Laporan() {
  const { toast } = useToast()
  const [downloading, setDownloading] = useState('')

  const download = async (type, fn) => {
    setDownloading(type)
    try { await fn(); toast.success('Download berhasil!') }
    catch (err) { toast.error('Gagal download: ' + err.message) }
    finally { setDownloading('') }
  }

  const reports = [
    { id: 'assets', title: 'Laporan Seluruh Aset', desc: 'Daftar lengkap semua aset yang terdaftar', Icon: Package, color: '#7355d8', bg: '#eee9ff', fn: reportsAPI.downloadAssetsExcel },
    { id: 'condition', title: 'Laporan Aset per Kondisi', desc: 'Export Excel dengan sheet terpisah per kondisi (Baik, Cukup, Kurang, Rusak Ringan, Rusak Berat)', Icon: Wrench, color: '#d79b32', bg: '#fff4dd', fn: reportsAPI.downloadAssetsByConditionExcel },
    { id: 'loans', title: 'Laporan Peminjaman', desc: 'Rekap seluruh peminjaman aset', Icon: ArrowRightLeft, color: '#527bd8', bg: '#e9f0ff', fn: reportsAPI.downloadLoansExcel },
    { id: 'revenue', title: 'Laporan Dana Masuk', desc: 'Rekap pendapatan dari biaya peminjaman (kampus vs tamu)', Icon: DollarSign, color: '#35a483', bg: '#e4f6f0', fn: reportsAPI.downloadRevenueExcel },
  ]

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Laporan & Export</h1><p>Generate dan download laporan dalam format Excel</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {reports.map(r => (
          <div key={r.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <r.Icon size={22} strokeWidth={1.8} />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px' }}>{r.title}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#888', lineHeight: 1.5 }}>{r.desc}</p>
            <button onClick={() => download(r.id, r.fn)} disabled={downloading === r.id}
              className="add-asset-button" style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              <Download size={14} />
              <span>{downloading === r.id ? 'Downloading...' : 'Download Excel'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Laporan
