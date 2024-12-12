import { Module } from '@nestjs/common';
import { CotelController } from './cotel.controller';
import { CotelService } from './cotel.service';
@Module({
  imports:[],
  controllers: [CotelController],
  providers: [CotelService],
})
export class CotelModule {}
