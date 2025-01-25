import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST, // Ej. smtp.gmail.com
        port: parseInt(process.env.MAIL_PORT, 10), // Ej. 587
        auth: {
          user: process.env.MAIL_USER, // Correo para autenticarse
          pass: process.env.MAIL_PASS, // Contraseña o clave API
        },
      },
      defaults: {
        from: process.env.MAIL_FROM, // Remitente por defecto
      },
    }),
  ],
  exports: [EmailService],
  providers:[EmailService]
})
export class EmailModule {}
