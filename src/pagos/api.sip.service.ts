import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { FuncionesFechas } from 'src/common/utils/funciones.fechas';
@Injectable()
export class ApiSipService {
  private token: any;
  private readonly axiosInstance: AxiosInstance;
  constructor() {
    // Configuración de Axios
    this.axiosInstance = axios.create({
      baseURL:  process.env.SIP_API,
      timeout: 10000
    });
  }
  // Método para realizar una petición POST
  async generaQr(data: any): Promise<any> {
    try {
      await this.generarToken();
      data.fechaVencimiento = FuncionesFechas.formatDateToDDMMYYYY(new Date());
      data.alias = uuidv4();
      data.callback = process.env.SIP_CALLBACK;
      data.tipoSolicitud = "API";
      data.unicoUso = "true";
      const response = await this.axiosInstance.post('/api/v1/generaQr', data, {
        headers: { 'apikeyServicio': process.env.SIP_APIKEYSERVICIO, Authorization: `Bearer ${this.token}` },
      },);
      let codigo = response.data.codigo;
      if (codigo == '0000') {
        return response.data.objeto
      } else {
        return null
      }
    } catch (error) {
      throw error;
    }
  }
  async generarToken(): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/autenticacion/v1/generarToken', {
        username: process.env.SIP_USERNAME,
        password: process.env.SIP_PASSWORD
      }, {
        headers: { 'apikey': process.env.SIP_APIKEY },
      },);
      let codigo = response.data.codigo;
      if (codigo == 'OK') {
        this.token = response.data.objeto.token
      } else {
        this.token = '';
      }
    } catch (error) {
      throw error;
    }
  }
}