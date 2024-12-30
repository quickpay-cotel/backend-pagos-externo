import { IsString, IsNumber } from 'class-validator';

export class DeudaDto {
  @IsString()
  codigoDeuda: string;

  @IsNumber()
  montoDeuda: number;
}
