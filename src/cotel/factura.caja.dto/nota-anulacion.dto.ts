import { IsString, IsNumber, Equals } from 'class-validator';

export class NotaAnulacionDto {
    @IsString()
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
