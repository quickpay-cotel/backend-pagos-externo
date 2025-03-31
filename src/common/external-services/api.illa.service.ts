import { Inject, Injectable } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { IDatabase } from "pg-promise";
@Injectable()
export class ApiIllaService {
  private token: any;
  private readonly axiosInstance: AxiosInstance;
  private bd: IDatabase<any>;
  constructor(@Inject("DB_CONNECTION") db: IDatabase<any>
  ) {
    this.bd = db; // Inyectamos la conexión de pg-promise
    // Configuración de Axios
    this.axiosInstance = axios.create({
      baseURL: process.env.ILLA_API,
      timeout: 60000,
    });

    // Configuración del interceptor de solicitud
    this.axiosInstance.interceptors.request.use(config => {
      const fullUrl = `${config.baseURL}${config.url}`;
      const logData = {
        method: config.method,
        url: fullUrl,
        request_headers: config.headers,
        request_data: config.data,
      };
      // Guardamos los datos de la solicitud, lo haremos después con la respuesta.
      config['logData'] = logData;
      return config;
    }, error => {
      console.error('Error en la solicitud:', error);
      return Promise.reject(error);
    });

    // Configuración del interceptor de respuesta
    this.axiosInstance.interceptors.response.use(response => {
      const logData = response.config['logData'];
      const logEntry = {
        ...logData,
        response_status: response.status,
        response_data: response.data,
      };
      // Guardamos la solicitud y respuesta en la base de datos
      this.saveLogToDatabase(logEntry);

      console.log(`Respuesta de ${response.config.url}:`, response.status);
      return response;
    }, error => {
      
      const logData = error.config ? error.config['logData'] : {};
      const logEntry = {
          ...logData,
          response_status: error.response ? error.response.status : 'NO_RESPONSE',
          response_data: error.response ? error.response.data : 'NO_RESPONSE_DATA',
      };
      // Guardamos la solicitud y respuesta en la base de datos
      this.saveLogToDatabase(logEntry);

      console.error('Error en la respuesta:', error);
      return Promise.reject(error);
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

  async generarFacturaTelcom(body: any) {


    try {
      await this.generarToken();
      const response = await this.axiosInstance.post("/api/v1/telecoms", body, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al generar Factura Telecomunicaciones");
      }
    }

  }
  async generarFacturaAlquiler(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.post("/api/v1/generalbills", body, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al generar Factura Alquiler");
      }
    }
  }
  async obtenerProductos() {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.get(`/api/v1/customers/${process.env.ILLA_NIT}/products/${process.env.ILLA_CODIGO_EMPRESA}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (response.data.status) {
        return response.data.productos;
      } else {
        throw "Error al obtener productos";
      }
    } catch (error) {
      throw "Error al obtener productos";
    }
  }
  async obtenerPuntosVentas() {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.get(`/api/v1/customers/${process.env.ILLA_NIT}/pointsofsale/${process.env.ILLA_CODIGO_EMPRESA}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (response.data.status) {
        return response.data.pointsOfSale;
      } else {
        throw "Error al obtener puntos de ventas";
      }
    } catch (error) {
      throw "Error al obtener puntos de ventas";
    }
  }
  async obtenerSucursales() {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.get(`/api/v1/customers/${process.env.ILLA_NIT}/offices/${process.env.ILLA_CODIGO_EMPRESA}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (response.data.status) {
        return response.data.offices;
      } else {
        throw "Error al obtener sucursales";
      }
    } catch (error) {
      throw "Error al obtener sucursales";
    }
  }
  
  private async saveLogToDatabase(logEntry: any) {
    try {
      await this.bd.query(
        'INSERT INTO cotel.api_logs (method, url, request_headers, request_data, response_status, response_data) ' +
        'VALUES (${method}, ${url}, ${request_headers}, ${request_data}, ${response_status}, ${response_data})',
        logEntry
      );
      console.log('Log guardado exitosamente en la base de datos');
    } catch (error) {
      console.error('Error al guardar el log en la base de datos:', error);
    }
  }

  
  async notaConciliacion(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.post("/api/v1/adjustments/conciliations", body, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al generar Nota Conciliación");
      }
    }
  }
  async notaCreditoDebito(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.post("/api/v1/adjustments", body, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al generar Nota Credito Debito");
      }
    }

  }
  async notaAnulacion(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.delete("/api/v1/adjustments", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: body, // Pasamos el body correctamente
      });
      
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al anular NOTA");
      }
    }
  }
  async facturaAlquilerAnulacion(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.delete("/api/v1/generalbills", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: body, // Pasamos el body correctamente
      });
      
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al anular FACTURA ALQUILER");
      }
    }
  }
  async facturaTelcomAnulacion(body: any) {
    try {
      await this.generarToken();
      const response = await this.axiosInstance.delete("/api/v1/telecoms", {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: body, // Pasamos el body correctamente
      });
      
      return response.data; // Devuelve el payload en caso de éxito
    } catch (error) {
      // Capturar el payload del error si existe
      if (error.response) {
        return error.response.data; // Devuelve el body de la respuesta con error (400, 404, etc.)
      } else {
        throw new Error("Error desconocido al anular FACTURA TELCOM");
      }
    }
  }
  
}