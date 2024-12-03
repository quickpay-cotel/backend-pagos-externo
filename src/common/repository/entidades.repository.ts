import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
@Injectable()
export class EntidadesRepository {
  constructor(
    @Inject('DATABASE_POOL') private readonly pool: Pool,  // Inyectamos el pool de conexiones
  ) { }
  async findById(entidadId): Promise<any> {
    const result = await this.pool.query(
      `SELECT entidad_id, tipo_entidad_id, nombre, nombre_comercial, direccion, telefono, nit, llave_dosificacion, path_logo, fecha_creacion, usuario_creacion, fecha_modificacion, usuario_modificacion, estado, actividad_economica_id, login_sin, password_sin, transaccion, comprobante_en_uno, es_cobradora, es_pagadora, modalidad_facturacion_id, subdominio_empresa
            FROM tesla.entidades
            WHERE entidad_id=${entidadId};`,
    );
    return result.rows;
  }
}