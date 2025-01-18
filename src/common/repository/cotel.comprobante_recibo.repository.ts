import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelComprobanteReciboRepository {
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
          INSERT INTO cotel.comprobante_recibo (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async findByAlias(pAlias): Promise<any> {
    const query = `select cr.* from cotel.comprobante_recibo cr  
    inner join cotel.transacciones t on t.transaccion_id  = cr.transaccion_id and t.estado_id = 1000
    inner join cotel.datosconfirmado_qr dq on dq.datosconfirmado_qr_id = t.datosconfirmado_qr_id and dq.estado_id = 1000
    inner join cotel.qr_generado qg on qg.qr_generado_id = dq.qr_generado_id and qg.estado_id = 1000
    where cr.estado_id = 1000 and qg.alias = $1`;
    const params = [pAlias];
    const result = await this.db.oneOrNone(query, params);
    return result;
  }
}
