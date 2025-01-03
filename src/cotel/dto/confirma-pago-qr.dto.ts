import { IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class ConfirmaPagoQrDto {
    
  @IsUUID()
  alias: string;

  @IsString()
  numeroOrdenOriginante: string;

  @IsNumber()
  monto: number;

  @IsString()
  idQr: string;

  @IsString()
  moneda: string;

  @IsDateString()
  fechaproceso: string;

  @IsString()
  cuentaCliente: string;

  @IsString()
  nombreCliente: string;

  @IsString()
  documentoCliente: string;
}