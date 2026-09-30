function UpcomingDueAssets({ data = [] }) {
  return (
    <div className="upcoming-due-card">
      <div className="upcoming-due-header">
        <div>
          <h3>Aset Mendekati Jatuh Tempo</h3>
          <p>Aset yang harus dikembalikan dalam 7 hari ke depan</p>
        </div>
      </div>
      <div className="due-table-wrapper">
        <table className="due-table">
          <thead>
            <tr>
              <th>Aset</th>
              <th>Peminjam</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '1.5rem' }}>Tidak ada aset mendekati jatuh tempo</td></tr>
            ) : (
              data.map((loan, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{loan.asset?.name || '-'}</td>
                  <td>{loan.borrower?.name || '-'}</td>
                  <td>{loan.estimated_return_date || '-'}</td>
                  <td>
                    <span className="loan-status terlambat">
                      {new Date(loan.estimated_return_date) < new Date() ? 'Terlambat' : 'Segera'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UpcomingDueAssets