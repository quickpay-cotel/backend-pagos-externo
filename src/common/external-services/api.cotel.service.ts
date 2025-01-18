import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { ConsultaDatosClienteDto } from "src/cotel/dto/consulta-datos-cliente.dto";

@Injectable()
export class ApiCotelService {
    private readonly axiosInstance: AxiosInstance;
    constructor() {
        // Configuración de Axios
        this.axiosInstance = axios.create({
            baseURL: process.env.COTEL_API,
            timeout: 30000,
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

}