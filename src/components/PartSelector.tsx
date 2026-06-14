import type { WatchCategory, WatchPart } from '../types/watch';

interface PartSelectorProps {
  category: WatchCategory;
  selected: WatchPart | null;
  onSelect: (part: WatchPart) => void;
}

export default function PartSelector({ category, selected, onSelect }: PartSelectorProps) {
  return (
    <section className="selector-section">
      <div className="selector-header">
        <span className="selector-icon">{category.icon}</span>
        <div>
          <h2 className="selector-title">{category.label}</h2>
          <p className="selector-subtitle">
            {selected ? (
              <>
                <span className="selected-indicator">Seleccionado:</span> {selected.name}
              </>
            ) : (
              'Elige una opción'
            )}
          </p>
        </div>
      </div>

      <div className="parts-grid">
        {category.parts.map((part) => {
          const isSelected = selected?.id === part.id;
          return (
            <button
              key={part.id}
              className={`part-card${isSelected ? ' part-card--selected' : ''}`}
              onClick={() => onSelect(part)}
              aria-pressed={isSelected}
            >
              {isSelected && <span className="checkmark">✓</span>}

              <div className="part-preview">
                <div
                  className="part-disc"
                  style={{
                    background: part.accentColor
                      ? `radial-gradient(circle at 35% 35%, ${part.accentColor}55 0%, ${part.color} 60%)`
                      : `radial-gradient(circle at 35% 35%, ${part.color}cc 0%, ${part.color} 100%)`,
                    borderColor: part.accentColor ?? part.color,
                    boxShadow: isSelected
                      ? `0 0 0 2px var(--accent-gold), 0 0 20px ${part.accentColor ?? part.color}66`
                      : `0 4px 16px ${part.color}44`,
                  }}
                >
                  <div
                    className="part-disc-inner"
                    style={{ borderColor: (part.accentColor ?? '#ffffff') + '44' }}
                  />
                </div>
              </div>

              <div className="part-info">
                <div className="part-name">{part.name}</div>
                <div className="part-description">{part.description}</div>
                <div className="part-price">€{part.price}</div>

                <div className="part-specs">
                  {part.specs.map((spec) => (
                    <span key={spec} className="spec-badge">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
