export interface Project {
  id: string;
  platform: string;
  externalId: string;
  title: string;
  description: string;
  url: string;
  budget: string | null;
  category: string | null;
  tags: string | null;
  country: string | null;
  postedAt: string | null;
  isFavorite: boolean;
  isDiscarded: boolean;
  matchScore: number | null;
  scoreReason: string | null;
  proposalStatus: string | null;
  proposalValue: number | null;
  proposalText: string | null;
  statusUpdatedAt: string | null;
  collectedAt: string;
  updatedAt: string;
}

export type ProposalStatus = "em_negociacao" | "em_desenvolvimento" | "concluida";

export type SortOption = "date" | "score" | "value";

export interface Filters {
  platforms: string[];
  minScore: number;
  search: string;
  proposalStatuses: string[];
  showDiscarded: boolean;
  sort: SortOption;
}
