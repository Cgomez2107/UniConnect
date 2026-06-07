import type { StudyResource } from "@uniconnect/shared-types";
import type { StoreDeps } from "../types/index.js";
export interface ResourcesState {
    resources: StudyResource[];
    isLoading: boolean;
    error: string | null;
    loadResources(filters?: {
        subjectId?: string;
        type?: string;
        userId?: string;
    }): Promise<void>;
    setResources(resources: StudyResource[]): void;
    addResource(resource: StudyResource): void;
    updateResource(resource: StudyResource): void;
    removeResource(resourceId: string): void;
    setError(error: string | null): void;
}
export declare function createResourcesStore(deps: StoreDeps): import("zustand").UseBoundStore<import("zustand").StoreApi<ResourcesState>>;
//# sourceMappingURL=createResourcesStore.d.ts.map