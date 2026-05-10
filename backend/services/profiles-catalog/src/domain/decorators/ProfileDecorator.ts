import type { IProfile } from "./IProfile.js";

export abstract class ProfileDecorator implements IProfile {
  protected readonly profile: IProfile;

  constructor(profile: IProfile) {
    this.profile = profile;
  }

  get id(): string {
    return this.profile.id;
  }

  get fullName(): string {
    return this.profile.fullName;
  }

  get avatarUrl(): string | null {
    return this.profile.avatarUrl;
  }

  getBaseInfo(): Record<string, unknown> {
    return this.profile.getBaseInfo();
  }

  getMetadata(): Record<string, unknown> {
    return this.profile.getMetadata();
  }

  render(): string {
    return this.profile.render();
  }

  toJSON(): Record<string, unknown> {
    return this.profile.toJSON();
  }
}
