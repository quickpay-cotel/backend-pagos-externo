import { existsSync } from "fs";
import { Response } from "express";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ConsultaDatosClienteDto } from "./dto/consulta-datos-cliente.dto";
import { CotelService } from "./cotel.service";
import {DeudasDto } from "./dto/deudas.dto";
import { ConsultaDeudasDto } from "./dto/consulta-deudas.dto";
@Controller("cotel")
export class CotelController {
  constructor(private readonly cotelService: CotelService) {}
  @Post("consulta-datos-cliente")
  async consultaDatosCliente(@Body() consultaDatosClienteRequestDto: ConsultaDatosClienteDto,) {
      return await this.cotelService.consultaDatosCliente(consultaDatosClienteRequestDto);
  }
  @Post("consulta-deuda-cliente")
  async findOne(@Body() consultaDeudasDto: ConsultaDeudasDto,) {
      return await this.cotelService.consultaDeudaCliente(consultaDeudasDto);
  }
  @Post("generar-qr")
  async generarQr(@Body() deudasDto: DeudasDto) {
    return await this.cotelService.generaQr(deudasDto);
  }
  @Get("liberar-reserva/:transaccionId")
  async liberarReserva(@Param("transaccionId") pTransaccionId: string) {
    return await this.cotelService.liberarReserva(pTransaccionId);
  }
}
