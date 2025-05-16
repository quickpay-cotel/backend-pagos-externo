import { Controller, Get, Param, Post } from "@nestjs/common";
import { SoporteFacturacionService } from "./soportes_facturacion.service";

@Controller("soportes-facturacion")
export class SoporteFacturacionController {
  constructor(private readonly soporteFacturacionService: SoporteFacturacionService,
  ) {}
  @Get("genera-factura/:alias/:verificarErrorFactura?")
  async generarFactura(
    @Param("alias") alias: string,
    @Param('verificarErrorFactura') verificarErrorFactura: string = 'true',
) {
    const vVerificarErrorFactura = verificarErrorFactura !== 'false';
    return await this.soporteFacturacionService.generarFacturaILLAPorSoportre(alias,vVerificarErrorFactura);
  }
}
