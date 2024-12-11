import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
export class FuncionesGenerales {
    public async checkFileExistence(filePath: string): Promise<boolean> {
        const access = promisify(fs.access);
        try {
            await access(filePath, fs.constants.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }
    public convertToBase64(filePath: string) {
        // Lee el archivo de la ruta especificada
        const fileBuffer = fs.readFileSync(filePath);
        // Convierte el archivo a Base64
        const base64File = fileBuffer.toString('base64');
        // Determina el tipo MIME basado en la extensión del archivo
        const nombreArchivoConExt = path.basename(filePath);
        const mimeType = this.getMimeType(nombreArchivoConExt);
        // Retorna la imagen como una cadena Base64 en el formato adecuado
        return `data:${mimeType};base64,${base64File}`;
    }
    // Método para obtener el tipo MIME del archivo basado en su extensión
    private getMimeType(fileName: string): string {
        const extname = path.extname(fileName).toLowerCase();
        switch (extname) {
            case '.png': return 'image/png';
            case '.jpg':
            case '.jpeg': return 'image/jpeg';
            case '.gif': return 'image/gif';
            case '.bmp': return 'image/bmp';
            case '.webp': return 'image/webp';
            case '.svg': return 'image/svg+xml';
            default: return 'application/octet-stream';
        }
    }
    public  esJSON(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
}