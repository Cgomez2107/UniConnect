import type { IForumRepository } from "../../repositories/IForumRepository";
import type { ForumAnswer } from "@/types";

export class CreateForumAnswer {
  constructor(private forumRepo: IForumRepository) {}

  async execute(questionId: string, body: string): Promise<ForumAnswer> {
    if (!body || body.trim().length === 0) throw new Error("El contenido es requerido.");
    if (body.length > 5000) throw new Error("El contenido no puede superar los 5000 caracteres.");
    return this.forumRepo.createAnswer(questionId, body.trim());
  }
}
