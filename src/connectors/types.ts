export interface RawProject {
  externalId: string;
  title: string;
  description: string;
  url: string;
  budget?: string;
  category?: string;
  tags?: string[];
  country?: string;
  postedAt?: Date;
}
