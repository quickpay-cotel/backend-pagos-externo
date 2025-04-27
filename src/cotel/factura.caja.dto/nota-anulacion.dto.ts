import { IsString, IsNumber, Equals } from 'class-validator';
import { IsValidAppKey } from 'src/common/decorators/is-valid-appkey.decorator';

export class NotaAnulacionDto {
    @IsString()
    @IsValidAppKey({ message: 'El appkey no es válido.' })
    appkey: string;
  
    @IsString()
    identificadorNota: string;
  
    @IsString()
    nit: string;
  
    @IsNumber()
    codigoMotivo: number;
  
    @IsString()
    cuf: string;

    /*@IsString()
    motivo: string;*/
    
}
