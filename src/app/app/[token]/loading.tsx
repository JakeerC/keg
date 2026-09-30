export default function AppDetailLoading() {
  return (
    <>
      <div className="top-bar">
        <div className="skeleton-line" style={{ width: '80px', height: '18px' }} />
      </div>
      
      <main className="content-scroll">
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
            <div className="hero-icon-wrapper skeleton-icon" style={{ width: '140px', height: '140px', flexShrink: 0 }} />
            
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '150px', height: '14px', marginBottom: '0.8rem' }} />
              <div className="skeleton-line" style={{ width: '300px', height: '40px', marginBottom: '1rem' }} />
              
              <div className="skeleton-line" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '90%', height: '16px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '60%', height: '16px', marginBottom: '1.5rem' }} />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="skeleton-line" style={{ width: '110px', height: '40px', borderRadius: '20px' }} />
                <div className="skeleton-line" style={{ width: '110px', height: '40px', borderRadius: '20px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="app-card skeleton-card" style={{ padding: '1.5rem' }}>
                <div className="skeleton-line" style={{ width: '80px', height: '12px', marginBottom: '1rem' }} />
                <div className="skeleton-line" style={{ width: '100px', height: '28px' }} />
              </div>
            ))}
          </div>

          <div className="app-card skeleton-card" style={{ padding: '2rem' }}>
            <div className="skeleton-line" style={{ width: '200px', height: '20px', marginBottom: '1.5rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '16px', marginBottom: '1rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
          </div>

        </div>
      </main>
    </>
  );
}
