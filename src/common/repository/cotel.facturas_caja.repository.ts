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
    const query = ` select * from cotel.facturas_caja fc 
inner join cotel.facturas_emitidas_caja fec on fc.factura_caja_id = fec.factura_caja_id and fec.estado_id = 1000
where fc.estado_id = 1000 and fc.identificador = $1`;
    const params = [pIdentificador];
    const result = await this.db.manyOrNone(query, params);
    return result;
  }
}


