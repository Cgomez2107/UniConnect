import type { StudyResource } from "../entities/StudyResource.js";
import type { IResourceCard } from "./IResourceCard.js";

export class BaseResourceCard implements IResourceCard {
  constructor(private readonly resource: StudyResource) {}

  getContent(): Record<string, unknown> {
    const base: Record<string, unknown> = {
      id: this.resource.id,
      title: this.resource.title,
      description: this.resource.description,
      type: this.resource.resourceType,
      createdAt: this.resource.createdAt,
      updatedAt: this.resource.updatedAt,
    };

    if (this.resource.resourceType === "link") {
      base.url = this.resource.url;
    } else {
      base.fileUrl = this.resource.fileUrl;
      base.fileName = this.resource.fileName;
      base.fileType = this.resource.fileType;
      base.fileSizeKb = this.resource.fileSizeKb;
    }

    return base;
  }

  getMetadata(): Record<string, unknown> {
    const meta: Record<string, unknown> = {};

    if (this.resource.profiles) {
      meta.author = {
        fullName: this.resource.profiles.fullName,
        avatarUrl: this.resource.profiles.avatarUrl,
      };
    }

    if (this.resource.subjects) {
      meta.subject = {
        name: this.resource.subjects.name,
      };
    }

    return meta;
  }

  render(): string {
    const content = this.getContent();
    const metadata = this.getMetadata();
    return JSON.stringify({ ...content, ...metadata });
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.getContent(),
      ...this.getMetadata(),
    };
  }
}
