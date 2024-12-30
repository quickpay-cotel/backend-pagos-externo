import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { EntidadesRepository } from "../common/repository/entidades.repository";

@Injectable()
export class EntidadesService {
  constructor(private readonly entidadesRepository: EntidadesRepository) {}
  async getEntidadById(id: number) {
    try {
      const datosEntidad = await this.entidadesRepository.findById(id);
      if (!datosEntidad) {
        throw new HttpException("No existe Entidad", HttpStatus.NOT_FOUND);
      }
      return {
        entidadId: datosEntidad.entidad_id,
        nombre: datosEntidad.nombre,
        nombreComercial: datosEntidad.nombre_comercial,
        telefono: datosEntidad.telefono,
        direccion: datosEntidad.direccion,
        nit: datosEntidad.nit,
      };
    } catch (error) {
      throw error;
    }
  }
  async getNameLogoByEntidadId(pEntidadId: number) {
    try {
      const datosEntidad = await this.entidadesRepository.findById(pEntidadId);
      return datosEntidad.path_logo;
    } catch (error) {
      return null;
    }
  }
}
