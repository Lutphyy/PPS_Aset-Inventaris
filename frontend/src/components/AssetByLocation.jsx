function AssetByLocation({ data = [] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="asset-location-card">
      <div className="asset-location-header">
        <h3>Aset per Lokasi</h3>
      </div>
      <div className="location-list">
        {data.length === 0 ? (
          <p style={{ color: '#999', fontSize: '12px' }}>Belum ada data lokasi</p>
        ) : (
          data.map((item, i) => (
            <div className="location-item" key={i}>
              <span className="location-name">{item.location}</span>
              <div className="location-bar">
                <div
                  className="location-bar-fill"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AssetByLocation