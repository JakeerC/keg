export default function Home() {
  return (
    <div className="container">
      <header className="header">
        <h1>App Browser</h1>
        <p>Discover Homebrew Formulae and Casks</p>
      </header>
      
      <main className="main-content">
        <section className="search-section">
          <input type="search" placeholder="Search apps..." className="search-input" />
        </section>

        <section className="trending-section">
          <h2>Trending Now</h2>
          <div className="app-grid">
            {/* Grid items will go here */}
            <div className="app-card placeholder">
              <h3>Loading trending apps...</h3>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
