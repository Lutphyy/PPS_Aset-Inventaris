function AssetByLocation() {
  const locations = [
    {
      name: 'Fakultas Teknik dan Kemaritiman',
      total: 9,
    },
    {
      name: 'Fakultas Ekonomi dan Bisnis Maritim',
      total: 2,
    },
    {
      name: 'Fakultas Ilmu Sosial dan Ilmu Politik',
      total: 2,
    },
    {
      name: 'Fakultas Kelautan dan Ilmu Perikanan',
      total: 4,
    },
    {
      name: 'Fakultas Ilmu Keguruan dan Pendidikan',
      total: 2,
    },
    {
      name: 'Fakultas Kedokteran',
      total: 2,
    },
    {
      name: 'Rektorat',
      total: 3,
    },
    {
      name: 'Perpustakaan',
      total: 1,
    },
    {
      name: 'Bagian Umum',
      total: 5,
    },
  ]

  const maxAsset = 9

  return (
    <div className="asset-location-card">

      <div className="asset-location-header">
        <h3>Statistik Aset per Unit / Lokasi</h3>

        <button className="view-all">
          Lihat semua
        </button>
      </div>

      <div className="location-list">
        {locations.map((location, index) => {
          const progress = (location.total / maxAsset) * 100

          return (
            <div className="location-item" key={index}>

              <span className="location-name">
                {location.name}
              </span>

              <div className="location-bar">
                <div
                  className="location-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <strong>
                {location.total} aset
              </strong>

            </div>
          )
        })}
      </div>

    </div>
  )
}

export default AssetByLocation