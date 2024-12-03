// database.module.ts
import { Module, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { databaseConfig } from './database.config';  // Archivo con la configuración del DB

// Crear el pool de conexiones de PostgreSQL
export const pool = new Pool(databaseConfig);

const logger = new Logger('DatabaseQueryLogger');

// Log de las consultas SQL ejecutadas
pool.on('query', (query, values) => {
  if (query) {
    logger.log(`Executing query: ${query}, with values: ${values}`);
  }
});

@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',  // Inyectamos el pool como un proveedor
      useValue: pool,  // Le asignamos el valor del pool de conexiones
    },
  ],
  exports: ['DATABASE_POOL'],  // Exportamos para poder usarlo en otros módulos
})
export class DatabaseModule {}
