import { Pool } from 'pg';

export class DatabaseConfig {
  private static pool: Pool;

  static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        user: process.env.DB_USER,         // Reemplaza con tu usuario de PostgreSQL
        host: process.env.DB_HOST,           // Dirección del servidor de PostgreSQL
        database: process.env.DB_NAME,     // Nombre de tu base de datos
        password: process.env.DB_PASSWORD,   // Contraseña de tu usuario
        port: Number(process.env.DB_PORT),
      });

      // Agregar el listener para la consulta
      this.pool.on('query', (query) => {
        console.log('Executing Query:', query.text);
        if (query.values) {
          console.log('With Values:', query.values);
        }
      });
    }

    return this.pool;
  }

  static async closePool() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
