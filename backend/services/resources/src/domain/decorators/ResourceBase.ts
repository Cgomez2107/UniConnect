import type { IResource } from "./IResource.js";

export class ResourceBase implements IResource {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly url: string;
  readonly resourceType: string | null;
  readonly uploaderUserId: string;

  constructor(input: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    resourceType: string | null;
    uploaderUserId: string;
  }) {
    this.id = input.id;
    this.title = input.title;
    this.description = input.description;
    this.url = input.url;
    this.resourceType = input.resourceType;
    this.uploaderUserId = input.uploaderUserId;
  }

  getBaseInfo(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      url: this.url,
      resourceType: this.resourceType,
      uploaderUserId: this.uploaderUserId,
    };
  }

  getMetadata(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      url: this.url,
      resourceType: this.resourceType,
      uploaderUserId: this.uploaderUserId,
    };
  }

  render(): string {
    return this.title;
  }

  toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
