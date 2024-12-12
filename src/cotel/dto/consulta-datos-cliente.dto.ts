import { Transform } from "class-transformer";
import {  IsIn, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class ConsultaDatosClienteDto
 {
    @IsString()
    @IsIn(['C', 'T'])
    criterio: string;

    @IsString()
    instancia: string;
  }