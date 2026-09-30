import { useState, useEffect } from 'react'
import { History, Search } from 'lucide-react'
import { activityLogsAPI } from '../utils/api'

function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      // Backend may not have this endpoint yet, use try/catch
      const res = await activityLogsAPI.getAll({ limit: 50 })
      setLogs(res.data || [])
    } catch (err) {
      console.error('Audit log fetch error:', err)
      setLogs([])
    } finally { setLoading(false) }
  }

  const actionColor = (action) => {
    if (action?.includes('CREATE') || action?.includes('APPROVE')) return { bg: '#e4f6f0', color: '#299579' }
    if (action?.includes('DELETE') || action?.includes('REJECT')) return { bg: '#ffe9e7', color: '#df625d' }
    if (action?.includes('UPDATE') || action?.includes('RETURN')) return { bg: '#e9f0ff', color: '#527bd8' }
    if (action?.includes('LOGIN') || action?.includes('LOGOUT')) return { bg: '#f0eafc', color: '#7C57D6' }
    return { bg: '#f0f0f0', color: '#666' }
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div><h1>Audit Log</h1><p>Riwayat aktivitas seluruh pengguna sistem</p></div>
      </div>

      <div className="asset-table-card">
        <div className="asset-table-header">
          <div><h3>Log Aktivitas</h3><p>Catatan seluruh aksi yang dilakukan dalam sistem</p></div>
          <span className="asset-total">{logs.length} Log</span>
        </div>
        <div className="asset-table-wrapper">
          <table className="asset-table">
            <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Deskripsi</th><th>IP</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Memuat...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Belum ada log aktivitas. Endpoint audit log mungkin belum tersedia di backend.</td></tr>
              ) : logs.map((log, i) => {
                const ac = actionColor(log.action)
                return (
                  <tr key={i}>
                    <td style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap' }}>{log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</td>
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
      </div>
    </div>
  )
}

export default AuditLog
