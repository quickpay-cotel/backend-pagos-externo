import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { FuncionesFechas } from '../utils/funciones.fechas';
import { ApiBrevoService } from '../external-services/api.brevo.service';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(  private readonly apiBrevoService: ApiBrevoService,) {
   
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
        .replace('{{numero_transaccion}}', paymentData.numeroTransaccion.slice(-8))
        .replace('{{monto}}', paymentData.monto)
        .replace('{{moneda}}', paymentData.moneda)
        .replace('{{fecha}}', FuncionesFechas.obtenerFechaFormato)
        .replace('{{nombre_empresa}}', paymentData.nombreEmpresa)
        .replace('{{anio_actual}}','' )
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
  
  async sendMailNotifyPaymentAndAttachments(to: string, subject: string, paymentData: any, reciboPath:string,
    facturaPathPdf:string,facturaPathXml:string,facturasUrl:string) {
    try {

      const templateEmail = path.join(process.cwd(), 'plantillas/correos', `notificacion_pago.html`);
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace('{{nombre_cliente}}', paymentData.nombreCliente)
        .replace('{{numero_transaccion}}', paymentData.numeroTransaccion.slice(-8))
        .replace('{{monto}}', paymentData.monto)
        .replace('{{moneda}}', paymentData.moneda)
        .replace('{{fecha}}', FuncionesFechas.obtenerFechaFormato)
        .replace('{{nombre_empresa}}', paymentData.nombreEmpresa)
        .replace('{{anio_actual}}', '')
        .replace('{{facturas_cotel}}', facturasUrl);
        
        let attachments = [];
        if(reciboPath && fs.existsSync(reciboPath)){
          attachments.push({
            filename: path.basename(reciboPath),    // Nombre del archivo adjunto
            path: reciboPath,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/pdf' // Tipo MIME del archivo (PDF)
          })
        }
        if(facturaPathPdf  && fs.existsSync(facturaPathPdf)){
          attachments.push({
            filename: path.basename(facturaPathPdf),    // Nombre del archivo adjunto
            path: facturaPathPdf,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/pdf' // Tipo MIME del archivo (PDF)
          })
        }
        if(facturaPathXml  && fs.existsSync(facturaPathXml)){
          attachments.push({
            filename: path.basename(facturaPathXml),    // Nombre del archivo adjunto
            path: facturaPathXml,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/xml' // Tipo MIME del archivo (PDF)
          })
        }
        // Enviar por brevooo
        let attachmentBase64 = [];
        for(let archivo of attachments){
          attachmentBase64.push({
            name:archivo.filename,
            content: fs.readFileSync(archivo.path, { encoding: 'base64' })
          })
        }

        let bodyEmail = {
          sender:{
            name:process.env.BREVO_SENDER_NAME,
            email:process.env.BREVO_SENDER_EMAIL
          },
          to:[{
            email:to,
            name:paymentData.nombreCliente
          }],
          htmlContent:emailHtml,
          subject:subject,
          replyTo:{
            email:process.env.BREVO_REPLYTO_EMAIL,
            name:process.env.BREVO_REPLYTO_NAME
          },
          tags:[process.env.BREVO_TAGS],
          attachment:attachmentBase64
        }
        await this.apiBrevoService.enviarCorreo(bodyEmail);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw error;
    }
  }
  
  async sendMailNotifyPaymentAndAttachmentsSoporte(to: string, subject: string, 
    facturaPathPdf:string,facturaPathXml:string,reciboPath:string,paymentData: any) {
    try {

      const templateEmail = path.join(process.cwd(), 'plantillas/correos', `notificacion_pago.html`);
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace('{{nombre_cliente}}', '')
        .replace('{{numero_transaccion}}', paymentData.numeroTransaccion)
        .replace('{{monto}}', '')
        .replace('{{moneda}}', '')
        .replace('{{fecha}}', FuncionesFechas.obtenerFechaFormato)
        .replace('{{nombre_empresa}}', '')
        .replace('{{anio_actual}}', '')
        .replace('{{facturas_cotel}}', '');
        
        let attachments = [];
 
        if(facturaPathPdf  && fs.existsSync(facturaPathPdf)){
          attachments.push({
            filename: path.basename(facturaPathPdf),    // Nombre del archivo adjunto
            path: facturaPathPdf,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/pdf' // Tipo MIME del archivo (PDF)
          })
        }
        if(facturaPathXml  && fs.existsSync(facturaPathXml)){
          attachments.push({
            filename: path.basename(facturaPathXml),    // Nombre del archivo adjunto
            path: facturaPathXml,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/xml' // Tipo MIME del archivo (PDF)
          })
        }
        if(reciboPath && fs.existsSync(reciboPath)){
          attachments.push({
            filename: path.basename(reciboPath),    // Nombre del archivo adjunto
            path: reciboPath,             // Ruta del archivo PDF a adjuntar
            contentType: 'application/pdf' // Tipo MIME del archivo (PDF)
          })
        }
        // Enviar por brevooo
        let attachmentBase64 = [];
        for(let archivo of attachments){
          attachmentBase64.push({
            name:archivo.filename,
            content: fs.readFileSync(archivo.path, { encoding: 'base64' })
          })
        }

        let bodyEmail = {
          sender:{
            name:process.env.BREVO_SENDER_NAME,
            email:process.env.BREVO_SENDER_EMAIL
          },
          to:[{
            email:to,
            name:'Ricardo Beltran'
          },
          {
            email:"alvaroquispesegales@gmail.com",
            name:'Alvaro Quispe'
          }
        ],
          htmlContent:emailHtml,
          subject:subject,
          replyTo:{
            email:process.env.BREVO_REPLYTO_EMAIL,
            name:process.env.BREVO_REPLYTO_NAME
          },
          tags:[process.env.BREVO_TAGS_SOPORTE],
          attachment:attachmentBase64
        }
        await this.apiBrevoService.enviarCorreo(bodyEmail);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw error;
    }
  }
}
