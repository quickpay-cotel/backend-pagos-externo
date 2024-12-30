import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class CreateGeneraQrDto {
  @IsString()
  detalleGlosa: string;

  @IsNotEmpty({ message: "El precio no puede estar vacío." })
  @IsNumber({}, { message: "El precio debe ser un número válido." })
  monto: number;

  @IsString()
  moneda: string;

  @IsString()
  fechaVencimiento: string;
}
