import { Controller, Get, Param, Post } from "@nestjs/common";
import { SoporteFacturacionService } from "./soportes_facturacion.service";

@Controller("soportes-facturacion")
export class SoporteFacturacionController {
  constructor(private readonly soporteFacturacionService: SoporteFacturacionService,
  ) {}
  @Get("genera-factura/:alias")
  async generarFactura(@Param("alias") alias: string) {
    return await this.soporteFacturacionService.generarFacturaILLAPorSoportre(alias);
  }
}
