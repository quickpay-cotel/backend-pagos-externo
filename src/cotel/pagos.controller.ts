import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
import { PagosService } from "./pagos.service";
import { EmailService } from "src/common/correos/email.service";
import { BasicAuthGuard } from "src/config/basic-auth.guard";


@Controller("pagos")
export class PagosController {
  constructor(private readonly pagosService: PagosService,
    private readonly emailService: EmailService
  ) {}
  @Post("confirma-pago-qr")
  @UseGuards(BasicAuthGuard)
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
  @Get("envioCorreo")
  async envioCorreo() {
    await this.emailService.SentMail();
    return 'Email sent!';
  }
}
