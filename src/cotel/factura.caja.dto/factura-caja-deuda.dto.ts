
import { IsString, IsNumber, IsEmail, IsInt, IsOptional, IsArray, ValidateNested, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { FacturaCajaDeudaDetalleDto } from './factura-caja-deuda-detalle.dto';
import { IsValidAppKey } from 'src/common/decorators/is-valid-appkey.decorator';
export class FacturaDeudaDto {

  @IsString()
  @IsValidAppKey({ message: 'El appkey no es válido.' })
  appkey: string;

  @IsString()
  @IsNotEmpty()
  identificador: string;

  @IsInt()
  emite_factura: number;

  @IsEmail()
  email_cliente: string;

  @IsString()
  @IsNotEmpty()
  nombre_cliente: string;

  @IsString()
  @IsOptional()
  apellido_cliente?: string;

  @IsString()
  @IsOptional()
  ci?: string;

  @IsString()
  @IsNotEmpty()
  razon_social: string;

  @IsString()
  @IsNotEmpty()
  numero_documento: string;

  @IsString()
  @IsOptional()
  complemento_documento?: string;

  @IsString()
  @IsNotEmpty()
  codigo_tipo_documento: string;

  @IsString()
  @IsNotEmpty()
  codigo_cliente: string;

  @IsNumber()
  descuento_global: number;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  codigo_documento_sector: string;

  @IsString()
  @IsOptional()
  canal_caja?: string;

  @IsString()
  @IsOptional()
  canal_caja_sucursal?: string;

  @IsString()
  @IsOptional()
  canal_caja_usuario?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturaCajaDeudaDetalleDto)
  lineas_detalle_deuda: FacturaCajaDeudaDetalleDto[];
}