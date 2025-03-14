import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('No se proporcionaron credenciales');
    }

    // Decodificar usuario y contraseña
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Validar usuario y contraseña (puedes cambiar esto por una consulta a la DB)
    if (username !== process.env.AUTH_BASIC_USER || password !== process.env.AUTH_BASIC_PASS) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return true;
  }
}
