import type { Student } from "../../domain/entities/Student.js";
import type { IIndicatorsRepository } from "../../domain/repositories/IIndicatorsRepository.js";
import { BaseProfile } from "../../domain/decorators/BaseProfile.js";
import { StatisticsDecorator } from "../../domain/decorators/StatisticsDecorator.js";
import { BadgesDecorator } from "../../domain/decorators/BadgesDecorator.js";
import type { IProfile } from "../../domain/decorators/IProfile.js";

export class GetFullProfile {
  constructor(
    private readonly indicatorsRepository: IIndicatorsRepository,
  ) {}

  async execute(student: Student): Promise<IProfile> {
    const baseProfile = new BaseProfile({
      id: student.id,
      fullName: student.fullName,
      avatarUrl: student.avatarUrl,
      carrera: student.programName ?? "Sin programa",
      semestre: student.semester,
      asignaturasActivas: student.sharedSubjects ?? [],
    });

    try {
      const [indicators, badges] = await Promise.all([
        this.indicatorsRepository.getIndicators(student.id),
        this.indicatorsRepository.getBadges(student.id),
      ]);

      return new BadgesDecorator(
        new StatisticsDecorator(baseProfile, indicators),
        badges,
      );
    } catch (error) {
      console.error(
        "[GetFullProfile] Error obteniendo indicadores, retornando perfil base:",
        error,
      );
      return baseProfile;
    }
  }
}
