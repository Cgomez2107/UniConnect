/**
 * Middleware Base - Contrato que todos los decorators deben cumplir
 * 
 * Decorator Pattern: Cada middleware es un decorator independiente que
 * agrega responsabilidad (validación, transformación) al request sin modificar
 * el middleware original.
 */

export interface Request {
  userId?: string;
  email?: string;
  token?: string;
  body: any;
  headers: Record<string, string>;
  timestamp: Date;
  [key: string]: any;
}

export interface Response {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export interface NextFunction {
  (): Promise<void>;
}

export type MiddlewareHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Interfaz base para middlewares (decorators)
 */
export interface IMiddleware {
  handle(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export abstract class Middleware implements IMiddleware {
  protected next: IMiddleware | null = null;

  /**
   * Establecer el siguiente middleware en la cadena (patrón cadena de responsabilidad)
   */
  public setNext(middleware: IMiddleware): IMiddleware {
    this.next = middleware;
    return middleware;
  }

  /**
   * Ejecutar el siguiente middleware
   */
  protected async executeNext(
    req: Request,
    res: Response
  ): Promise<void> {
    if (this.next) {
      await this.next.handle(req, res, async () => {});
    }
  }

  /**
   * Método abstracto que debe implementar cada decorator
   */
  abstract handle(req: Request, res: Response, next: NextFunction): Promise<void>;

  /**
   * Responder con error
   */
  protected sendError(res: Response, code: number, message: string): void {
    res.status = code;
    res.body = { error: message };
  }

  /**
   * Responder con éxito
   */
  protected sendSuccess(res: Response, data: any): void {
    res.status = 200;
    res.body = { success: true, data };
  }
}

export default Middleware;
