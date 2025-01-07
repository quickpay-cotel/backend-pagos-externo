import { Controller, Get, Res, Query, Param } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { CotelService } from 'src/cotel/cotel.service';
@Controller('reportes')
export class ReportesController {

  constructor(private readonly reportesService: ReportesService,
    private readonly cotelService:CotelService
  ) { }

  @Get('generar-recibo/:alias')
  async getRecibo(@Param('alias') alias: string, @Res() res: Response): Promise<void> {

    // buscamos la data en base a alias
    let datosDeuda = await this.cotelService.datosDeudasPagadoByAlias(alias);
    // Generar PDF
    const pdf = await this.reportesService.generateReceiptPDF(datosDeuda);

    // Configurar respuesta HTTP para descargar el PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${alias}.pdf"`,
    });
    res.send(pdf);
  }
}