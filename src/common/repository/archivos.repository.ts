import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class ArchivosRepository {
  private db: IDatabase<any>;

  constructor(@Inject("DB_CONNECTION") db: IDatabase<any>) {
    this.db = db; // Inyectamos la conexión de pg-promise
  }
  async createManualFile(data: any, t?: IDatabase<any>): Promise<any> {
    const query = `INSERT INTO tesla.archivos
            ( entidad_id, nombre, usuario_creacion, fecha_creacion, transaccion, tipo_archivo_id)
            VALUES( $1, $2, $3, now(), $4, $5) RETURNING *`;
    const params = [
      data.entidad_id,
      data.nombre,
      data.usuario_creacion,
      "CREAR",
      92,
    ];
    const result = t
      ? await t.oneOrNone(query, params)
      : await this.db.oneOrNone(query, params);
    return result;
  }
  async canbiarEstado(
    archivo_id: any,
    estado: any,
    t?: IDatabase<any>,
  ): Promise<any> {
    const query = `UPDATE tesla.archivos
      SET transaccion =$2
      WHERE archivo_id=$1 RETURNING *;`;
    const params = [archivo_id, estado];
    const result = t
      ? await t.oneOrNone(query, params)
      : await this.db.oneOrNone(query, params);
    return result;
  }
  async findByArchivoId(archivoId): Promise<any> {
    const query = `select a.* from tesla.archivos a where a.archivo_id  = $1 and a.estado  = 'ACTIVO'`;
    const params = [archivoId];
    const result = await this.db.one(query, params);
    return result;
  }
}
