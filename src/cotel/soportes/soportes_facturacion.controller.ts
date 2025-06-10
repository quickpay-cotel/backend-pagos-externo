import { Controller, Get, Param, Post } from "@nestjs/common";
import { SoporteFacturacionService } from "./soportes_facturacion.service";
import { FuncionesGenerales } from "src/common/utils/funciones.generales";

@Controller("soportes-facturacion")
export class SoporteFacturacionController {
  constructor(private readonly soporteFacturacionService: SoporteFacturacionService,
  ) { }
  @Get("genera-factura/:alias/:verificarErrorFactura?")
  async generarFactura(
    @Param("alias") alias: string,
    @Param('verificarErrorFactura') verificarErrorFactura: string = 'true',
  ) {
    const vVerificarErrorFactura = verificarErrorFactura !== 'false';
    return await this.soporteFacturacionService.generarFacturaILLAPorSoportre(alias, vVerificarErrorFactura);
  }
  @Get("genera-recibo/:alias")
  async generarRecibo( @Param("alias") alias: string) {
    return await this.soporteFacturacionService.generarReciboPorSoporte(alias);
  }
  @Get("puede-generar-qr")
  async puedeGenerarQR() {
    const funcionesGenerales = new FuncionesGenerales();
    let resPuedePagar = funcionesGenerales.puedePagar();
    return {
      message: resPuedePagar.mensaje,
      result: resPuedePagar.permitido
    }
  }
}
