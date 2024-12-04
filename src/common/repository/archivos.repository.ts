
import { Injectable, Inject } from '@nestjs/common';
import { IDatabase } from 'pg-promise';  // Usamos pg-promise
@Injectable()
export class ArchivosRepository  {

    private db: IDatabase<any>;

    constructor(@Inject('DB_CONNECTION') db: IDatabase<any>) {
      this.db = db; // Inyectamos la conexión de pg-promise
    }
    async createManualFile(data: any,t?: IDatabase<any>): Promise<any> {
        const query = `INSERT INTO tesla.archivos
            ( entidad_id, nombre, usuario_creacion, fecha_creacion, transaccion, tipo_archivo_id)
            VALUES( $1, $2, $3, now(), $4, $5) RETURNING *`;
        const params =  [data.entidad_id, data.nombre,  data.usuario_creacion, 'CREAR',  92];
        const result = t ? await t.one(query, params) : await this.db.one(query, params);
        return result;
    }

}