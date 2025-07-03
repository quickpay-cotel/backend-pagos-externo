import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";
import { FuncionesFechas } from "../utils/funciones.fechas";
import { ApiBrevoService } from "../external-services/api.brevo.service";
import { MailtrapClient } from "mailtrap";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly apiBrevoService: ApiBrevoService) {
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
      const templateEmail = path.join(
        process.cwd(),
        "plantillas/correos",
        `notificacion_pago.html`
      );
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace("{{nombre_cliente}}", paymentData.nombreCliente)
        .replace(
          "{{numero_transaccion}}",
          paymentData.numeroTransaccion.slice(-8)
        )
        .replace("{{monto}}", paymentData.monto)
        .replace("{{moneda}}", paymentData.moneda)
        .replace("{{fecha}}", FuncionesFechas.obtenerFechaFormato)
        .replace("{{nombre_empresa}}", paymentData.nombreEmpresa)
        .replace("{{anio_actual}}", "");
      this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html: emailHtml,
      });
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      throw error;
    }
  }

  async sendMailNotifyPaymentAndAttachments(
    to: string,
    subject: string,
    paymentData: any,
    reciboPath: string,
    facturaPathPdf: string,
    facturaPathXml: string,
    facturasUrl: string
  ) {
    try {
      const templateEmail = path.join(
        process.cwd(),
        "plantillas/correos",
        `notificacion_pago.html`
      );
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace("{{nombre_cliente}}", paymentData.nombreCliente)
        .replace(
          "{{numero_transaccion}}",
          paymentData.numeroTransaccion.slice(-8)
        )
        .replace("{{monto}}", paymentData.monto)
        .replace("{{moneda}}", paymentData.moneda)
        .replace("{{fecha}}", FuncionesFechas.obtenerFechaFormato)
        .replace("{{nombre_empresa}}", paymentData.nombreEmpresa)
        .replace("{{anio_actual}}", "")
        .replace("{{facturas_cotel}}", facturasUrl);

      let attachments = [];
      if (reciboPath && fs.existsSync(reciboPath)) {
        attachments.push({
          filename: path.basename(reciboPath), // Nombre del archivo adjunto
          path: reciboPath, // Ruta del archivo PDF a adjuntar
          contentType: "application/pdf", // Tipo MIME del archivo (PDF)
        });
      }
      if (facturaPathPdf && fs.existsSync(facturaPathPdf)) {
        attachments.push({
          filename: path.basename(facturaPathPdf), // Nombre del archivo adjunto
          path: facturaPathPdf, // Ruta del archivo PDF a adjuntar
          contentType: "application/pdf", // Tipo MIME del archivo (PDF)
        });
      }
      if (facturaPathXml && fs.existsSync(facturaPathXml)) {
        attachments.push({
          filename: path.basename(facturaPathXml), // Nombre del archivo adjunto
          path: facturaPathXml, // Ruta del archivo PDF a adjuntar
          contentType: "application/xml", // Tipo MIME del archivo (PDF)
        });
      }
      // Enviar por brevooo
      let attachmentBase64 = [];
      for (let archivo of attachments) {
        attachmentBase64.push({
          name: archivo.filename,
          content: fs.readFileSync(archivo.path, { encoding: "base64" }),
        });
      }

      let bodyEmail = {
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
            name: paymentData.nombreCliente,
          },
        ],
        htmlContent: emailHtml,
        subject: subject,
        replyTo: {
          email: process.env.BREVO_REPLYTO_EMAIL,
          name: process.env.BREVO_REPLYTO_NAME,
        },
        tags: [process.env.BREVO_TAGS],
        attachment: attachmentBase64,
      };
      await this.apiBrevoService.enviarCorreo(bodyEmail);
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      throw error;
    }
  }

  async sendMailNotifyPaymentAndAttachmentsSoporte(
    to: string,
    subject: string,
    facturaPathPdf: string,
    facturaPathXml: string,
    reciboPath: string,
    paymentData: any
  ) {
    try {
      const templateEmail = path.join(
        process.cwd(),
        "plantillas/correos",
        `notificacion_pago.html`
      );
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace("{{nombre_cliente}}", "")
        .replace("{{numero_transaccion}}", paymentData.numeroTransaccion)
        .replace("{{monto}}", "")
        .replace("{{moneda}}", "")
        .replace("{{fecha}}", FuncionesFechas.obtenerFechaFormato)
        .replace("{{nombre_empresa}}", "")
        .replace("{{anio_actual}}", "")
        .replace("{{facturas_cotel}}", "");

      let attachments = [];

      if (facturaPathPdf && fs.existsSync(facturaPathPdf)) {
        attachments.push({
          filename: path.basename(facturaPathPdf), // Nombre del archivo adjunto
          path: facturaPathPdf, // Ruta del archivo PDF a adjuntar
          contentType: "application/pdf", // Tipo MIME del archivo (PDF)
        });
      }
      if (facturaPathXml && fs.existsSync(facturaPathXml)) {
        attachments.push({
          filename: path.basename(facturaPathXml), // Nombre del archivo adjunto
          path: facturaPathXml, // Ruta del archivo PDF a adjuntar
          contentType: "application/xml", // Tipo MIME del archivo (PDF)
        });
      }
      if (reciboPath && fs.existsSync(reciboPath)) {
        attachments.push({
          filename: path.basename(reciboPath), // Nombre del archivo adjunto
          path: reciboPath, // Ruta del archivo PDF a adjuntar
          contentType: "application/pdf", // Tipo MIME del archivo (PDF)
        });
      }
      // Enviar por brevooo
      let attachmentBase64 = [];
      for (let archivo of attachments) {
        attachmentBase64.push({
          name: archivo.filename,
          content: fs.readFileSync(archivo.path, { encoding: "base64" }),
        });
      }

      let bodyEmail = {
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
            name: "Ricardo Beltran",
          },
          {
            email: "alvaroquispesegales@gmail.com",
            name: "Alvaro Quispe",
          },
        ],
        htmlContent: emailHtml,
        subject: subject,
        replyTo: {
          email: process.env.BREVO_REPLYTO_EMAIL,
          name: process.env.BREVO_REPLYTO_NAME,
        },
        tags: [process.env.BREVO_TAGS_SOPORTE],
        attachment: attachmentBase64,
      };
      await this.apiBrevoService.enviarCorreo(bodyEmail);
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      throw error;
    }
  }
  async SentMailPrueba() {
    // Configuración de token y correos
    const TOKEN = "xxxx";
    const SENDER_EMAIL = "xxxx";
    const RECIPIENT_EMAIL = "xxx";

    const client = new MailtrapClient({ token: TOKEN });

    const sender = { name: "Mailtrap Test", email: SENDER_EMAIL };

    try {
      const response = await client.send({
        from: sender,
        to: [{ email: RECIPIENT_EMAIL }],
        subject: "Hello from Mailtrap!",
        text: "Welcome to Mailtrap Sending!",
      });
      console.log("Correo enviado con éxito:", response);
      return response; // Opcional: devuelve respuesta si quieres usarla
    } catch (error) {
      console.error("Error enviando correo:", error);
      // Opcional: lanzar error para manejarlo fuera
      throw error;
    }
  }

  async sendMailNotifyPaymentAndAttachmentsMailtrap(
    to: string,
    subject: string,
    paymentData: any,
    reciboPath: string,
    facturaPathPdf: string,
    facturaPathXml: string,
    facturasUrl: string
  ) {
    const TOKEN = process.env.MAILTRAP_TOKEN;
    const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL;

    const client = new MailtrapClient({ token: TOKEN });
    const sender = { name: "Quickpay Notificaciones", email: SENDER_EMAIL };

    try {
      const templateEmail = path.join(
        process.cwd(),
        "plantillas/correos",
        `notificacion_pago.html`
      );
      const emailTemplate = fs.readFileSync(templateEmail).toString();

      const emailHtml = emailTemplate
        .replace("{{nombre_cliente}}", paymentData.nombreCliente)
        .replace(
          "{{numero_transaccion}}",
          paymentData.numeroTransaccion.slice(-8)
        )
        .replace("{{monto}}", paymentData.monto)
        .replace("{{moneda}}", paymentData.moneda)
        .replace("{{fecha}}", FuncionesFechas.obtenerFechaFormato)
        .replace("{{nombre_empresa}}", paymentData.nombreEmpresa)
        .replace("{{anio_actual}}", new Date().getFullYear().toString())
        .replace("{{facturas_cotel}}", facturasUrl);

      const attachments = [];

      const addAttachmentIfExists = (filePath: string, mimeType: string) => {
        if (filePath && fs.existsSync(filePath)) {
          attachments.push({
            filename: path.basename(filePath),
            content: fs.readFileSync(filePath, { encoding: "base64" }),
            type: mimeType,
            disposition: "attachment",
          });
        }
      };

      addAttachmentIfExists(reciboPath, "application/pdf");
      addAttachmentIfExists(facturaPathPdf, "application/pdf");
      addAttachmentIfExists(facturaPathXml, "application/xml");

      const response = await client.send({
        from: sender,
        to: [{ email: to, name: paymentData.nombreCliente }],
        subject,
        html: emailHtml,
        attachments,
      });

      console.log("Correo enviado con éxito:", response);

      return true;
    } catch (error) {
      console.error("Error enviando correo:", error);
      //throw error;
      return false;
    }
  }
}
