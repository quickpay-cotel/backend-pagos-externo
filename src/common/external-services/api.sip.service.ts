import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class ApiSipService {
  private token: any;
  private readonly axiosInstance: AxiosInstance;
  constructor() {
    // Configuración de Axios
    this.axiosInstance = axios.create({
      baseURL: process.env.SIP_API,
      timeout: 10000,
    });
  }
  // Método para realizar una petición POST
  async generaQr(data: any): Promise<any> {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.post("/api/v1/generaQr", data, {
        headers: {
          apikeyServicio: process.env.SIP_APIKEYSERVICIO,
          Authorization: `Bearer ${this.token}`,
        },
      });
      const codigo = response.data.codigo;
      if (codigo == "0000") {
        return response.data.objeto;
      } else {
        throw "Error al generar QR";
      }
    } catch (error) {
      throw "Error al generar QR";
    }
  }
  async generarToken(): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        "/autenticacion/v1/generarToken",
        {
          username: process.env.SIP_USERNAME,
          password: process.env.SIP_PASSWORD,
        },
        {
          headers: { apikey: process.env.SIP_APIKEY },
        },
      );
      const codigo = response.data.codigo;
      if (codigo == "OK") {
        this.token = response.data.objeto.token;
      } else {
        this.token = "";
      }
    } catch (error) {
      throw error;
    }
  }
}
