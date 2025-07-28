import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelFacturasCajaRepository {
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
          INSERT INTO cotel.facturas_caja (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async facturaEmitidaByIdentificador(pIdentificador): Promise<any> {
    const query = ` select fec.* from cotel.facturas_caja fc 
inner join cotel.facturas_emitidas_caja fec on fc.factura_caja_id = fec.factura_caja_id and fec.estado_id = 1000
where fc.estado_id = 1000 and fc.identificador = $1`;
    const params = [pIdentificador];
    const result = await this.db.manyOrNone(query, params);
    return result;
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
    UPDATE cotel.facturas_caja
    SET ${setClause}
    WHERE factura_caja_id = $${columnas.length + 1}
    RETURNING *
  `;

    const params = [...valores, id];

    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);

    return result;
  }
}


