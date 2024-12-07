import { Injectable, Inject } from '@nestjs/common';
import { IDatabase } from 'pg-promise';  // Usamos pg-promise
@Injectable()
export class HistoricosDeudasRepository {

    private db: IDatabase<any>;

    constructor(@Inject('DB_CONNECTION') db: IDatabase<any>) {
        this.db = db; // Inyectamos la conexión de pg-promise
    }
    async findByDeudaClienteId(pDeudaClienteId): Promise<any> {
        const query = `select * from  tesla.historicos_deudas where deuda_cliente_id  = $1 and estado  = 'ACTIVO'`;
        const params = [pDeudaClienteId];
        const result = await this.db.oneOrNone(query, params);
        return result;
    }
    async update(
        data: Record<string, any>, 
        id: number, 
        t?: IDatabase<any>
      ): Promise<any> {
        // Extraer los nombres de las columnas y los valores a actualizar
        const columnas = Object.keys(data);
        const params = Object.values(data);
      
        // Crear los sets de actualización (columna = $1, columna = $2, ...)
        const setClauses = columnas.map((columna, index) => `${columna} = $${index + 1}`).join(', ');
      
        // Agregar la condición WHERE id = $n (donde n es el número de parámetros + 1)
        const query = `
          UPDATE tesla.historicos_deudas 
          SET ${setClauses} 
          WHERE historico_deuda_id = $${columnas.length + 1}
          RETURNING *
        `;
      
        // Los parámetros serán los valores de las columnas y el id
        const allParams = [...params, id];
      
        try {
          const result = t ? await t.one(query, allParams) : await this.db.one(query, allParams);
          return result;
        } catch (error) {
          console.error('Error al actualizar los datos:', error);
          throw new Error('No se pudo actualizar los datos en la base de datos');
        }
      }
      

}