import type {
  AuthStateChangeCallback,
  IAuthRepository,
} from "../../repositories/IAuthRepository"

export class SubscribeAuthStateChanges {
  constructor(private repository: IAuthRepository) {}

  execute(callback: AuthStateChangeCallback) {
    return this.repository.onAuthStateChange(callback)
  }
}
