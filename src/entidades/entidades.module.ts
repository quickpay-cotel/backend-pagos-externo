import { Module } from '@nestjs/common';
import { EntidadesService } from './entidades.service';
import { EntidadesController } from './entidades.controller';
import { EntidadesRepository } from 'src/common/repository/entidades.repository';
import { DatabaseModule } from '../config/database.module'; // Importamos DatabaseModule
@Module({
  imports:[DatabaseModule],
  controllers: [EntidadesController],
  providers: [EntidadesService,EntidadesRepository],
})
export class EntidadesModule {}
