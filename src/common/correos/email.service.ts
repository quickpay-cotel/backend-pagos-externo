import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: +process.env.MAIL_PORT,
      secure: false, // Cambia a true si usas el puerto 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Deshabilitar la validación SSL/TLS
      },
    });
  }

  async sendMailNotifyPayment(to: string, subject: string, paymentData: any) {
    try {

      const templateEmail = path.join(process.cwd(), 'plantillas/correos', `notificacion_pago.html`);
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace('{{nombre_cliente}}', paymentData.nombreCliente)
        .replace('{{numero_transaccion}}', paymentData.numeroTransaccion)
        .replace('{{monto}}', paymentData.monto)
        .replace('{{moneda}}', paymentData.moneda)
        .replace('{{fecha}}', paymentData.fecha)
        .replace('{{nombre_empresa}}', paymentData.nombreEmpresa)
        .replace('{{anio_actual}}', new Date().getFullYear().toString());

      //await this.transporter.sendMail({ // se lenteaa
      this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html: emailHtml
      });

    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw error;
    }
  }
  
  async sendMailNotifyPaymentAndAttachments(to: string, subject: string, paymentData: any, pdfFilePath:string) {
    try {

      const templateEmail = path.join(process.cwd(), 'plantillas/correos', `notificacion_pago.html`);
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace('{{nombre_cliente}}', paymentData.nombreCliente)
        .replace('{{numero_transaccion}}', paymentData.numeroTransaccion)
        .replace('{{monto}}', paymentData.monto)
        .replace('{{moneda}}', paymentData.moneda)
        .replace('{{fecha}}', paymentData.fecha)
        .replace('{{nombre_empresa}}', paymentData.nombreEmpresa)
        .replace('{{anio_actual}}', new Date().getFullYear().toString());

      //await this.transporter.sendMail({ // se lenteaa
      this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: path.basename(pdfFilePath),    // Nombre del archivo adjunto
            path: pdfFilePath,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/pdf' // Tipo MIME del archivo (PDF)
          }
        ]
      });

    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw error;
    }
  }
}
