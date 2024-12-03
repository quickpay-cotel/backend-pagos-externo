import { Module } from '@nestjs/common';
import { EntidadesModule } from './entidades/entidades.module';
import { PagosModule } from './pagos/pagos.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DatabaseModule } from './../src/config/database.module';  // Importa el módulo de la base de datos
import { RepositoryModule } from './../src/common/repository/repository.module';
@Module({
  imports: [EntidadesModule,PagosModule,DatabaseModule, RepositoryModule],  // Asegúrate de importar ambos módulos
  controllers: [],
  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },],
})
export class AppModule {}


