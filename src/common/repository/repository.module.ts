// repository.module.ts
import { Module } from '@nestjs/common';

import { ArchivosRepository } from './archivos.repository';  // Repositorio que accederá a la base de datos
import { DeudasClientesRepository } from './deudas_clientes.repository';  // Repositorio que accederá a la base de datos
import { EntidadesRepository } from './entidades.repository';  // Repositorio que accederá a la base de datos

import { EntidadesService } from './../../entidades/entidades.service';
import { PagosService } from './../../pagos/pagos.service';


import { DatabaseModule } from '../../config/database.module';  // Importamos DatabaseModule

@Module({
  imports: [DatabaseModule],  // Importamos el DatabaseModule para acceder al pool
  providers: [EntidadesRepository,DeudasClientesRepository,ArchivosRepository],  // Proveedores que usan el pool
  exports: [EntidadesService,PagosService],  // Exportamos los servicios que utilizan el pool
})
export class RepositoryModule {}
