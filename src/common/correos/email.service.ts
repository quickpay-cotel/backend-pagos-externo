import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, subject: string, text: string, html: string) {
    try {
        await this.mailerService.sendMail({
            to, // Correo destino
            subject, // Asunto
            text, // Cuerpo del correo en texto plano
            html, // Cuerpo del correo en HTML
          });
    } catch (error) {
        console.log(error);
    }

  }
}
