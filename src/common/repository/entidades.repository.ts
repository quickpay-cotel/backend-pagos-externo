import { Inject, Injectable } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class EntidadesRepository {
  private db: IDatabase<any>;

  constructor(@Inject("DB_CONNECTION") db: IDatabase<any>) {
    this.db = db; // Inyectamos la conexión de pg-promise
  }
  async findById(entidadId): Promise<any> {
    const query = `SELECT entidad_id, tipo_entidad_id, nombre, nombre_comercial, direccion, telefono, nit, llave_dosificacion, path_logo, fecha_creacion, usuario_creacion, fecha_modificacion, usuario_modificacion, estado, actividad_economica_id, login_sin, password_sin, transaccion, comprobante_en_uno, es_cobradora, es_pagadora, modalidad_facturacion_id, subdominio_empresa
            FROM tesla.entidades
            WHERE entidad_id=$1;`;
    const params = [entidadId];
    const result = await this.db.one(query, params);
    return result;
  }
}
