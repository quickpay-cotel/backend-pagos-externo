import { IsString, IsNumber, Equals } from 'class-validator';
import { IsValidAppKey } from 'src/common/decorators/is-valid-appkey.decorator';

export class FacturaAnulacionDto {
    @IsString()
    @IsValidAppKey({ message: 'El appkey no es válido.' })
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
