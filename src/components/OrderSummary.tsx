import type { WatchConfig } from '../types/watch';

interface OrderSummaryProps {
  config: WatchConfig;
}

export default function OrderSummary({ config }: OrderSummaryProps) {
  const { mecanismo, esfera, caja } = config;

  const totalPrice = (mecanismo?.price ?? 0) + (esfera?.price ?? 0) + (caja?.price ?? 0);
  const isComplete = !!(mecanismo && esfera && caja);

  function handleAddToCart() {
    alert('¡Reloj añadido al carrito! Te contactaremos pronto.');
  }

  return (
    <div className="order-summary">
      <div className="order-summary-header">
        <h3 className="order-summary-title">Resumen del Pedido</h3>
      </div>

      <div className="order-items">
        {/* Mecanismo */}
        <div className={`order-item ${mecanismo ? 'order-item--filled' : 'order-item--empty'}`}>
          <div className="order-item-left">
            <span className="order-item-category">Mecanismo</span>
            {mecanismo ? (
              <span className="order-item-name">{mecanismo.name}</span>
            ) : (
              <span className="order-item-placeholder">No seleccionado</span>
            )}
          </div>
          {mecanismo && (
            <span className="order-item-price">€{mecanismo.price}</span>
          )}
        </div>

        {/* Esfera */}
        <div className={`order-item ${esfera ? 'order-item--filled' : 'order-item--empty'}`}>
          <div className="order-item-left">
            <span className="order-item-category">Esfera</span>
            {esfera ? (
              <span className="order-item-name">{esfera.name}</span>
            ) : (
              <span className="order-item-placeholder">No seleccionada</span>
            )}
          </div>
          {esfera && (
            <span className="order-item-price">€{esfera.price}</span>
          )}
        </div>

        {/* Caja */}
        <div className={`order-item ${caja ? 'order-item--filled' : 'order-item--empty'}`}>
          <div className="order-item-left">
            <span className="order-item-category">Caja</span>
            {caja ? (
              <span className="order-item-name">{caja.name}</span>
            ) : (
              <span className="order-item-placeholder">No seleccionada</span>
            )}
          </div>
          {caja && (
            <span className="order-item-price">€{caja.price}</span>
          )}
        </div>

        {/* Assembly */}
        <div className="order-item order-item--assembly">
          <div className="order-item-left">
            <span className="order-item-category">Montaje profesional</span>
            <span className="order-item-name">Incluido</span>
          </div>
          <span className="order-item-price order-item-price--free">Gratis</span>
        </div>
      </div>

      <div className="order-divider" />

      <div className="order-total">
        <span className="order-total-label">Total</span>
        <span className="order-total-amount">€{totalPrice}</span>
      </div>

      <button
        className={`btn-add-to-cart ${isComplete ? 'btn-add-to-cart--active' : 'btn-add-to-cart--disabled'}`}
        onClick={handleAddToCart}
        disabled={!isComplete}
        aria-disabled={!isComplete}
      >
        {isComplete ? 'Añadir al Carrito' : 'Completa la configuración'}
      </button>

      {!isComplete && (
        <p className="order-incomplete-hint">
          Selecciona{' '}
          {[!mecanismo && 'mecanismo', !esfera && 'esfera', !caja && 'caja']
            .filter(Boolean)
            .join(', ')}{' '}
          para continuar
        </p>
      )}

      <div className="order-notes">
        <div className="order-note">
          <span className="order-note-icon">&#9656;</span>
          Precios incluyen montaje profesional
        </div>
        <div className="order-note">
          <span className="order-note-icon">&#9656;</span>
          Tiempo de montaje: 2&#8211;3 semanas
        </div>
        <div className="order-note">
          <span className="order-note-icon">&#9656;</span>
          Garantía de 2 años incluida
        </div>
      </div>
    </div>
  );
}
