import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";
import { PagosService } from "./pagos.service";
import { EmailService } from "src/common/correos/email.service";
@Controller("pagos")
export class PagosController {
  constructor(private readonly pagosService: PagosService,
    private readonly emailService: EmailService
  ) {}
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
  @Get("envioCorreo")
  async envioCorreo() {
    let paymentData = {
      nombreCliente:'Alvaro Zenon Quispe Segales',
      numeroTransaccion:'12345',
      monto:'12121.89',
      moneda:'BS',
      fecha:'12/12/2025',
      nombreEmpresa:'COTEL'
    };
    await this.emailService.sendMailNotifyPayment('alvaro.quispe@quickpay.com.bo', 'confirmación de pago', paymentData);
    return 'Email sent!';
  }
}
