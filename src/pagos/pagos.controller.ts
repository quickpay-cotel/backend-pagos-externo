import { Body, Controller, Post, UseFilters } from "@nestjs/common";
import { CreateGeneraQrDto } from "./dto/create-qr.generado.dto";
import { PagosService } from "./pagos.service";
import { ConfirmaPagoQrDto } from "./dto/confirma-pago-qr.dto";

@Controller('pagos')
export class PagosController {
  
    constructor(private readonly pagosService: PagosService) { }

    @Post('genera-qr')
    async createPayment(@Body() createGeneraQrDto: CreateGeneraQrDto){
      return  await this.pagosService.generaQr(createGeneraQrDto);
      
    }
    @Post('confirma-pago')
    async confirmaPago(@Body() confirmaPagoQrDto: ConfirmaPagoQrDto){
      return  await this.pagosService.confirmaPagoQr(confirmaPagoQrDto);
  

    }
}