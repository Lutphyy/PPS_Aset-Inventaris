function RecentLoans({ data = [] }) {
  const statusClass = (s) => {
    const map = {
      AKTIF: 'dipinjam', DISETUJUI: 'dipinjam', MENUNGGU: 'terlambat',
      DIKEMBALIKAN: 'dikembalikan', TERLAMBAT: 'terlambat', DITOLAK: 'terlambat'
    }
    return map[s] || ''
  }
  const statusLabel = (s) => s?.replace(/_/g, ' ') || s

  return (
    <div className="recent-loans">
      <div className="table-header">
        <div>
          <h3>Peminjaman Terbaru</h3>
          <p>5 peminjaman terakhir</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Aset</th>
              <th>Peminjam</th>
              <th>Tanggal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>Belum ada peminjaman</td></tr>
            ) : (
              data.map((loan, i) => (
                <tr key={i}>
                  <td>{loan.asset?.name || '-'}</td>
                  <td>{loan.borrower?.name || '-'}</td>
                  <td>{loan.borrow_date || '-'}</td>
                  <td><span className={`loan-status ${statusClass(loan.status)}`}>{statusLabel(loan.status)}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentLoans