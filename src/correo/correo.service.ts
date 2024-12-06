import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CorreoService {
  private transporter;

  constructor() {
    // Configuración del transporter utilizando los valores del archivo .env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',  // false para STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Método para enviar un correo
  async sendMail(to: string, subject: string, text: string, html: string) {
    const mailOptions = {
      from: process.env.SMTP_USER,  // Remitente (tu correo de Gmail)
      to,  // Destinatario
      subject,  // Asunto del correo
      text,  // Contenido en texto
      html,  // Contenido en HTML
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado:', info);
      return info;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('Error al enviar el correo');
    }
  }
}
