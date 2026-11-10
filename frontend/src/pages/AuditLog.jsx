import { useState, useEffect } from 'react'
import { History, Search, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { activityLogsAPI, assetLogsAPI } from '../utils/api'

function AuditLog() {
  const [activeTab, setActiveTab] = useState('aktivitas') // 'aktivitas' or 'barang'
  const [logs, setLogs] = useState([])
  const [assetLogs, setAssetLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchActivity, setSearchActivity] = useState('')
  const [searchAsset, setSearchAsset] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [expandedLog, setExpandedLog] = useState(null)
  const [paginationActivity, setPaginationActivity] = useState({ total: 0, page: 1, totalPages: 1 })
  const [paginationAsset, setPaginationAsset] = useState({ total: 0, page: 1, totalPages: 1 })

  useEffect(() => { fetchLogs() }, [])
  useEffect(() => { if (activeTab === 'barang') fetchAssetLogs() }, [activeTab])

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true)
      const params = { limit: 25, page }
      if (searchActivity) params.search = searchActivity
      const res = await activityLogsAPI.getAll(params)
      setLogs(res.data || [])
      setPaginationActivity(res.pagination || { total: res.data?.length || 0, page: 1, totalPages: 1 })
    } catch (err) {
      console.error('Audit log fetch error:', err)
      setLogs([])
    } finally { setLoading(false) }
  }

  const fetchAssetLogs = async (page = 1) => {
    try {
      setLoading(true)
      const params = { limit: 25, page }
      if (searchAsset) params.search = searchAsset
      if (filterAction) params.action = filterAction
      const res = await assetLogsAPI.getAll(params)
      setAssetLogs(res.data || [])
      setPaginationAsset(res.pagination || { total: res.data?.length || 0, page: 1, totalPages: 1 })
    } catch (err) {
      console.error('Asset log fetch error:', err)
      setAssetLogs([])
    } finally { setLoading(false) }
  }

  const actionColor = (action) => {
    if (action?.includes('CREATE') || action?.includes('APPROVE') || action?.includes('CLAIM')) return { bg: '#e4f6f0', color: '#299579' }
    if (action?.includes('DELETE') || action?.includes('REJECT') || action?.includes('DESTROY')) return { bg: '#ffe9e7', color: '#df625d' }
    if (action?.includes('UPDATE') || action?.includes('TOGGLE')) return { bg: '#e9f0ff', color: '#527bd8' }
    if (action?.includes('RETURN')) return { bg: '#f0eafc', color: '#7C57D6' }
    if (action?.includes('LOGIN') || action?.includes('LOGOUT')) return { bg: '#f0eafc', color: '#7C57D6' }
    if (action?.includes('IMPORT')) return { bg: '#e8f5e9', color: '#2e7d32' }
    if (action?.includes('TRANSFER') || action?.includes('ASSIGN')) return { bg: '#fff3e0', color: '#e65100' }
    if (action?.includes('RELEASE')) return { bg: '#e3f2fd', color: '#1565c0' }
    if (action?.includes('RENTAL') || action?.includes('SET_')) return { bg: '#fce4ec', color: '#c62828' }
    return { bg: '#f0f0f0', color: '#666' }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('id-ID') : '-'
  const formatCurrency = (v) => {
    if (!v || v === '0.00') return '-'
    return 'Rp ' + parseFloat(v).toLocaleString('id-ID')
  }

  const renderPagination = (pg, fetchFn, label = 'data') => {
    if (pg.totalPages <= 1) return null
    const current = pg.page
    const total = pg.totalPages
    const pages = []
    if (current > 3) pages.push(1)
    if (current > 4) pages.push('...')
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i)
    if (current < total - 3) pages.push('...')
    if (current < total - 2) pages.push(total)
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #eee' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>
          Halaman {current} dari {total} ({pg.total} {label})
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => fetchFn(current - 1)} disabled={current <= 1}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: current <= 1 ? 'not-allowed' : 'pointer', opacity: current <= 1 ? 0.4 : 1 }}>
            ‹ Prev
          </button>
          {pages.map((p, i) =>
            p === '...' ? <span key={`e${i}`} style={{ padding: '5px 4px', fontSize: '12px', color: '#999' }}>…</span> : (
              <button key={p} onClick={() => fetchFn(p)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid #ddd', cursor: 'pointer',
                  background: p === current ? '#7C57D6' : '#fff', color: p === current ? '#fff' : '#333',
                }}>
                {p}
              </button>
            )
          )}
          <button onClick={() => fetchFn(current + 1)} disabled={current >= total}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #ddd', background: '#fff', cursor: current >= total ? 'not-allowed' : 'pointer', opacity: current >= total ? 0.4 : 1 }}>
            Next ›
          </button>
        </div>
      </div>
    )
  }

  const ASSET_ACTIONS = [
    { value: '', label: 'Semua Aksi' },
    { value: 'CREATE_ASSET', label: 'Buat Aset' },
    { value: 'UPDATE_ASSET', label: 'Update Aset' },
    { value: 'DELETE_ASSET', label: 'Hapus Aset' },
    { value: 'UPDATE_ASSET_CONDITION', label: 'Update Kondisi' },
    { value: 'UPDATE_ASSET_STATUS', label: 'Update Status' },
    { value: 'CLAIM_ASSET', label: 'Klaim Aset' },
    { value: 'ASSIGN_ASSET', label: 'Assign Aset' },
    { value: 'TRANSFER_ASSET', label: 'Transfer Aset' },
    { value: 'TOGGLE_BORROWABLE', label: 'Toggle Borrowable' },
    { value: 'SET_RENTAL_PRICE', label: 'Set Harga Sewa' },
    { value: 'IMPORT_ASSETS', label: 'Import Aset' },
    { value: 'DESTROY_ASSET', label: 'Pemusnahan' },
    { value: 'RELEASE_ASSET', label: 'Pelepasan' },
    { value: 'CREATE_LOAN', label: 'Pengajuan Peminjaman' },
    { value: 'APPROVE_LOAN', label: 'Persetujuan Peminjaman' },
    { value: 'REJECT_LOAN', label: 'Penolakan Peminjaman' },
    { value: 'RETURN_LOAN', label: 'Pengembalian Aset' },
  ]

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Audit Log</h1><p>Riwayat aktivitas seluruh pengguna sistem</p></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f0f0f5', borderRadius: '12px', padding: '4px' }}>
        <button
          onClick={() => setActiveTab('aktivitas')}
          style={{
            flex: 1, padding: '10px 20px', borderRadius: '10px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '0.2s',
            background: activeTab === 'aktivitas' ? '#fff' : 'transparent',
            color: activeTab === 'aktivitas' ? '#292936' : '#888',
            boxShadow: activeTab === 'aktivitas' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <History size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Log Aktivitas
        </button>
        <button
          onClick={() => setActiveTab('barang')}
          style={{
            flex: 1, padding: '10px 20px', borderRadius: '10px', border: 'none',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '0.2s',
            background: activeTab === 'barang' ? '#fff' : 'transparent',
            color: activeTab === 'barang' ? '#292936' : '#888',
            boxShadow: activeTab === 'barang' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Package size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Log Barang
        </button>
      </div>

      {/* ========== TAB 1: LOG AKTIVITAS ========== */}
      {activeTab === 'aktivitas' && (
        <div className="asset-table-card">
          <div className="asset-table-header">
            <div><h3>Log Aktivitas</h3><p>Catatan seluruh aksi yang dilakukan dalam sistem</p></div>
            <span className="asset-total">{paginationActivity.total} Log</span>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                <input
                  type="text"
                  placeholder="Cari user, aksi, atau deskripsi..."
                  value={searchActivity}
                  onChange={e => setSearchActivity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchLogs(1)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={() => fetchLogs(1)}>Cari</button>
            </div>
          </div>

          <div className="asset-table-wrapper">
            <table className="asset-table">
              <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Deskripsi</th><th>IP</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    {searchActivity ? 'Tidak ada hasil pencarian' : 'Belum ada log aktivitas.'}
                  </td></tr>
                ) : logs.map((log, i) => {
                  const ac = actionColor(log.action)
                  return (
                    <tr key={i}>
                      <td style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                      <td style={{ fontWeight: 600 }}>{log.user?.name || '-'}</td>
                      <td><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: ac.bg, color: ac.color }}>{log.action?.replace(/_/g, ' ')}</span></td>
                      <td style={{ fontSize: '12px', color: '#555', maxWidth: '300px' }}>{log.description || '-'}</td>
                      <td style={{ fontSize: '11px', color: '#999' }}>{log.ip_address || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {renderPagination(paginationActivity, fetchLogs, 'log')}
        </div>
      )}

      {/* ========== TAB 2: LOG BARANG ========== */}
      {activeTab === 'barang' && (
        <div className="asset-table-card">
          <div className="asset-table-header">
            <div><h3>Log Barang</h3><p>Riwayat detail setiap perubahan pada barang/aset</p></div>
            <span className="asset-total">{paginationAsset.total} Log</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '0 20px 16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                type="text"
                placeholder="Cari deskripsi, nama barang..."
                value={searchAsset}
                onChange={e => setSearchAsset(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchAssetLogs(1)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', background: '#fff' }}
            >
              {ASSET_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <button className="add-asset-button" style={{ padding: '8px 14px' }} onClick={() => fetchAssetLogs(1)}>Cari</button>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Memuat...</div>
            ) : assetLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                {searchAsset || filterAction ? 'Tidak ada hasil yang sesuai filter' : 'Belum ada log barang.'}
              </div>
            ) : assetLogs.map((log, i) => {
              const ac = actionColor(log.action)
              const isExpanded = expandedLog === i
              return (
                <div key={i} style={{
                  background: '#fff', border: '1px solid #eee', borderRadius: '12px',
                  marginBottom: '10px', overflow: 'hidden', transition: '0.2s'
                }}>
                  {/* Log Header */}
                  <div
                    onClick={() => setExpandedLog(isExpanded ? null : i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
                      cursor: 'pointer', userSelect: 'none'
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                        fontSize: '10px', fontWeight: 700, background: ac.bg, color: ac.color
                      }}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#292936' }}>
                        {log.asset?.nama_barang || `Aset #${log.entity_id}`}
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        oleh <strong>{log.user?.name || '-'}</strong>
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap', marginRight: '8px' }}>
                      {formatDate(log.created_at)}
                    </span>
                    {isExpanded ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f0f0f0' }}>
                      {/* Deskripsi Aksi */}
                      <div style={{ padding: '12px 0', fontSize: '13px', color: '#555' }}>
                        <strong style={{ color: '#444' }}>Deskripsi:</strong> {log.description || '-'}
                      </div>

                      {/* Detail Barang */}
                      {log.asset && (
                        <div style={{
                          background: '#f8f9fc', borderRadius: '10px', padding: '16px',
                          border: '1px solid #eef0f4'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package size={14} /> Detail Barang Saat Ini
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                            <DetailField label="Nama Barang" value={log.asset.nama_barang} />
                            <DetailField label="Kode Register" value={log.asset.kode_register} />
                            <DetailField label="Kode Barang" value={log.asset.kode_barang} />
                            <DetailField label="Merk" value={log.asset.merk} />
                            <DetailField label="Tipe" value={log.asset.tipe} />
                            <DetailField label="Kondisi" value={log.asset.kondisi} highlight />
                            <DetailField label="Status" value={log.asset.status} highlight />
                            <DetailField label="Unit" value={log.asset.unit?.name} />
                          </div>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '11px', color: '#aaa' }}>
                        <span>IP: {log.ip_address || '-'}</span>
                        <span>Entity: {log.entity} #{log.entity_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {renderPagination(paginationAsset, fetchAssetLogs, 'log')}
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
      <div style={{
        fontSize: '12px', fontWeight: highlight ? 700 : 500, color: highlight ? '#292936' : '#555'
      }}>{value || '-'}</div>
    </div>
  )
}

export default AuditLog
