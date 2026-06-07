import type { StudyResource } from "../entities/StudyResource.js";
import { BaseResourceCard } from "./BaseResourceCard.js";
import { OpenGraphDecorator } from "./OpenGraphDecorator.js";
import { RatingDecorator } from "./RatingDecorator.js";
import { CommentsDecorator } from "./CommentsDecorator.js";
import type { IResourceCard } from "./IResourceCard.js";

export class ResourceDecoratorFactory {
  static createCard(resource: StudyResource): IResourceCard {
    let card: IResourceCard = new BaseResourceCard(resource);

    // Apply OpenGraph decorator if resource has OG data
    if (resource.ogTitle || resource.ogDescription || resource.ogImage) {
      card = OpenGraphDecorator.wrap(card, {
        ogTitle: resource.ogTitle ?? null,
        ogDescription: resource.ogDescription ?? null,
        ogImage: resource.ogImage ?? null,
      });
    }

    // Apply Rating decorator if resource has rating data
    // Note: Rating data would need to be fetched separately from a ratings table
    // For now, we'll skip this as the data structure doesn't include it yet
    // if (resource.rating) {
    //   card = RatingDecorator.wrap(card, resource.rating);
    // }

    // Apply Comments decorator if resource has comments data
    // Note: Comments data would need to be fetched separately from a comments table
    // For now, we'll skip this as the data structure doesn't include it yet
    // if (resource.comments) {
    //   card = CommentsDecorator.wrap(card, resource.comments);
    // }

    return card;
  }

  static createCards(resources: StudyResource[]): IResourceCard[] {
    return resources.map(resource => this.createCard(resource));
  }
}
