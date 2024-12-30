import { Inject, Injectable } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class DeudasClientesRepository {
  private db: IDatabase<any>;

  constructor(@Inject("DB_CONNECTION") db: IDatabase<any>) {
    this.db = db; // Inyectamos la conexión de pg-promise
  }
  async create(data: Record<string, any>, t?: IDatabase<any>): Promise<any> {
    // Extraer los nombres de las columnas y los valores
    const columnas = Object.keys(data);
    const params = Object.values(data);
    // Construir los marcadores de posición ($1, $2, ...)
    const marcadores = columnas.map((_, index) => `$${index + 1}`).join(", ");
    // Crear la consulta SQL dinámica
    const query = `
          INSERT INTO tesla.deudas_clientes (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }

  async findByDeudaClienteId(deudaClienteId): Promise<any> {
    const query = `select dc.* from tesla.deudas_clientes dc 
    inner join tesla.archivos a on a.archivo_id  = dc.archivo_id and a.estado = 'ACTIVO'
    where dc.deuda_cliente_id  = $1;`;
    const params = [deudaClienteId];
    const result = await this.db.any(query, params);
    return result;
  }

  async delete(pDeudaClienteId: number, t?: IDatabase<any>): Promise<any> {
    const query = `
    DELETE FROM tesla.deudas_clientes
    WHERE deuda_cliente_id = $1
    RETURNING *
  `;
    const params = [pDeudaClienteId];
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
}
