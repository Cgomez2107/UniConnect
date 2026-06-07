import type { StudyGroup } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";
export interface StudyGroupsState {
    groups: StudyGroup[];
    isLoading: boolean;
    error: string | null;
    loadGroups(): Promise<void>;
    setGroups(groups: StudyGroup[]): void;
    addGroup(group: StudyGroup): void;
    updateGroup(group: StudyGroup): void;
    removeGroup(groupId: string): void;
    setError(error: string | null): void;
}
export declare function createStudyGroupsStore(deps: StoreDeps): import("zustand").UseBoundStore<import("zustand").StoreApi<StudyGroupsState>>;
//# sourceMappingURL=createStudyGroupsStore.d.ts.map