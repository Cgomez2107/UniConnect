export interface IBannedWordList {
  containsBannedWord(text: string): Promise<boolean>;
}
