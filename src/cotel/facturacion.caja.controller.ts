import { Body, Controller, Post } from "@nestjs/common";
import { FacturacionCajaService } from "./facturacion.caja.service";
import { FacturaDeudaDto } from "./factura.caja.dto/factura-caja-deuda.dto";
import { CajaConciliacionNotaDto } from "./factura.caja.dto/caja-conciliacion-nota.dto";
import { CajaNotaCreditoDebitoDto } from "./factura.caja.dto/caja-nota-credito-debito.dto";

@Controller("cotel-caja")
export class FacturacionCajasController {
  constructor(private readonly facturacionCajaService: FacturacionCajaService,
  ) {}
  @Post("factura-telecom")
  async facturaTelcom(@Body() consultaDatosClienteRequestDto: FacturaDeudaDto,) {
      return await this.facturacionCajaService.facturaTelcom(consultaDatosClienteRequestDto);
  }
  @Post("factura-alquiler")
  async facturaAlquiler(@Body() consultaDatosClienteRequestDto: FacturaDeudaDto,) {
      return await this.facturacionCajaService.facturaAlquiler(consultaDatosClienteRequestDto);
  }
  @Post("nota-conciliacion")
  async notaConciliacion(@Body() cajaConciliacionNotaDto: CajaConciliacionNotaDto) {
      return await this.facturacionCajaService.notasConciliacion(  cajaConciliacionNotaDto);
  }
  @Post("nota-credito-debito")
  async notaCreditoDebito(@Body() cajaNotaCreditoDebitoDto: CajaNotaCreditoDebitoDto) {
      return await this.facturacionCajaService.notasCreditoDebito(  cajaNotaCreditoDebitoDto);
  }
}
