import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Res, UseFilters, HttpException, HttpStatus  } from '@nestjs/common';
import { EntidadesService } from './entidades.service';
import { existsSync } from 'fs';
import { Response } from 'express';

@Controller('entidades')
export class EntidadesController {
  constructor(private readonly entidadesService: EntidadesService) { }

  @Get(':pEntidadId')
  async findOne(@Param('pEntidadId', ParseIntPipe) pEntidadId: number) {
    return await this.entidadesService.getEntidadById(pEntidadId);
  }
  @Get('logo/:pEntidadId')
  async getImage(@Param('pEntidadId', ParseIntPipe) pEntidadId: number, @Res() res: Response) {
    let routLogo = await this.entidadesService.getNameLogoByEntidadId(pEntidadId);
    if (routLogo) {
      let filePath = `${process.env.PATH_LOGO}${routLogo}`;
      // Verificar si el archivo existe
      if (!existsSync(filePath)) {
        return res.status(404).send({mensaje:'Image not found'});
      }
      // Enviar el archivo de imagen
      return res.sendFile(filePath);
    }else{
      return res.status(404).send({mensaje:'Image not found'});
    }
  }
}
