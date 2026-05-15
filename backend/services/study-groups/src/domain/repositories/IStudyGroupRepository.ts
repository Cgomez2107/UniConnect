import type { GroupContext } from "../states/GroupContext.js";
import type { ISubject } from "../events/observers/ISubject.js";

export interface IStudyGroupRepository {
  loadStudyGroup(requestId: string, subject: ISubject): Promise<GroupContext>;
}
