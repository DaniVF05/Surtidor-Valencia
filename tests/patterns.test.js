const { SurtidorFactory, Surtidor } = require('../backend/patterns/SurtidorFactory');
const DatabaseAdapter = require('../backend/patterns/DatabaseAdapter');
const { AlertaSubject, StockObserver, VentaAltaObserver } = require('../backend/patterns/AlertaObserver');

// ─── SurtidorFactory ─────────────────────────────────────────────
describe('SurtidorFactory', () => {
  test('crea Gasolina 91 con config correcta', () => {
    const s = SurtidorFactory.create('Gasolina 91', 1);
    expect(s).toBeInstanceOf(Surtidor);
    expect(s.numero).toBe(1);
    expect(s.tipo_combustible).toBe('Gasolina 91');
    expect(s.capacidad).toBe(50000);
    expect(s.precio_base).toBe(0.5);
    expect(s.estado).toBe('activo');
  });

  test('crea GLP con unidad kg', () => {
    const s = SurtidorFactory.create('GLP', 4, 'inactivo');
    expect(s.unidad).toBe('kg');
    expect(s.estado).toBe('inactivo');
  });

  test('lanza error para tipo desconocido', () => {
    expect(() => SurtidorFactory.create('Kerosene', 5)).toThrow('Tipo de combustible desconocido');
  });

  test('getTiposDisponibles retorna 4 tipos', () => {
    const tipos = SurtidorFactory.getTiposDisponibles();
    expect(tipos.length).toBe(4);
    expect(tipos).toContain('Gasoil');
  });

  test('toJSON retorna campos correctos', () => {
    const s = SurtidorFactory.create('Gasolina 95', 2);
    const json = s.toJSON();
    expect(json).toHaveProperty('numero', 2);
    expect(json).toHaveProperty('tipo_combustible', 'Gasolina 95');
    expect(json).toHaveProperty('precio_base', 0.65);
  });
});

// ─── DatabaseAdapter ─────────────────────────────────────────────
describe('DatabaseAdapter', () => {
  let mockPool, adapter;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
    };
    adapter = new DatabaseAdapter(mockPool);
  });

  test('query delega a pool.query', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await adapter.query('SELECT 1');
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1', []);
    expect(result).toEqual([{ id: 1 }]);
  });

  test('findById construye query correcta', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: 5, nombre: 'Test' }] });
    const row = await adapter.findById('empleados', 5);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM empleados WHERE id = $1', [5]);
    expect(row.nombre).toBe('Test');
  });

  test('findById devuelve null si no existe', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const row = await adapter.findById('surtidores', 999);
    expect(row).toBeNull();
  });

  test('create genera INSERT correcto', async () => {
    mockPool.query.mockResolvedValue({ rows: [{ id: 1, nombre: 'Nuevo' }] });
    const row = await adapter.create('empleados', { nombre: 'Nuevo', email: 'a@b.com' });
    const callArg = mockPool.query.mock.calls[0][0];
    expect(callArg).toContain('INSERT INTO empleados');
    expect(callArg).toContain('RETURNING *');
    expect(row.nombre).toBe('Nuevo');
  });

  test('remove llama DELETE con id', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });
    const result = await adapter.remove('surtidores', 3);
    expect(mockPool.query).toHaveBeenCalledWith('DELETE FROM surtidores WHERE id = $1', [3]);
    expect(result).toBe(true);
  });
});

// ─── AlertaObserver ───────────────────────────────────────────────
describe('AlertaSubject (Observer)', () => {
  test('notifica al observador correcto', async () => {
    const subject  = new AlertaSubject();
    const observer = { handles: jest.fn(() => true), update: jest.fn() };
    subject.subscribe(observer);
    await subject.notify('venta_registrada', { tipo_combustible: 'Gasoil', litros: 10, total: 50, surtidor_id: 1 });
    expect(observer.handles).toHaveBeenCalledWith('venta_registrada');
    expect(observer.update).toHaveBeenCalledTimes(1);
  });

  test('no notifica a observador que no maneja el evento', async () => {
    const subject  = new AlertaSubject();
    const observer = { handles: jest.fn(() => false), update: jest.fn() };
    subject.subscribe(observer);
    await subject.notify('otro_evento', {});
    expect(observer.update).not.toHaveBeenCalled();
  });

  test('unsubscribe elimina el observador', async () => {
    const subject  = new AlertaSubject();
    const observer = { handles: jest.fn(() => true), update: jest.fn() };
    subject.subscribe(observer);
    subject.unsubscribe(observer);
    await subject.notify('venta_registrada', {});
    expect(observer.update).not.toHaveBeenCalled();
  });

  test('StockObserver maneja evento venta_registrada', () => {
    const mockDb = { query: jest.fn() };
    const obs = new StockObserver(mockDb);
    expect(obs.handles('venta_registrada')).toBe(true);
    expect(obs.handles('otro')).toBe(false);
  });

  test('VentaAltaObserver maneja evento venta_registrada', () => {
    const mockDb = { query: jest.fn() };
    const obs = new VentaAltaObserver(mockDb, 300);
    expect(obs.handles('venta_registrada')).toBe(true);
  });
});
