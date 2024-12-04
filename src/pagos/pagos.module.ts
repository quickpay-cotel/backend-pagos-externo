import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { ApiSipService } from './api.sip.service';
import { PagosController } from './pagos.controller';
import { ArchivosRepository } from 'src/common/repository/archivos.repository';
import { DeudasClientesRepository } from 'src/common/repository/deudas_clientes.repository';
import { DatabaseModule } from '../config/database.module'; // Importamos DatabaseModule
@Module({
  imports:[DatabaseModule],
  controllers: [PagosController],
  providers: [PagosService,ApiSipService,ArchivosRepository,DeudasClientesRepository],
  
})
export class PagosModule {}