/**
 * Decorator 3: Semester Check Middleware
 * 
 * Capa 3: Verifica que el usuario esté activo en la materia actual
 * Consulta BD si el usuario está inscrito en algún curso este semestre
 * 
 * Nota: Este middleware se ejecuta DESPUÉS de los anteriores
 * porque necesita userId para consultar BD
 */

import Middleware, { Request, Response, NextFunction } from './Middleware';

export class SemesterCheckMiddleware extends Middleware {
  
  /**
   * Obtener semestre actual
   * En producción: consultar tabla de semestres
   */
  private getCurrentSemester(): { year: number; term: number } {
    const now = new Date();
    const year = now.getFullYear();
    // Enero-Mayo: 1, Agosto-Diciembre: 2
    const term = now.getMonth() < 6 ? 1 : 2;
    return { year, term };
  }

  /**
   * Verificar si usuario está inscrito en semestre actual
   * En producción: consultar BD con userId
   */
  private async isUserActiveInSemester(userId: string): Promise<boolean> {
    // Simulación: en producción sería una consulta a BD
    // const enrollments = await this.db.query(
    //   'SELECT * FROM enrollments WHERE user_id = $1 AND active = true',
    //   [userId]
    // );
    // return enrollments.rows.length > 0;

    // Por ahora, simulamos que está activo
    return true;
  }

  public async handle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userId = req.userId;

    if (!userId) {
      this.sendError(res, 401, 'Usuario no autenticado');
      return;
    }

    const semester = this.getCurrentSemester();
    const isActive = await this.isUserActiveInSemester(userId);

    if (!isActive) {
      this.sendError(
        res,
        403,
        `Usuario no activo en semestre ${semester.year}-${semester.term}`
      );
      return;
    }

    // ✅ DECORAR: Marcar usuario como activo en este semestre
    req.body.semesterActive = true;
    req.body.currentSemester = semester;

    // Ejecutar siguiente middleware en la cadena
    await this.executeNext(req, res);
    await next();
  }
}

export default SemesterCheckMiddleware;
