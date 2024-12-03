import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { ApiSipService } from './api.sip.service';
import { PagosController } from './pagos.controller';
import { RepositoryModule } from 'src/common/repository/repository.module';
@Module({
  imports: [RepositoryModule], // Importa HttpModule
  controllers: [PagosController],
  providers: [PagosService,ApiSipService],
})
export class PagosModule {}