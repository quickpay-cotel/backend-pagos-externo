import { Module } from "@nestjs/common";
import { EntidadesService } from "./entidades.service";
import { EntidadesController } from "./entidades.controller";
import { RepositoryModule } from "src/common/repository/repository.module";
import { DatabaseModule } from "../config/database.module"; // Importamos DatabaseModule
@Module({
  imports: [DatabaseModule,RepositoryModule],
  controllers: [EntidadesController],
  providers: [EntidadesService],
})
export class EntidadesModule {}
