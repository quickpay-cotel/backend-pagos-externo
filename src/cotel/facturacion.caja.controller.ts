import { Body, Controller, Post } from "@nestjs/common";
import { FacturacionCajaService } from "./facturacion.caja.service";
import { FacturaDeudaDto } from "./factura.caja.dto/factura-caja-deuda.dto";
import { ConciliacionCajaNotasDto } from "./factura.caja.dto/conciliacion-caja-notas.dto";

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
  async notaConciliacion(@Body() conciliacionCajaNotasDto: ConciliacionCajaNotasDto) {
      return await this.facturacionCajaService.notasConciliacion(  conciliacionCajaNotasDto);
  }
}
