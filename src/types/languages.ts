/**
 * Represents statistics for a single programming language
 */
export interface LanguageStats {
  /** Name of the programming language */
  name: string;

  /** Total bytes of code written in this language across all repositories */
  size: number;

  /** Number of repositories using this language */
  repoCount: number;

  /** Percentage of total codebase (0-100) */
  percentage: number;

  /** GitHub's color code for this language (e.g., "#f1e05a" for JavaScript) */
  color?: string | undefined;
}

/**
 * Complete language statistics result for a GitHub user
 */
export interface LanguageStatsResult {
  /** Array of language statistics, ordered by percentage (high to low) */
  languages: LanguageStats[];

  /** Total code size across all languages (in bytes) */
  totalSize: number;

  /** Total number of repositories analyzed */
  totalRepos: number;
}
