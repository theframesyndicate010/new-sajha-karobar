export default function PageHeaderCard({ title, subtitle, actionLabel, actionIcon, onActionClick }) {
  return (
    <div className="page-header-card">
      <div className="page-header-card-body">
        <div>
          <h2 className="page-header-title">{title}</h2>
          <p className="page-header-subtitle">{subtitle}</p>
        </div>

        {actionLabel ? (
          <button className="page-header-btn" onClick={onActionClick} type="button">
            {actionIcon}
            <span>{actionLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
