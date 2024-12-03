import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
@Injectable()
export class DeudasClientesRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,  // Inyectamos el pool de conexiones
      ) {}
    async create(data: Record<string, any>): Promise<any> {
        // Extraer los nombres de las columnas y los valores
        const columnas = Object.keys(data);
        const valores = Object.values(data);
      
        // Construir los marcadores de posición ($1, $2, ...)
        const marcadores = columnas.map((_, index) => `$${index + 1}`).join(', ');
      
        // Crear la consulta SQL dinámica
        const query = `
          INSERT INTO tesla.deudas_clientes (${columnas.join(', ')})
          VALUES (${marcadores})
          RETURNING *;
        `;
      

        // Ejecutar la consulta con los valores
        const resultado = await this.pool.query(query, valores);
        return resultado.rows[0];
      }
      

}