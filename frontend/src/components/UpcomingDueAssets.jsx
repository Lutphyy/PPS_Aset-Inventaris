function UpcomingDueAssets() {
  const assets = [
    {
      asset: 'Proyektor BenQ MX550',
      borrower: 'Ahmad Fauzan',
      unit: 'Fakultas Teknik dan Kemaritiman',
      dueDate: '2026-09-17',
      status: 'Aktif',
    },
    {
      asset: 'Laptop Dell Latitude 5420',
      borrower: 'Rina Marlina',
      unit: 'Fakultas Teknik dan Kemaritiman',
      dueDate: '2026-09-15',
      status: 'Terlambat',
    },
    {
      asset: 'Bus Kampus Isuzu Elf',
      borrower: 'Siti Nurhaliza',
      unit: 'Bagian Umum',
      dueDate: '2026-09-20',
      status: 'Aktif',
    },
    {
      asset: 'Osiloskop Digital Tektronix',
      borrower: 'Dewi Anggraini',
      unit: 'Fakultas Kelautan dan Ilmu Perikanan',
      dueDate: '2026-09-14',
      status: 'Aktif',
    },
  ]

  return (
    <div className="upcoming-due-card">

      <div className="upcoming-due-header">

        <div>
          <h3>Aset yang Mendekati Jatuh Tempo</h3>
          <p>Daftar aset yang mendekati batas waktu peminjaman</p>
        </div>

        <button className="view-all">
          Lihat semua
        </button>

      </div>


      <div className="due-table-wrapper">

        <table className="due-table">

          <thead>
            <tr>
              <th>Aset</th>
              <th>Peminjam</th>
              <th>Unit</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
            </tr>
          </thead>


          <tbody>

            {assets.map((item, index) => (

              <tr key={index}>

                <td className="asset-name">
                  {item.asset}
                </td>

                <td>
                  {item.borrower}
                </td>

                <td>
                  {item.unit}
                </td>

                <td>
                  {item.dueDate}
                </td>

                <td>

                  <span
                    className={`due-status ${
                      item.status === 'Terlambat'
                        ? 'late'
                        : item.status === 'Dikembalikan'
                          ? 'returned'
                          : 'active'
                    }`}
                  >
                    {item.status}
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

export default UpcomingDueAssets