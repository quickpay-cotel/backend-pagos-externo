import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeudaDto } from './deuda.dto';
import { ConsultaDatosClienteDto } from './consulta-datos-cliente.dto';

export class DeudasDto {

  @IsNotEmpty()
  consultaDatosClienteDto: ConsultaDatosClienteDto

  @IsArray()
  @IsString({ each: true }) // Valida que cada elemento en el array sea un string
  @ArrayNotEmpty() // Opcional: Asegura que el array no esté vacío
  codigoDeudas: string[];
}
