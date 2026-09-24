function StatCard({ title, value, icon, color, description }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>

      <div className="stat-content">
        <span>{title}</span>
        <strong>{value}</strong>

        {description && (
          <small>{description}</small>
        )}
      </div>
    </div>
  )
}

export default StatCard