/**
 * Decorator 2: Email Verification Middleware
 * 
 * Capa 2: Verifica que el email del usuario sea institucional (@ucaldas.edu.co)
 * Agrega flag emailVerified al request
 * 
 * Nota: Este middleware se ejecuta DESPUÉS de AuthenticationMiddleware
 * porque necesita userId del request
 */

import Middleware, { Request, Response, NextFunction } from './Middleware';

export class EmailVerificationMiddleware extends Middleware {
  
  /**
   * Validar formato de email institucional
   */
  private isInstitutionalEmail(email: string): boolean {
    // En producción, consultar BD para verificar si está confirmado
    const institutionalDomain = '@ucaldas.edu.co';
    return email.endsWith(institutionalDomain);
  }

  public async handle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const email = req.email || req.body.email;

    if (!email) {
      this.sendError(res, 400, 'Email requerido');
      return;
    }

    if (!this.isInstitutionalEmail(email)) {
      this.sendError(res, 403, 'Solo emails institucionales (@ucaldas.edu.co) permitidos');
      return;
    }

    // ✅ DECORAR: Marcar email como verificado
    req.email = email;
    req.body.emailVerified = true;

    // Ejecutar siguiente middleware en la cadena
    await this.executeNext(req, res);
    await next();
  }
}

export default EmailVerificationMiddleware;
