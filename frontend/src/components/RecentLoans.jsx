function RecentLoans() {
  const loans = [
    {
      asset: 'Laptop Lenovo ThinkPad',
      borrower: 'Budi Santoso',
      date: '20 Sep 2026',
      status: 'Dipinjam',
    },
    {
      asset: 'Proyektor Epson',
      borrower: 'Siti Rahma',
      date: '19 Sep 2026',
      status: 'Dikembalikan',
    },
    {
      asset: 'Kamera Canon EOS',
      borrower: 'Andi Wijaya',
      date: '18 Sep 2026',
      status: 'Dipinjam',
    },
    {
      asset: 'Printer Epson L3210',
      borrower: 'Rina Amelia',
      date: '17 Sep 2026',
      status: 'Terlambat',
    },
  ]

  return (
    <div className="recent-loans">
      <div className="table-header">
        <div>
          <h3>Peminjaman Terbaru</h3>
          <p>Daftar peminjaman aset terbaru</p>
        </div>

        <button className="view-all">
          Lihat Semua
        </button>
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
            {loans.map((loan, index) => (
              <tr key={index}>
                <td>{loan.asset}</td>
                <td>{loan.borrower}</td>
                <td>{loan.date}</td>
                <td>
                  <span
                    className={`loan-status ${loan.status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentLoans