import { Injectable, Inject } from "@nestjs/common";
import { IDatabase } from "pg-promise"; // Usamos pg-promise
@Injectable()
export class CotelTransacionesRepository {
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
          INSERT INTO cotel.transacciones (${columnas.join(", ")})
          VALUES (${marcadores}) RETURNING *
        `;
    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);
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
    UPDATE pagos.deudas
    SET ${setClause}
    WHERE deuda_id = $${columnas.length + 1}
    RETURNING *
  `;

    const params = [...valores, id];

    const result = t
      ? await t.one(query, params)
      : await this.db.one(query, params);

    return result;
  }

  async findByAlias(pAlias): Promise<any> {
    const query = `  select t.* from cotel.datosconfirmado_qr dc
inner join cotel.transacciones t on dc.datosconfirmado_qr_id = t.datosconfirmado_qr_id  and t.estado_id = 1000
where dc.estado_id = 1000 and dc.alias_sip = $1`;
    const params = [pAlias];
    const result = await this.db.manyOrNone(query, params);
    return result;
  }
  async pagosMes(): Promise<any> {
    const query = `   SELECT 
    TO_CHAR(fecha_transaccion, 'YYYY-MM') AS mes,
    SUM(monto_pagado) AS total_pagado
FROM cotel.transacciones
WHERE estado_transaccion_id = 1010 
GROUP BY mes
ORDER BY mes DESC;`;
    const result = await this.db.manyOrNone(query);
    return result;
  }
  async pagosSemana(): Promise<any> {
    const query = `SELECT 
    DATE_TRUNC('week', fecha_transaccion) AS semana,
    SUM(monto_pagado) AS total_pagado
FROM cotel.transacciones
WHERE estado_transaccion_id = 1010 
GROUP BY semana
ORDER BY semana DESC;`;
    const result = await this.db.manyOrNone(query);
    return result;
  }
  async pagosPorEstado(): Promise<any> {
    const query = ` SELECT 
    d.descripcion AS estado,
    COUNT(*) AS cantidad_transacciones
FROM cotel.transacciones t
JOIN cotel.dominios d ON t.estado_transaccion_id = d.dominio_id
GROUP BY estado
ORDER BY cantidad_transacciones DESC;`;
    const result = await this.db.manyOrNone(query);
    return result;
  }
  async pagosUltimos(pLimit: number): Promise<any> {
    const query = `SELECT 
    transaccion_id,
    monto_pagado,
    moneda,
    fecha_transaccion
FROM cotel.transacciones
WHERE estado_transaccion_id = 1010 
ORDER BY fecha_transaccion DESC
LIMIT $1;`;
    const params = [pLimit];
    const result = await this.db.manyOrNone(query, params);
    return result;
  }
  async cambiarEstadoTransactionById(
    id: number,
    estado: number,
    t?: IDatabase<any>
  ): Promise<any> {
    const query = `UPDATE cotel.transacciones SET estado_transaccion_id=$2 WHERE transaccion_id=$1 RETURNING *;`;
    const params = [id, estado];
    const result = t
      ? await t.oneOrNone(query, params)
      : await this.db.oneOrNone(query, params);
    return result;
  }
}
