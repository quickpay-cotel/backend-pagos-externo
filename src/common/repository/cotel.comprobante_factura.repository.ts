import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelComprobanteFacturaRepository {
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
          INSERT INTO cotel.comprobante_factura (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async findByFilters(
    filters: Record<string, any>,
    t?: IDatabase<any>
  ): Promise<any[]> {
    const keys = Object.keys(filters);
    const values = Object.values(filters);

    // Si no hay filtros, devolver todo
    let whereClause = "";
    if (keys.length > 0) {
      const conditions = keys.map((key, index) => `${key} = $${index + 1}`);
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    const query = `
    SELECT * FROM cotel.comprobante_factura
    ${whereClause}
  `;

    const result = t
      ? await t.manyOrNone(query, values)
      : await this.db.manyOrNone(query, values);

    return result;
  }

  async findByAlias(pAlias): Promise<any> {
    const query = `select cf.* from cotel.comprobante_factura cf 
    inner join cotel.transacciones t on t.transaccion_id  = cf.transaccion_id and t.estado_id = 1000
    inner join cotel.datosconfirmado_qr dq on dq.datosconfirmado_qr_id = t.datosconfirmado_qr_id and dq.estado_id = 1000
    inner join cotel.qr_generado qg on qg.qr_generado_id = dq.qr_generado_id and qg.estado_id = 1000
    where cf.estado_id = 1000 and qg.alias = $1`;
    const params = [pAlias];
    const result = await this.db.manyOrNone(query, params);
    return result;
  }
  async findNroFactura(): Promise<any> {
    const query = `SELECT cotel.fn_obtener_numero_factura() as numero_factura`;
    const result = await this.db.one(query);

    // Accede directamente a la propiedad numero_factura
    return result.numero_factura;
  }
  
  async update(
    id: number,
    data: Record<string, any>,
    t?: IDatabase<any>
  ): Promise<any> {
    const columnas = Object.keys(data);
    const valores = Object.values(data);

    if (columnas.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    // Construir SET dinámicamente: "col1 = $1, col2 = $2, ..."
    const setClause = columnas
      .map((col, index) => `${col} = $${index + 1}`)
      .join(", ");

    // Último parámetro es el ID
    const query = `
    UPDATE cotel.comprobante_factura
    SET ${setClause}
    WHERE comprobante_factura = $${columnas.length + 1}
    RETURNING *
  `;

    const params = [...valores, id];

    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);

    return result;
  }
}
