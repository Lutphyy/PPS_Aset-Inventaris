import { useState, useEffect } from 'react'
import { Search, Eye } from 'lucide-react'
import { assetsAPI } from '../utils/api'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const condLabel = (c) => c?.replace(/_/g, ' ') || c

function DaftarAset({ onNavigate }) {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAssets() }, [])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const res = await assetsAPI.getAll({ search, status: 'TERSEDIA', limit: 100 })
      setAssets(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Daftar Aset</h1><p>Lihat aset yang tersedia untuk dipinjam</p></div>
      </div>

      <div className="asset-filter-card">
        <div className="asset-search">
          <Search size={16} />
          <input type="text" placeholder="Cari aset..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchAssets()} />
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={fetchAssets}>Cari</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {loading ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '2rem' }}>Memuat...</p> :
          assets.length === 0 ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '2rem' }}>Tidak ada aset tersedia</p> :
          assets.map(a => (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>{a.code}</div>
              <h3 style={{ margin: 0, fontSize: '14px' }}>{a.name}</h3>
              <div style={{ fontSize: '12px', color: '#666' }}>{a.category} · {a.location}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: '#e4f6f0', color: '#299579' }}>Tersedia</span>
                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: '#e9f0ff', color: '#527bd8' }}>{condLabel(a.condition)}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#149E93', marginTop: '4px' }}>{fmtIDR(a.rental_price_per_day)}<span style={{ fontSize: '11px', fontWeight: 400, color: '#888' }}>/hari</span></div>
              <button className="add-asset-button" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                onClick={() => onNavigate && onNavigate('ajukan-peminjaman', a.id)}>
                Ajukan Peminjaman
              </button>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default DaftarAset
