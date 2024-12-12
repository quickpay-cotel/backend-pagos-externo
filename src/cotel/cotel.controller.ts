import { existsSync } from 'fs';
import { Response } from 'express';
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ConsultaDatosClienteDto } from './dto/consulta-datos-cliente.dto';
import { CotelService } from './cotel.service';
@Controller('cotel')
export class CotelController {
    constructor(private readonly cotelService: CotelService) { }
    @Post('consulta-datos-cliente')
    async consultaDatosCliente(@Body() consultaDatosClienteDto: ConsultaDatosClienteDto) {
        return await this.cotelService.consultaDatosCliente(consultaDatosClienteDto);
    }
    @Get('consulta-deuda-cliente/:pContratoId')
    async findOne(@Param('pContratoId', ParseIntPipe) pContratoId: number) {
      return await this.cotelService.consultaDeudaCliente(pContratoId);
    }
}