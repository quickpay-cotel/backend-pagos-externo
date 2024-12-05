import { Transform } from "class-transformer";
import {  IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class ConfirmaPagoQrDto
 {
    @IsString()
    alias: string;

    @IsString()
    numeroOrdenOriginante: string;

    @IsNotEmpty({ message: 'El precio no puede estar vacío.' })
    @IsNumber({}, { message: 'El precio debe ser un número válido.' })
    monto: number;

    @IsNotEmpty()
    @IsString()
    idQr: string; 

    @IsNotEmpty()
    @IsString()
    moneda: string; 

    @IsNotEmpty()
    @IsString()
    fechaproceso: string; 

    @IsNotEmpty()
    @IsString()
    cuentaCliente: string; 

    @IsNotEmpty()
    @IsString()
    nombreCliente: string; 

    @IsNotEmpty()
    @IsString()
    documentoCliente: string; 

  }