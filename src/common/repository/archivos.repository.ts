
import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
@Injectable()
export class ArchivosRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,  // Inyectamos el pool de conexiones
      ) {}
    async createManualFile(data: any): Promise<any> {
        const result = await this.pool.query(
            `INSERT INTO tesla.archivos
            ( entidad_id, nombre, usuario_creacion, fecha_creacion, transaccion, tipo_archivo_id)
            VALUES( $1, $2, $3, now(), $4, $5) RETURNING * `,
            [data.entidad_id, data.nombre,  data.usuario_creacion, 'CREAR',  92]);
        return result.rows[0];
    }

}