import { useState } from 'react';
import type { WatchConfig, WatchPart } from './types/watch';
import { categories } from './data/parts';
import PartSelector from './components/PartSelector';
import WatchPreview from './components/WatchPreview';
import OrderSummary from './components/OrderSummary';

const INITIAL_CONFIG: WatchConfig = {
  mecanismo: null,
  esfera: null,
  caja: null,
};

export default function App() {
  const [config, setConfig] = useState<WatchConfig>(INITIAL_CONFIG);

  function handleSelect(categoryId: 'mecanismo' | 'esfera' | 'caja', part: WatchPart) {
    setConfig((prev) => ({ ...prev, [categoryId]: part }));
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="logo">
            <svg
              className="logo-icon"
              viewBox="0 0 48 48"
              width="48"
              height="48"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
              {/* Hour markers */}
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const r1 = 12, r2 = i % 3 === 0 ? 16 : 14;
                return (
                  <line
                    key={i}
                    x1={24 + r1 * Math.cos(angle)}
                    y1={24 + r1 * Math.sin(angle)}
                    x2={24 + r2 * Math.cos(angle)}
                    y2={24 + r2 * Math.sin(angle)}
                    stroke="currentColor"
                    strokeWidth={i % 3 === 0 ? 2 : 1}
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Hour hand */}
              <line x1="24" y1="24" x2="24" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              {/* Minute hand */}
              <line x1="24" y1="24" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              {/* Center dot */}
              <circle cx="24" cy="24" r="2" fill="currentColor" />
            </svg>

            <div className="logo-text">
              <span className="logo-brand">SEIKO MOD STUDIO</span>
              <span className="logo-tagline">Relojería artesanal personalizada</span>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#configurador" className="nav-link">Configurador</a>
            <a href="#" className="nav-link">Galería</a>
            <a href="#" className="nav-link">Contacto</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Diseña tu Seiko Mod
            <span className="hero-title-accent"> perfecto</span>
          </h1>
          <p className="hero-subtitle">
            Elige mecanismo, esfera y caja. Nosotros nos encargamos del montaje profesional.
          </p>
        </div>
      </section>

      {/* Main layout */}
      <main className="main-layout" id="configurador">
        {/* Left: selectors */}
        <div className="selectors-column">
          {categories.map((category) => (
            <PartSelector
              key={category.id}
              category={category}
              selected={config[category.id]}
              onSelect={(part) => handleSelect(category.id, part)}
            />
          ))}
        </div>

        {/* Right: preview + order */}
        <aside className="sidebar-column">
          <div className="sidebar-sticky">
            <WatchPreview config={config} />
            <OrderSummary config={config} />
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} Seiko Mod Studio &mdash; Relojería artesanal
        </p>
      </footer>
    </div>
  );
}
