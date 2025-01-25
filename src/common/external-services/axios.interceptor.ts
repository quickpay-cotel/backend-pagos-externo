import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IDatabase } from 'pg-promise';
//import { IDatabase } from 'pg-promise';
@Injectable()
export class AxiosInterceptorService {
    private readonly axiosInstance: AxiosInstance;
    private bd: IDatabase<any>;

    constructor(@Inject("DB_CONNECTION") db: IDatabase<any>) {
        this.bd = db; // Inyectamos la conexión de pg-promise
        // Configuración de Axios
        this.axiosInstance = axios.create({
            baseURL: process.env.COTEL_API,
            timeout: 30000,
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
            console.error('Error en la respuesta:', error);
            return Promise.reject(error);
        });
    }

    getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }
    // Método para guardar los logs en la base de datos
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
}
