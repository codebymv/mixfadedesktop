export type DeckSide = 'A' | 'B';

export interface RecentFile {
  id: string;
  name: string;
  size: string;
  lastModified: string;
  lastUsedSide: DeckSide | null;
  file?: File;
}