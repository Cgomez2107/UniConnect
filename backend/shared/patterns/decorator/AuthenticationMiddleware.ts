/**
 * Decorator 1: Authentication Middleware
 * 
 * Capa 1: Verifica que el token JWT sea válido
 * Extrae userId del token y lo agrega al request
 */

import Middleware, { Request, Response, NextFunction } from './Middleware';

export class AuthenticationMiddleware extends Middleware {
  
  /**
   * Validar JWT token
   */
  private validateToken(token: string): { valid: boolean; userId?: string } {
    try {
      // En producción, usar jwt.verify()
      // Por ahora, simulación simple
      if (!token) {
        return { valid: false };
      }

      // Extraer userId del token (en estructura real sería JWT payload)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false };
      }

      // Simulación: el userId está en el token
      const userId = Buffer.from(parts[1], 'base64').toString();
      return { valid: true, userId };
    } catch (error) {
      return { valid: false };
    }
  }

  public async handle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      this.sendError(res, 401, 'Token requerido');
      return;
    }

    const { valid, userId } = this.validateToken(token);

    if (!valid) {
      this.sendError(res, 401, 'Token inválido o expirado');
      return;
    }

    // ✅ DECORAR: Agregar userId al request
    req.userId = userId;
    req.token = token;

    // Ejecutar siguiente middleware en la cadena
    await this.executeNext(req, res);
    await next();
  }
}

export default AuthenticationMiddleware;
