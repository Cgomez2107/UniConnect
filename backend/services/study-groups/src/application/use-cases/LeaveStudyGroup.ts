import type { IStudyGroupRepository } from "../../domain/repositories/IStudyGroupRepository.js";
import type { IMemberRepository } from "../../domain/repositories/IMemberRepository.js";
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository.js";
import type { StudyGroupSubject } from "../../domain/events/index.js";
import { requireTrimmed } from "../../../../../shared/libs/validation/index.js";
import { NotFoundError } from "../../../../../shared/libs/errors/NotFoundError.js";
import { ValidationError } from "../../../../../shared/libs/errors/ValidationError.js";
import { InvalidStateTransitionError } from "../../../../../shared/libs/errors/InvalidStateTransitionError.js";

export interface LeaveStudyGroupInput {
  readonly requestId: string;
  readonly actorUserId: string;
}

export class LeaveStudyGroup {
  constructor(
    private readonly studyGroupRepository: IStudyGroupRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly applicationRepository: IApplicationRepository,
    private readonly subject: StudyGroupSubject,
  ) {}

  async execute(input: LeaveStudyGroupInput): Promise<void> {
    const requestId = requireTrimmed(input.requestId, "requestId");
    const actorUserId = requireTrimmed(input.actorUserId, "actorUserId");

    const members = await this.memberRepository.findByGroup(requestId);
    const member = members.find((m) => m.userId === actorUserId);
    if (!member) {
      throw new NotFoundError("No eres miembro de este grupo.");
    }

    if (member.role === "autor") {
      throw new ValidationError("El creador no puede salir del grupo. Debe transferir la propiedad primero.");
    }

    if (member.role === "admin") {
      try {
        const group = await this.studyGroupRepository.loadStudyGroup(requestId, this.subject);
        await group.leaveAdminRole(actorUserId);
      } catch (err) {
        if (err instanceof InvalidStateTransitionError) {
          throw new ValidationError(err.message);
        }
        throw err;
      }
      return;
    }

    await this.applicationRepository.leaveGroup({
      requestId,
      userId: actorUserId,
    });
  }
}
