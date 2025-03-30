import { IsString, IsNumber, Equals } from 'class-validator';

export class FacturaAnulacionDto {
    @IsString()
    appkey: string;
  
    @IsString()
    identificador: string;
  
    @IsString()
    nit: string;
  
    @IsNumber()
    codigoMotivo: number;
  
    @IsString()
    cuf: string;
}
