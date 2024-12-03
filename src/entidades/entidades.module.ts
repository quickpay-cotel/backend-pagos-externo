import { Module } from '@nestjs/common';
import { EntidadesService } from './entidades.service';
import { EntidadesController } from './entidades.controller';
import { RepositoryModule } from 'src/common/repository/repository.module';

@Module({
  imports: [RepositoryModule],
  controllers: [EntidadesController],
  providers: [EntidadesService],
})
export class EntidadesModule {}
