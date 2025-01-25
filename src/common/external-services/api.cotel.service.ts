import { Injectable, Inject } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ConsultaDatosClienteDto } from "src/cotel/dto/consulta-datos-cliente.dto";
import { IDatabase } from "pg-promise";

@Injectable()
export class ApiCotelService {
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
    // Reservar deuda
    async reservaPago(arrayDeudasDto: any): Promise<any> {
        try {
            const response = await this.axiosInstance.post("/pagarDeuda", { listaDeuda: arrayDeudasDto });
            const codigo = response.data.status;
            if (codigo == "OK") {
                return response.data.data;
            } else {
                throw new Error(response.data.data ?? 'error al reservar Pago');
            }
        } catch (error) {
            throw error.response.data.data;
        }
    }

    // Consulta datos cliente
    async consultaDatosCliente(consultaDatosClienteRequestDto: ConsultaDatosClienteDto) {
        try {
            const response = await this.axiosInstance.post("/consultar", consultaDatosClienteRequestDto);
            const codigo = response.data.status;
            if (codigo == "OK") {
                return response.data.data;
            } else {
                return null;
            }
        } catch (error) {
            throw error.response.data.data;
        }
    }
    // Consulta datos cliente
    async consultaDeudaCliente(pContratoId: string, pServicioId: string) {
        try {
            const response = await this.axiosInstance.post("/consultarDeuda", {
                contratoId: pContratoId,
                servicioId: pServicioId,
            });
            const codigo = response.data.status;
            if (codigo == "OK") {
                return response.data.data;
            } else {
                return null;
            }
        } catch (error) {
            return error;
        }
    }

    // Libera Reserva
    async liberarReserva(pTransaccionId: string) {
        try {
            const response = await this.axiosInstance.post("/liberarDeuda", {
                idTransaccion: pTransaccionId
            });
            const codigo = response.data.status;
            if (codigo == "OK") {
                return response.data.data;
            } else {
                return null;
            }
        } catch (error) {
            return error;
        }
    }
    async confirmarPago(payload: any) {
        try {
            const response = await this.axiosInstance.post("/confirmarPago", payload);
            const codigo = response.data.status;
            if (codigo == "OK") {
                return response.data.data;
            } else {
                return null;
            }
        } catch (error) {
            return error;
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
}
