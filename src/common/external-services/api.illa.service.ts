import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { ConsultaDatosClienteDto } from "src/cotel/dto/consulta-datos-cliente.dto";

@Injectable()
export class ApiIllaService {
    private token: any;
    private readonly axiosInstance: AxiosInstance;
    constructor() {
        // Configuración de Axios
        this.axiosInstance = axios.create({
            baseURL: process.env.ILLA_API,
            timeout: 30000,
        });
    }
    async generarToken(): Promise<any> {
        try {
            const response = await this.axiosInstance.post("api/v1/authentications/signin",
                {
                    email: process.env.ILLA_EMAIL,
                    password: process.env.ILLA_PASSWORD,
                }
            );
            if (response.data) {
                this.token = response.data;
            } else {
                this.token = "";
            }
        } catch (error) {
            throw error;
        }
    }
    
  async generarFactura(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.post("/api/v1/bills/buyandsell", body, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (response.data.status) {
        return response.data.result;
      } else {
        throw "Error generar factura";
      }
    } catch (error) {
      throw "Error generar factura";
    }
  }
}