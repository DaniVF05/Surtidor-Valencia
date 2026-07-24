/**
 * PATRÓN ESTRUCTURAL — Adapter
 * Adapta pg.Pool a una interfaz genérica de repositorio,
 * desacoplando las rutas del driver de BD específico.
 * Si se cambia de PostgreSQL a SQLite u otro, solo se modifica este archivo.
 */

class DatabaseAdapter {
  constructor(pool) {
    this._pool = pool;
  }

  /** Ejecuta query raw con parámetros */
  async query(sql, params = []) {
    const result = await this._pool.query(sql, params);
    return result.rows;
  }

  /** Busca un registro por ID en la tabla dada */
  async findById(table, id) {
    const rows = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  /** Busca todos los registros de una tabla con cláusula opcional */
  async findAll(table, where = '', params = [], orderBy = 'id') {
    const sql = `SELECT * FROM ${table} ${where} ORDER BY ${orderBy}`;
    return this.query(sql, params);
  }

  /**
   * Inserta un registro y devuelve la fila creada
   * @param {string} table
   * @param {Object} data  - { campo: valor, ... }
   */
  async create(table, data) {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const cols   = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const rows = await this.query(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return rows[0];
  }

  /**
   * Actualiza campos de un registro por ID
   * @param {string} table
   * @param {number} id
   * @param {Object} data  - { campo: valor, ... }
   */
  async update(table, id, data) {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const sets   = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const rows = await this.query(
      `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0] || null;
  }

  /** Elimina un registro por ID */
  async remove(table, id) {
    await this.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return true;
  }

  /** Ejecuta una transacción con función async */
  async transaction(fn) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseAdapter;
