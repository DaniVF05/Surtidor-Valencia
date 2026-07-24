/**
 * PATRÓN CREACIONAL — Factory Method
 * Crea instancias de surtidor según tipo de combustible,
 * encapsulando la lógica de configuración por tipo.
 */

class Surtidor {
  constructor({ numero, tipo_combustible, estado, capacidad, precio_base, unidad }) {
    this.numero          = numero;
    this.tipo_combustible = tipo_combustible;
    this.estado          = estado || 'activo';
    this.capacidad       = capacidad;
    this.precio_base     = precio_base;
    this.unidad          = unidad;
  }

  toJSON() {
    return {
      numero:          this.numero,
      tipo_combustible: this.tipo_combustible,
      estado:          this.estado,
      capacidad:       this.capacidad,
      precio_base:     this.precio_base,
      unidad:          this.unidad,
    };
  }
}

class SurtidorFactory {
  static TIPOS = {
    'Gasolina 91':  { capacidad: 50000, precio_base: 0.5,  unidad: 'litros' },
    'Gasolina 95':  { capacidad: 40000, precio_base: 0.65, unidad: 'litros' },
    'Gasoil':       { capacidad: 60000, precio_base: 0.3,  unidad: 'litros' },
    'GLP':          { capacidad: 20000, precio_base: 0.25, unidad: 'kg'     },
  };

  /**
   * @param {string} tipo  - Tipo de combustible
   * @param {number} numero - Número de surtidor
   * @param {string} estado - Estado del surtidor
   * @returns {Surtidor}
   */
  static create(tipo, numero, estado = 'activo') {
    const config = SurtidorFactory.TIPOS[tipo];
    if (!config) throw new Error(`Tipo de combustible desconocido: ${tipo}`);
    return new Surtidor({ numero, tipo_combustible: tipo, estado, ...config });
  }

  static getTiposDisponibles() {
    return Object.keys(SurtidorFactory.TIPOS);
  }

  static getConfig(tipo) {
    return SurtidorFactory.TIPOS[tipo] || null;
  }
}

module.exports = { SurtidorFactory, Surtidor };
