import { Module } from '@nestjs/common';
import { CorreoService } from './correo.service';

@Module({
  imports: [],  // Importa el ConfigModule para manejar las variables de entorno
  providers: [CorreoService],
  exports: [CorreoService],  // Exportamos el servicio para que pueda ser usado en otros módulos
})
export class CorreoModule {}
