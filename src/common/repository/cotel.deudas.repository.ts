import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelDeudasRepository {
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
          INSERT INTO cotel.deudas (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async findByDeudaId(pDeudaId): Promise<any> {
    const query = `select * from cotel.deudas where estado_id = 1000 and deuda_id = $1`;
    const params = [pDeudaId];
    const result = await this.db.one(query, params);
    return result;
  }
  async findByAlias(pAlias): Promise<any> {
    const query = `  select d.* from cotel.reserva_deuda rd 
inner join cotel.qr_generado qg on qg.estado_id = 1000
inner join cotel.deudas d on d.deuda_id  = rd.deuda_id and d.estado_id = 1000
where qg.alias = $1 and rd.estado_id = 1000 and rd.estado_reserva_id = 1004`;
    const params = [pAlias];
    const result = await this.db.many(query, params);
    return result;
  }
  async findByAliasPagado(pAlias): Promise<any> {
    const query = `  select d.* from cotel.reserva_deuda rd 
inner join cotel.qr_generado qg on qg.estado_id = 1000
inner join cotel.deudas d on d.deuda_id  = rd.deuda_id and d.estado_id = 1000
where qg.alias = $1 and rd.estado_id = 1000 and rd.estado_reserva_id = 1005`;
    const params = [pAlias];
    const result = await this.db.many(query, params);
    return result;
  }
}
