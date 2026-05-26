import type { IResource } from "./IResource.js";

export abstract class ResourceDecorator implements IResource {
  protected readonly resource: IResource;

  constructor(resource: IResource) {
    this.resource = resource;
  }

  get id(): string {
    return this.resource.id;
  }

  get title(): string {
    return this.resource.title;
  }

  get description(): string | null {
    return this.resource.description;
  }

  get url(): string {
    return this.resource.url;
  }

  get resourceType(): string | null {
    return this.resource.resourceType;
  }

  get uploaderUserId(): string {
    return this.resource.uploaderUserId;
  }

  getBaseInfo(): Record<string, unknown> {
    return this.resource.getBaseInfo();
  }

  getMetadata(): Record<string, unknown> {
    return this.resource.getMetadata();
  }

  render(): string {
    return this.resource.render();
  }

  toJSON(): Record<string, unknown> {
    return this.resource.toJSON();
  }
}
