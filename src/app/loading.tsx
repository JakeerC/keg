export default function Loading() {
  return (
    <>
      <div className="top-bar">
        <div className="top-bar-title">
          Browse <span className="top-bar-subtitle">apps</span>
        </div>
        <div className="skeleton-search" />
      </div>
      
      <main className="content-scroll">
        {/* Skeleton Hero */}
        <div className="hero-card skeleton-card">
          <div>
            <div className="skeleton-line" style={{ width: '120px', height: '12px' }} />
            <div className="skeleton-line" style={{ width: '280px', height: '32px', marginTop: '1rem' }} />
            <div className="skeleton-line" style={{ width: '400px', height: '16px', marginTop: '0.8rem' }} />
          </div>
          <div className="hero-icon-wrapper skeleton-icon" />
        </div>

        {/* Skeleton Grid */}
        <div className="section-header">
          <div className="skeleton-line" style={{ width: '160px', height: '20px' }} />
        </div>
        <div className="app-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="app-card skeleton-card">
              <div className="card-header">
                <div className="app-icon skeleton-icon-sm" />
                <div className="app-info" style={{ flex: 1 }}>
                  <div className="skeleton-line" style={{ width: '60%', height: '16px' }} />
                  <div className="skeleton-line" style={{ width: '30%', height: '12px', marginTop: '6px' }} />
                </div>
              </div>
              <div className="skeleton-line" style={{ width: '100%', height: '12px', marginTop: '0.5rem' }} />
              <div className="skeleton-line" style={{ width: '85%', height: '12px', marginTop: '6px' }} />
              
              <div className="card-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-line" style={{ width: '80px', height: '12px' }} />
                <div className="skeleton-line" style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
