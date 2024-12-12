import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConsultaDatosClienteDto } from "./dto/consulta-datos-cliente.dto";
import axios, { AxiosInstance } from 'axios';
@Injectable()
export class CotelService {
    private readonly axiosInstance: AxiosInstance;
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.COTEL_API,
            timeout: 10000
        });
    }
    async consultaDatosCliente(consultaDatosClienteDto: ConsultaDatosClienteDto) {
        try {
            const response = await this.axiosInstance.post('/consultar', consultaDatosClienteDto);
            let codigo = response.data.status;
            if (codigo == 'OK') {
                return response.data.data
            } else {
                return null
            }

        } catch (error) {
            throw new HttpException(error.response.data.data, HttpStatus.NOT_FOUND);
        }
    }
    async consultaDeudaCliente(pContratoId: number) {
        try {
            const response = await this.axiosInstance.post('/consultarDeuda', {
                contratoId:pContratoId,
                servicioId:"1"
            });
            let codigo = response.data.status;
            if (codigo == 'OK') {
                return response.data.data
            } else {
                return null
            }

        } catch (error) {
            return error
        }
    }
    
}