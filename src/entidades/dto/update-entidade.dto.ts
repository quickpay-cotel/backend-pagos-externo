import { PartialType } from '@nestjs/mapped-types';
import { CreateEntidadeDto } from './create-entidade.dto';

export class UpdateEntidadeDto extends PartialType(CreateEntidadeDto) {}
