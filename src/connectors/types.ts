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
  /** When true, the connector already filtered by keywords — skip isRelevant check */
  preFiltered?: boolean;
}
