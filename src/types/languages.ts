/**
 * Represents statistics for a single programming language
 */
export interface LanguageStats {
  /** Name of the programming language */
  language: string;

  /** Total bytes of code written in this language across all repositories */
  bytes: number;

  /** Total bytes of code written in this language (alias) */
  bytesUsed: number;

  /** Number of repositories using this language */
  repos: number;

  /** Number of repositories using this language (alias) */
  repoCount: number;

  /** Percentage of total codebase (0-100) */
  percentage: number;

  /** Percentage of total codebase (0-100) (alias) */
  percent: number;

  /** GitHub's color code for this language (e.g., "#f1e05a" for JavaScript) */
  color?: string | undefined;
}

/**
 * Repository counts breakdown
 */
export interface RepoCounts {
  /** Total repositories in this set */
  total: number;

  /** Public repositories (non-private) */
  public: number;

  /** Private repositories */
  private: number;

  /** Forked repositories */
  forks: number;

  /** Non-fork repositories */
  nonForks: number;
}

/**
 * Complete language statistics result for a GitHub user
 */
export interface LanguageStatsResult {
  /** Array of language statistics, ordered by percentage (high to low) */
  languages: LanguageStats[];

  /** Array of language statistics (alias) */
  languageStats: LanguageStats[];

  /** Total bytes across all languages and repositories */
  totalBytes: number;

  /** Total bytes across all languages and repositories (alias) */
  bytesTotal: number;

  /** Total number of repositories analyzed (non-fork, owned by user) */
  totalRepos: number;

  /** Total number of repositories analyzed (alias) */
  reposTotal: number;

  /** Repository breakdown for all fetched repos (unfiltered) */
  repoCounts: RepoCounts;

  /** Repository breakdown for all fetched repos (alias) */
  reposAll: RepoCounts;

  /** Repository breakdown after applying options filters */
  filteredRepoCounts: RepoCounts;

  /** Repository breakdown after applying options filters (alias) */
  reposFiltered: RepoCounts;
}
