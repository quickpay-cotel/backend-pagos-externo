import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntidadesRepository } from '../common/repository/entidades.repository';



@Injectable()
export class EntidadesService {
  constructor(private readonly entidadesRepository: EntidadesRepository) {}
  async getEntidadById(id: number) {
    try {
      let datosEntidad = await this.entidadesRepository.findById(id);
      if (datosEntidad.length!=1) {
        throw new HttpException('No existe Entidad', HttpStatus.NOT_FOUND);
      }
      return {
        entidadId: datosEntidad[0].entidad_id,
        nombre: datosEntidad[0].nombre,
        nombreComercial: datosEntidad[0].nombre_comercial,
        telefono: datosEntidad[0].telefono,
        direccion: datosEntidad[0].direccion,
        nit: datosEntidad[0].nit
      }
    } catch (error) {
      throw error;
    }
  }
  async getNameLogoByEntidadId(pEntidadId: number) {
    try {
      let datosEntidad = await this.entidadesRepository.findById(pEntidadId);
      return datosEntidad[0].path_logo;
    } catch (error) {
      return null
    }
  }
}
