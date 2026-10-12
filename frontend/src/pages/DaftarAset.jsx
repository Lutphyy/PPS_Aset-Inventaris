import { useState, useEffect } from 'react'
import { Search, Building2 } from 'lucide-react'
import { assetsAPI, unitsAPI } from '../utils/api'

const fmtIDR = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const condLabel = (c) => c?.replace(/_/g, ' ') || c

function DaftarAset({ onNavigate }) {
  const [assets, setAssets] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')

  useEffect(() => {
    fetchUnits()
  }, [])

  useEffect(() => {
    if (selectedUnitId) fetchAssets()
  }, [selectedUnitId])

  const fetchUnits = async () => {
    try {
      const res = await unitsAPI.getAll({ active_only: true })
      setUnits(res.data || [])
      setLoading(false)
    } catch (err) { console.error(err); setLoading(false) }
  }

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const res = await assetsAPI.getAll({ search, status: 'TERSEDIA', unit_id: selectedUnitId, limit: 100 })
      setAssets(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Step 1: Select Unit
  if (!selectedUnitId) {
    return (
      <div className="asset-page">
        <div className="asset-page-header">
          <div><h1>Daftar Aset</h1><p>Pilih unit/prodi terlebih dahulu untuk melihat aset yang tersedia</p></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
          {loading ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '2rem' }}>Memuat unit...</p> :
            units.length === 0 ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '2rem' }}>Tidak ada unit tersedia</p> :
            units.map(unit => (
              <div key={unit.id} onClick={() => setSelectedUnitId(unit.id)}
                style={{
                  background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '24px',
                  cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', gap: '8px',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#527bd8'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(82,123,216,0.12)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="#527bd8" />
                </div>
                <h3 style={{ margin: 0, fontSize: '15px' }}>{unit.name}</h3>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#527bd8', background: '#e9f0ff', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>{unit.code}</span>
                {unit.description && <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{unit.description}</p>}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{unit.assets_count || 0} aset tersedia</div>
              </div>
            ))
          }
        </div>
      </div>
    )
  }

  // Step 2: Show Assets for selected unit
  const selectedUnit = units.find(u => u.id === selectedUnitId)

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>Daftar Aset — {selectedUnit?.name || ''}</h1>
          <p>Lihat aset yang tersedia untuk dipinjam di unit ini</p>
        </div>
        <button className="add-asset-button" style={{ padding: '8px 14px', background: '#f0f4ff', color: '#527bd8', border: '1px solid #d0dcf4' }}
          onClick={() => { setSelectedUnitId(''); setAssets([]) }}>
          ← Ganti Unit
        </button>
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
          assets.length === 0 ? <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '2rem' }}>Tidak ada aset tersedia di unit ini</p> :
          assets.map(a => (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>{a.code}</div>
              <h3 style={{ margin: 0, fontSize: '14px' }}>{a.name}</h3>
              <div style={{ fontSize: '12px', color: '#666' }}>{a.category} · {a.location?.name || '-'}</div>
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
