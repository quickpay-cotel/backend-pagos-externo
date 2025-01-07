import { Inject, Injectable } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelDatosConfirmadoQrRepository {
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
          INSERT INTO cotel.datosconfirmado_qr (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async deudasByAliasPagado(pAlias): Promise<any> {
    const query = `
    select d.codigo_deuda,d.nombre_factura,TO_CHAR(dc.fecha_registro, 'DD/MM/YYYY') AS fecha_registro,d.periodo,d.mensaje_deuda,d.monto,dc.monto_sip  
    from cotel.datosconfirmado_qr dc
    inner join cotel.reserva_deuda rd on rd.qr_generado_id  = dc.qr_generado_id and rd.estado_id = 1000
    inner join cotel.deudas d on d.deuda_id  = rd.deuda_id and d.estado_id = 1000
    where dc.alias_sip = $1 and dc.estado_id = 1000`;
    const params = [pAlias];
    const result = await this.db.many(query, params);
    return result;
  }



}
