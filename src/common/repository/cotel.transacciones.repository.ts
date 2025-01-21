import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelTransacionesRepository {
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
          INSERT INTO cotel.transacciones (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async findByAlias(pAlias): Promise<any> {
    const query = `  select t.* from cotel.datosconfirmado_qr dc
inner join cotel.transacciones t on dc.datosconfirmado_qr_id = t.datosconfirmado_qr_id  and t.estado_id = 1000
where dc.estado_id = 1000 and dc.alias_sip = $1`;
    const params = [pAlias];
    const result = await this.db.manyOrNone(query, params);
    return result;
  }

}