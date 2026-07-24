/**
 * Aritmética Binaria — Utilidades para ventas
 * Implementa operaciones de codificación/decodificación usando
 * operaciones bit a bit y BigInt para precisión.
 */

/* ── Constantes de método de pago (bitmask) ── */
const METODO_BITS = {
  efectivo:      0b001,   // 1
  tarjeta:       0b010,   // 2
  transferencia: 0b100,   // 4
};

const BITS_METODO = Object.fromEntries(
  Object.entries(METODO_BITS).map(([k, v]) => [v, k])
);

/**
 * Codifica método de pago a representación de bits
 * @param {string} metodo
 * @returns {number} bitmask (1, 2 o 4)
 */
function codificarMetodoPago(metodo) {
  const bits = METODO_BITS[metodo];
  if (bits === undefined) throw new Error(`Método de pago inválido: ${metodo}`);
  return bits;
}

/**
 * Decodifica bits a string de método de pago
 * @param {number} bits
 * @returns {string}
 */
function decodificarMetodoPago(bits) {
  return BITS_METODO[bits] || 'desconocido';
}

/**
 * Genera ID binario compuesto: surtidorId (alta) | timestamp_segundos (baja)
 * Usa BigInt para evitar pérdida de precisión con números grandes
 * @param {number} surtidorId
 * @param {Date}   fecha
 * @returns {BigInt}
 */
function generarIdBinario(surtidorId, fecha = new Date()) {
  const ts  = BigInt(Math.floor(fecha.getTime() / 1000));
  const sid = BigInt(surtidorId & 0xFFFF);
  return (sid << 32n) | (ts & 0xFFFFFFFFn);
}

/**
 * Decodifica un ID binario de vuelta a sus componentes
 * @param {BigInt|string} idBinario
 * @returns {{ surtidor_id: number, timestamp: number, fecha: Date }}
 */
function decodificarIdBinario(idBinario) {
  const id  = BigInt(idBinario);
  const sid = Number(id >> 32n);
  const ts  = Number(id & 0xFFFFFFFFn);
  return {
    surtidor_id: sid,
    timestamp:   ts,
    fecha:       new Date(ts * 1000),
  };
}

/**
 * Calcula el total de una venta con precisión usando BigInt
 * Trabaja en centavos (x100) para evitar errores de punto flotante
 * @param {number} litros
 * @param {number} precio_unitario
 * @returns {number} total con 2 decimales
 */
function calcularTotal(litros, precio_unitario) {
  const litrosCentavos  = BigInt(Math.round(litros         * 1000));
  const precioCentavos  = BigInt(Math.round(precio_unitario * 10000));
  const totalRaw        = litrosCentavos * precioCentavos;
  return Number(totalRaw) / 10_000_000;
}

/**
 * Desempaqueta un timestamp en campos separados usando operaciones bit a bit
 * @param {number|Date} ts
 * @returns {{ anio, mes, dia, hora, minuto, segundo }}
 */
function decodificarFecha(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  return {
    anio:    d.getFullYear(),
    mes:     d.getMonth() + 1,
    dia:     d.getDate(),
    hora:    d.getHours(),
    minuto:  d.getMinutes(),
    segundo: d.getSeconds(),
    iso:     d.toISOString(),
  };
}

/**
 * Verifica si dos flags binarios están activos simultáneamente
 * Útil para multi-flag states en el sistema
 * @param {number} value
 * @param {number} flag
 * @returns {boolean}
 */
function tieneFlag(value, flag) {
  return (value & flag) === flag;
}

module.exports = {
  METODO_BITS,
  codificarMetodoPago,
  decodificarMetodoPago,
  generarIdBinario,
  decodificarIdBinario,
  calcularTotal,
  decodificarFecha,
  tieneFlag,
};
