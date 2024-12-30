import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class SegUsuariosRepository {
  private db: IDatabase<any>;

  constructor(@Inject("DB_CONNECTION") db: IDatabase<any>) {
    this.db = db; // Inyectamos la conexión de pg-promise
  }
  async findRecaudadorByUsuariod(pUsuarioId): Promise<any> {
    const query = `select r.* from tesla.seg_usuarios u 
        inner join tesla.empleados e on e.persona_id = u.persona_id and e.estado  = 'ACTIVO'
        inner join tesla.sucursales s on s.sucursal_id = e.sucursal_id and s.estado  = 'ACTIVO'
        inner join tesla.recaudadores r on r.recaudador_id  = s.recaudador_id and  r.estado  = 'ACTIVO'
        where u.usuario_id  = $1`;
    const params = [pUsuarioId];
    const result = await this.db.oneOrNone(query, params);
    return result;
  }
}
