import {
  Body,
  Controller,
  Post,
} from "@nestjs/common";
import { CotelService } from "./cotel.service";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
@Controller("pagos")
export class PagosController {
  constructor(private readonly cotelService: CotelService) {}
  @Post("confirma-pago-qr")
  async confirmaPagoQr(@Body() confirmaPagoQrDto: ConfirmaPagoQrDto) {
    return await this.cotelService.confirmaPagoQr(confirmaPagoQrDto);
  }
  @Post("estado-pago-qr")
  async verificarPagoQr(@Body() alias: any) {
    return await this.cotelService.estadoTransaccion(alias);
  }
}
