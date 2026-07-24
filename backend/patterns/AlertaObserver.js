/**
 * PATRÓN DE COMPORTAMIENTO — Observer
 * AlertaSubject notifica a todos los observadores registrados
 * cuando ocurre un evento (venta registrada, stock bajo, etc.)
 */

class AlertaSubject {
  constructor() {
    this._observers = [];
  }

  subscribe(observer) {
    this._observers.push(observer);
  }

  unsubscribe(observer) {
    this._observers = this._observers.filter(o => o !== observer);
  }

  async notify(event, payload) {
    for (const observer of this._observers) {
      if (observer.handles(event)) {
        await observer.update(event, payload);
      }
    }
  }
}

/**
 * Observador de stock — genera alerta cuando el stock cae bajo el mínimo
 */
class StockObserver {
  constructor(db) {
    this._db = db;
  }

  handles(event) {
    return event === 'venta_registrada';
  }

  async update(event, { tipo_combustible, litros }) {
    const rows = await this._db.query(
      'SELECT * FROM inventario WHERE tipo_combustible = $1',
      [tipo_combustible]
    );
    if (!rows.length) return;

    const inv = rows[0];
    const nuevo_stock = parseFloat(inv.stock_actual) - parseFloat(litros);

    await this._db.query(
      'UPDATE inventario SET stock_actual = $1, updated_at = NOW() WHERE tipo_combustible = $2',
      [Math.max(nuevo_stock, 0), tipo_combustible]
    );

    if (nuevo_stock <= parseFloat(inv.stock_minimo)) {
      await this._db.query(
        `INSERT INTO alertas (tipo, mensaje, estado)
         VALUES ('stock_bajo', $1, 'pendiente')`,
        [`Stock bajo para ${tipo_combustible}: ${nuevo_stock.toFixed(0)} L (mínimo: ${inv.stock_minimo} L)`]
      );
    }
  }
}

/**
 * Observador de ventas altas — alerta si una venta supera umbral
 */
class VentaAltaObserver {
  constructor(db, umbral = 500) {
    this._db     = db;
    this._umbral = umbral;
  }

  handles(event) {
    return event === 'venta_registrada';
  }

  async update(event, { total, surtidor_id }) {
    if (parseFloat(total) >= this._umbral) {
      await this._db.query(
        `INSERT INTO alertas (surtidor_id, tipo, mensaje, estado)
         VALUES ($1, 'venta_alta', $2, 'pendiente')`,
        [surtidor_id, `Venta de alto valor: $${parseFloat(total).toFixed(2)} en surtidor #${surtidor_id}`]
      );
    }
  }
}

/**
 * Singleton del subject global
 */
const alertaSubject = new AlertaSubject();

module.exports = { AlertaSubject, StockObserver, VentaAltaObserver, alertaSubject };
