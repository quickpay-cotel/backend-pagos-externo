import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelFacturasEmitidasCajaRepository {
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
          INSERT INTO cotel.facturas_emitidas_caja (${columnas.join(", ")})
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
    SELECT * FROM cotel.facturas_emitidas_caja
    ${whereClause}
  `;

    const result = t
      ? await t.any(query, values)
      : await this.db.any(query, values);

    return result;
  }
}