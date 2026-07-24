const {
  codificarMetodoPago,
  decodificarMetodoPago,
  generarIdBinario,
  decodificarIdBinario,
  calcularTotal,
  decodificarFecha,
  tieneFlag,
  METODO_BITS,
} = require('../backend/utils/binaryArithmetic');

describe('binaryArithmetic — codificación de método de pago', () => {
  test('codifica efectivo → 1 (0b001)', () => {
    expect(codificarMetodoPago('efectivo')).toBe(1);
  });
  test('codifica tarjeta → 2 (0b010)', () => {
    expect(codificarMetodoPago('tarjeta')).toBe(2);
  });
  test('codifica transferencia → 4 (0b100)', () => {
    expect(codificarMetodoPago('transferencia')).toBe(4);
  });
  test('lanza error para método inválido', () => {
    expect(() => codificarMetodoPago('bitcoin')).toThrow('Método de pago inválido');
  });
  test('decodifica 1 → efectivo', () => {
    expect(decodificarMetodoPago(1)).toBe('efectivo');
  });
  test('decodifica 2 → tarjeta', () => {
    expect(decodificarMetodoPago(2)).toBe('tarjeta');
  });
  test('decodifica desconocido → "desconocido"', () => {
    expect(decodificarMetodoPago(99)).toBe('desconocido');
  });
  test('round-trip: codificar → decodificar', () => {
    ['efectivo','tarjeta','transferencia'].forEach(m => {
      expect(decodificarMetodoPago(codificarMetodoPago(m))).toBe(m);
    });
  });
});

describe('binaryArithmetic — generarIdBinario / decodificarIdBinario', () => {
  test('genera BigInt', () => {
    const id = generarIdBinario(1);
    expect(typeof id).toBe('bigint');
  });
  test('round-trip: codificar → decodificar surtidor_id', () => {
    const fecha = new Date('2024-06-15T10:30:00Z');
    const id    = generarIdBinario(3, fecha);
    const dec   = decodificarIdBinario(id);
    expect(dec.surtidor_id).toBe(3);
  });
  test('round-trip: timestamp aproximado ±1s', () => {
    const fecha = new Date('2024-06-15T10:30:00Z');
    const id    = generarIdBinario(1, fecha);
    const dec   = decodificarIdBinario(id);
    expect(Math.abs(dec.fecha.getTime() - fecha.getTime())).toBeLessThan(2000);
  });
  test('IDs distintos para surtidores distintos', () => {
    const fecha = new Date('2024-01-01T00:00:00Z');
    const id1   = generarIdBinario(1, fecha);
    const id2   = generarIdBinario(2, fecha);
    expect(id1).not.toBe(id2);
  });
});

describe('binaryArithmetic — calcularTotal', () => {
  test('25 L × $0.50 = $12.50', () => {
    expect(calcularTotal(25, 0.5)).toBeCloseTo(12.5, 4);
  });
  test('100 L × $0.65 = $65.00', () => {
    expect(calcularTotal(100, 0.65)).toBeCloseTo(65, 4);
  });
  test('10.555 L × $0.30 = $3.1665', () => {
    expect(calcularTotal(10.555, 0.30)).toBeCloseTo(3.1665, 3);
  });
  test('evita error de punto flotante clásico (0.1 + 0.2)', () => {
    const total = calcularTotal(0.1, 0.2);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeCloseTo(0.02, 8);
  });
});

describe('binaryArithmetic — decodificarFecha', () => {
  test('desempaqueta fecha correctamente', () => {
    const d   = new Date('2024-07-15T14:30:00Z');
    const dec = decodificarFecha(d);
    expect(dec.anio).toBe(2024);
    expect(dec.mes).toBe(7);
    expect(dec.dia).toBe(15);
    expect(dec).toHaveProperty('iso');
  });
  test('acepta timestamp numérico', () => {
    const ts  = new Date('2024-01-01').getTime();
    const dec = decodificarFecha(ts);
    expect(dec.anio).toBe(2024);
  });
});

describe('binaryArithmetic — tieneFlag', () => {
  test('flag activo', () => {
    expect(tieneFlag(0b111, 0b001)).toBe(true);
  });
  test('flag inactivo', () => {
    expect(tieneFlag(0b110, 0b001)).toBe(false);
  });
  test('múltiples flags activos simultáneamente', () => {
    expect(tieneFlag(0b011, 0b011)).toBe(true);
  });
});
