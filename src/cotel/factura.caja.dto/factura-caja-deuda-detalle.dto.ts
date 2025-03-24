import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class FacturaCajaDeudaDetalleDto {
  @IsString()
  @IsNotEmpty()
  concepto: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  costo_unitario: number;

  @IsNumber()
  descuento_unitario: number;

  @IsString()
  @IsNotEmpty()
  codigo_producto: string;

  @IsString()
  @IsOptional()
  ignora_factura?: string;
}
