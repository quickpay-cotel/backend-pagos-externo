import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelReservaDeudaRepository {
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
          INSERT INTO cotel.reserva_deuda (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
    return result;
  }
  async cambiarEstadoReservaByIdTransaccion(
    id_transaccion: any,
    estado_reserva_id: any,
    t?: IDatabase<any>,
  ): Promise<any> {
    const query = `UPDATE cotel.reserva_deuda
      SET estado_reserva_id =$2 
      WHERE id_transaccion=$1 RETURNING *;`;
    const params = [id_transaccion, estado_reserva_id];
    const result = t
      ? await t.many(query, params)
      : await this.db.many(query, params);
    return result;
  }
  async cambiarEstadoReservaByDeudaId(
    deuda_id: any,
    estado_reserva_id: any,
    t?: IDatabase<any>,
  ): Promise<any> {
    const query = `UPDATE cotel.reserva_deuda
      SET estado_reserva_id =$2
      WHERE deuda_id=$1 RETURNING *;`;
    const params = [deuda_id, estado_reserva_id];
    const result = t
      ? await t.oneOrNone(query, params)
      : await this.db.oneOrNone(query, params);
    return result;
  }
  async findByDeudaId(pDeudaId): Promise<any> {
    const query = `select * from cotel.reserva_deuda where estado_reserva_id  = 1008 and estado_id = 1000 and deuda_id = $1`;
    const params = [pDeudaId];
    const result = await this.db.one(query, params);
    return result;
  }
  async findByQrGeneradoId(pQrGeneradoId): Promise<any> {
    const query = `select * from cotel.reserva_deuda where estado_reserva_id  = 1004 and estado_id = 1000 and qr_generado_id = $1 and estado_id = 1000`;
    const params = [pQrGeneradoId];
    const result = await this.db.manyOrNone(query, params);
    return result;
  }



}
