import { Injectable, Inject } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { ConsultaDatosClienteDto } from "src/cotel/dto/consulta-datos-cliente.dto";
import { IDatabase } from "pg-promise";

@Injectable()
export class ApiCotelService {
    private token: any;
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

    async generarToken(): Promise<any> {
        try {
            const response = await this.axiosInstance.post("/auth",
                {
                    username: process.env.COTEL_USERNAME,
                    password: process.env.COTEL_PASSWORD,
                }
            );
            const status = response.data.status;
            if (status == "OK") {
                this.token = response.data.data;
            } else {
                this.token = "";
            }
        } catch (error) {
            throw error;
        }
    }
    // Reservar deuda
    async reservaPago(arrayDeudasDto: any): Promise<any> {
        try {
            await this.generarToken();
            const response = await this.axiosInstance.post("/web/pagarDeuda", { listaDeuda: arrayDeudasDto }, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });
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
            await this.generarToken();
            const response = await this.axiosInstance.post("/web/consultar", consultaDatosClienteRequestDto, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });
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
            await this.generarToken();
            const response = await this.axiosInstance.post("/web/consultarDeuda", {
                contratoId: pContratoId,
                servicioId: pServicioId,
            }, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
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
            await this.generarToken();
            const response = await this.axiosInstance.post("/liberarDeuda", {
                idTransaccion: pTransaccionId
            }, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
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
            await this.generarToken();
            const response = await this.axiosInstance.post("/web/confirmarPago", payload, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
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
