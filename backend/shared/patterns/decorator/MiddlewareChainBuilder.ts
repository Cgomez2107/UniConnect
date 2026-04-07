/**
 * Middleware Chain Builder
 * 
 * Constructor fluido para apilar decorators en orden
 * Patrón: Builder + Chain of Responsibility
 * 
 * Uso:
 * const chain = MiddlewareChain.builder()
 *   .addAuthentication()
 *   .addEmailVerification()
 *   .addSemesterCheck()
 *   .build();
 * 
 * await chain.execute(req, res);
 */

import { IMiddleware, Request, Response } from './Middleware';
import AuthenticationMiddleware from './AuthenticationMiddleware';
import EmailVerificationMiddleware from './EmailVerificationMiddleware';
import SemesterCheckMiddleware from './SemesterCheckMiddleware';

export class MiddlewareChainBuilder {
  private middlewares: IMiddleware[] = [];

  /**
   * Agregar Authentication Middleware
   */
  public addAuthentication(): this {
    this.middlewares.push(new AuthenticationMiddleware());
    return this;
  }

  /**
   * Agregar Email Verification Middleware
   */
  public addEmailVerification(): this {
    this.middlewares.push(new EmailVerificationMiddleware());
    return this;
  }

  /**
   * Agregar Semester Check Middleware
   */
  public addSemesterCheck(): this {
    this.middlewares.push(new SemesterCheckMiddleware());
    return this;
  }

  /**
   * Construir la cadena
   */
  public build(): MiddlewareChain {
    return new MiddlewareChain(this.middlewares);
  }

  /**
   * Builder estático
   */
  public static builder(): MiddlewareChainBuilder {
    return new MiddlewareChainBuilder();
  }
}

/**
 * Cadena de middlewares
 */
export class MiddlewareChain {
  private head: IMiddleware | null = null;

  constructor(middlewares: IMiddleware[]) {
    // Encadenar middlewares
    for (let i = 0; i < middlewares.length - 1; i++) {
      middlewares[i].setNext(middlewares[i + 1]);
    }

    if (middlewares.length > 0) {
      this.head = middlewares[0];
    }
  }

  /**
   * Ejecutar la cadena de middlewares
   */
  public async execute(req: Request, res: Response): Promise<Response> {
    if (this.head) {
      await this.head.handle(req, res, async () => {});
    }
    return res;
  }
}

export default MiddlewareChainBuilder;
