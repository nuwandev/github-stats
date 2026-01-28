import type { LanguageStats, LanguageStatsResult } from "../types/languages.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

interface GitHubLanguageResponse {
  data?: {
    user?: {
      repositories: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: Array<{
          name: string;
          languages: {
            edges: Array<{
              size: number;
              node: {
                name: string;
                color?: string;
              };
            }>;
          };
        }>;
      };
    };
    rateLimit?: {
      cost: number;
      remaining: number;
      resetAt: string;
    };
  };
  errors?: Array<{ message: string }>;
}

interface LanguageAggregation {
  bytes: number;
  repos: Set<string>;
  color?: string | undefined;
}

/**
 * Fetches all repositories for a user with pagination support
 */
async function fetchAllRepositories(
  username: string,
  token: string,
): Promise<
  Array<{
    name: string;
    languages: {
      edges: Array<{ size: number; node: { name: string; color?: string } }>;
    };
  }>
> {
  const repositories: Array<{
    name: string;
    languages: {
      edges: Array<{ size: number; node: { name: string; color?: string } }>;
    };
  }> = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  const query = `
    query UserRepoLanguages($login: String!, $cursor: String) {
      user(login: $login) {
        repositories(
          first: 100
          after: $cursor
          ownerAffiliations: OWNER
          isFork: false
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name
            languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
      rateLimit {
        cost
        remaining
        resetAt
      }
    }
  `;

  while (hasNextPage) {
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "@nuwan-dev/github-stats",
      },
      body: JSON.stringify({
        query,
        variables: { login: username, cursor },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    const result: GitHubLanguageResponse = await response.json();

    if (Array.isArray(result.errors) && result.errors.length > 0) {
      throw new Error(`GitHub GraphQL Error: ${result.errors[0]?.message}`);
    }

    if (!result.data?.user?.repositories) {
      throw new Error(`User "${username}" not found or has no repositories.`);
    }

    const repos = result.data.user.repositories;
    repositories.push(...repos.nodes);

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;

    // Optional: Log rate limit info for debugging
    if (result.data.rateLimit) {
      const { cost, remaining, resetAt } = result.data.rateLimit;
      // You can log or track this: console.log(`Cost: ${cost}, Remaining: ${remaining}, Reset: ${resetAt}`);
    }
  }

  return repositories;
}

/**
 * Aggregates language statistics from all repositories
 */
function aggregateLanguageStats(
  repositories: Array<{
    name: string;
    languages: {
      edges: Array<{ size: number; node: { name: string; color?: string } }>;
    };
  }>,
): Map<string, LanguageAggregation> {
  const languageMap = new Map<string, LanguageAggregation>();

  for (const repo of repositories) {
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      const size = edge.size;
      const color = edge.node.color;

      const current = languageMap.get(name) ?? {
        bytes: 0,
        repos: new Set<string>(),
        color,
      };

      current.bytes += size;
      current.repos.add(repo.name);
      if (color && !current.color) {
        current.color = color;
      }

      languageMap.set(name, current);
    }
  }

  return languageMap;
}

/**
 * Fetches and aggregates GitHub language statistics for a user
 *
 * @param username - GitHub username
 * @param token - GitHub OAuth token or Personal Access Token
 * @returns Language statistics ordered by percentage (high to low)
 *
 * @example
 * ```typescript
 * const stats = await fetchLanguageStats('octocat', process.env.GITHUB_TOKEN);
 * console.log(stats.languages[0]); // Most used language
 * console.log(stats.totalBytes); // Total bytes across all languages
 * ```
 */
export async function fetchLanguageStats(
  username: string,
  token: string,
): Promise<LanguageStatsResult> {
  // Fetch all repositories with pagination
  const repositories = await fetchAllRepositories(username, token);

  // Aggregate language data
  const languageMap = aggregateLanguageStats(repositories);

  // Calculate total bytes
  const totalBytes = [...languageMap.values()].reduce(
    (sum, lang) => sum + lang.bytes,
    0,
  );

  if (totalBytes === 0) {
    return {
      languages: [],
      totalBytes: 0,
      totalRepos: repositories.length,
    };
  }

  // Convert to array and calculate percentages
  const languages: LanguageStats[] = [...languageMap.entries()]
    .map(([name, data]) => ({
      language: name,
      bytes: data.bytes,
      repos: data.repos.size,
      percentage: (data.bytes / totalBytes) * 100,
      color: data.color,
    }))
    // Sort by percentage (high to low)
    .sort((a, b) => b.percentage - a.percentage);

  return {
    languages,
    totalBytes,
    totalRepos: repositories.length,
  };
}

/**
 * Gets the top N languages by usage percentage
 *
 * @param username - GitHub username
 * @param token - GitHub OAuth token or Personal Access Token
 * @param limit - Number of top languages to return (default: 10)
 * @returns Top N languages ordered by percentage
 *
 * @example
 * ```typescript
 * const topSkills = await getTopLanguages('octocat', process.env.GITHUB_TOKEN, 5);
 * // Returns top 5 languages
 * ```
 */
export async function getTopLanguages(
  username: string,
  token: string,
  limit = 10,
): Promise<LanguageStats[]> {
  const stats = await fetchLanguageStats(username, token);
  return stats.languages.slice(0, limit);
}
