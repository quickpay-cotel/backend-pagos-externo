import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { CotelModule } from 'src/cotel/cotel.module';
@Module({
  imports:[CotelModule],
  controllers: [ReportesController],
  providers:[ReportesService]
})
export class ReportesModule {}
