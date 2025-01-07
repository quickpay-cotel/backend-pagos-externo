import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportesService {
    // Función para reemplazar los marcadores en la plantilla
    private renderTemplate(templatePath: string, data: any): string {
      let template = fs.readFileSync(templatePath, 'utf8');
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, data[key]);
      });
      return template;
    }
  
    // Función principal para generar el PDF
    async generateReceiptPDF(receiptData: any): Promise<Buffer> {
      //const templatePath = path.resolve(process.env.DIR_REPORTES,  'recibo.html');
      const templatePath = path.resolve(__dirname,'..','plantillas-reportes', 'recibo.html');
      // Generar contenido HTML dinámico
      const htmlContent = this.renderTemplate(templatePath, {
        nroRecibo: receiptData.nroRecibo??0,
        nombreCliente: receiptData.nombreCliente??'',
        fechaPago: receiptData.fechaPago??'',
        metodoPago: receiptData.metodoPago??'',
        tableRows: receiptData.detalle.map(item => `
          <tr>
            <td>${item.mensajeDeuda??''}</td>
            <td>${item.periodo??''}</td>
            <td>${parseInt(item.monto).toFixed(2)}</td>
          </tr>
        `).join(''),
        totalPagado: `${parseInt(receiptData.totalPagado).toFixed(2)}`
      });
      // Generar PDF con Puppeteer
      //const browser = await puppeteer.launch();

      // modo ROOT  no es recomendable, pero pide el almalinux
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'load' });
      const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));
      await browser.close();
  
      return pdfBuffer;
    }
}
