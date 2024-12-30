import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class ConsultaDeudasDto {
  @IsString()
  contratoId: string;

  @IsString()
  servicioId: string;
}
