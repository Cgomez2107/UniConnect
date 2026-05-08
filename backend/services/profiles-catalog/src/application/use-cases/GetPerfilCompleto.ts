import type { Student } from "../../domain/entities/Student.js";
import type { IIndicadoresRepository } from "../../domain/repositories/IIndicadoresRepository.js";
import { PerfilBase } from "../../domain/decorators/PerfilBase.js";
import { EstadisticasDecorator } from "../../domain/decorators/EstadisticasDecorator.js";
import { InsigniasDecorator } from "../../domain/decorators/InsigniasDecorator.js";
import type { IPerfil } from "../../domain/decorators/IPerfil.js";

export class GetPerfilCompleto {
  constructor(
    private readonly indicadoresRepository: IIndicadoresRepository,
  ) {}

  async execute(student: Student): Promise<IPerfil> {
    const perfilBase = new PerfilBase({
      id: student.id,
      fullName: student.fullName,
      avatarUrl: student.avatarUrl,
      carrera: student.programName ?? "Sin programa",
      semestre: student.semester,
      asignaturasActivas: student.sharedSubjects ?? [],
    });

    try {
      const [indicadores, insignias] = await Promise.all([
        this.indicadoresRepository.getIndicadores(student.id),
        this.indicadoresRepository.getInsignias(student.id),
      ]);

      return new InsigniasDecorator(
        new EstadisticasDecorator(perfilBase, indicadores),
        insignias,
      );
    } catch (error) {
      console.error(
        "[GetPerfilCompleto] Error obteniendo indicadores, retornando perfil base:",
        error,
      );
      return perfilBase;
    }
  }
}
