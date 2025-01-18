import { Controller, Get, Res, Query, Param } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { CotelService } from 'src/cotel/cotel.service';
import { PagosService } from 'src/cotel/pagos.service';
import * as path from 'path'; // Asegúrate de tener esta importación
@Controller('reportes')
export class ReportesController {

  constructor(private readonly reportesService: ReportesService,

    private readonly pagosService: PagosService
  ) { }

  @Get('descargar-factura/:alias')
  async descargarFactura(@Param('alias') alias: string, @Res() res: Response): Promise<void> {
    // Construir la ruta completa del archivo PDF usando el alias
    const pdfPath = path.join(process.cwd(), 'store/facturas', `factura-${alias}.pdf`);
    
    // Configurar la respuesta HTTP para descargar el PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${alias}.pdf"`,
    });

    // Enviar el archivo PDF al cliente
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err.message);
        res.status(500).send('Error al descargar el archivo');
      }
    });
  }
  @Get('descargar-recibo/:alias')
  async descargarRecibo(@Param('alias') alias: string, @Res() res: Response): Promise<void> {
    // Construir la ruta completa del archivo PDF usando el alias
    const pdfPath = path.join(process.cwd(), 'store/recibos', `recibo-${alias}.pdf`);
    
    // Configurar la respuesta HTTP para descargar el PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${alias}.pdf"`,
    });

    // Enviar el archivo PDF al cliente
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err.message);
        res.status(500).send('Error al descargar el archivo');
      }
    });
  }
}