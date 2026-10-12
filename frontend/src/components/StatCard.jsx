function StatCard({ title, value, icon: Icon, color, description }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {typeof Icon === 'string' ? Icon : <Icon size={20} strokeWidth={1.8} />}
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