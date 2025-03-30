import { Body, Controller, Delete, Post } from "@nestjs/common";
import { FacturacionCajaService } from "./facturacion.caja.service";
import { FacturaDeudaDto } from "./factura.caja.dto/factura-caja-deuda.dto";
import { CajaConciliacionNotaDto } from "./factura.caja.dto/caja-conciliacion-nota.dto";
import { CajaNotaCreditoDebitoDto } from "./factura.caja.dto/caja-nota-credito-debito.dto";
import { NotaAnulacionDto } from "./factura.caja.dto/nota-anulacion.dto";
import { FacturaAnulacionDto } from "./factura.caja.dto/factura-anulacion.dto";

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
  @Delete("nota-anulacion")
  async notaAnulacion(@Body() notaAnulacionDto: NotaAnulacionDto) {
      return await this.facturacionCajaService.notaAnulacion(  notaAnulacionDto);
  }
  @Delete("factura-alquiler-anulacion")
  async facturaAlquilerAnulacion(@Body() facturaAnulacionDto: FacturaAnulacionDto) {
      return await this.facturacionCajaService.facturaAlquilerAnulacion(  notaAnulacionDto);
  }
  @Delete("factura-telcom-anulacion")
  async facturaTelcomAnulacio(@Body() facturaAnulacionDto: FacturaAnulacionDto) {
      return await this.facturacionCajaService.facturaTelcomAnulacion(  notaAnulacionDto);
  }
}
