import type { IForumRepository } from "../../repositories/IForumRepository";
import type { ForumQuestion } from "@/types";

export class CreateForumQuestion {
  constructor(private forumRepo: IForumRepository) {}

  async execute(subjectId: string, title: string, body: string): Promise<ForumQuestion> {
    if (!subjectId) throw new Error("El ID de la asignatura es requerido.");
    if (!title || title.trim().length === 0) throw new Error("El título es requerido.");
    if (title.length > 200) throw new Error("El título no puede superar los 200 caracteres.");
    if (!body || body.trim().length === 0) throw new Error("El contenido es requerido.");
    if (body.length > 5000) throw new Error("El contenido no puede superar los 5000 caracteres.");
    return this.forumRepo.createQuestion(subjectId, title.trim(), body.trim());
  }
}
