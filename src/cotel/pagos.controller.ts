import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
import { PagosService } from "./pagos.service";
@Controller("pagos")
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}
  @Post("confirma-pago-qr")
  async confirmaPagoQr(@Body() confirmaPagoQrDto: ConfirmaPagoQrDto) {
    return await this.pagosService.confirmaPagoQr(confirmaPagoQrDto);
  }
  @Post("estado-pago-qr")
  async verificarPagoQr(@Body() alias: any) {
    return await this.pagosService.estadoTransaccion(alias);
  }
  @Get("obtener-comprobantes/:alias")
  async liberarReserva(@Param("alias") pAlias: string) {
    return await this.pagosService.obtenerComprobantes(pAlias);
  }
}
