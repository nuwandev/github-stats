import type { LanguageStats, LanguageStatsResult } from "../types/languages.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

interface GitHubLanguageResponse {
  data?: {
    user?: {
      repositories: {
        totalCount?: number;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: Array<{
          name: string;
          owner: { login: string };
          isFork: boolean;
          isPrivate: boolean;
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
  color?: string | undefined; // color is optional, decorative only
}

/**
 * Fetches all repositories for a user with pagination support
 */
async function fetchAllRepositories(
  username: string,
  token: string,
  options: { includeForks?: boolean; includePrivate?: boolean } = {},
  ): Promise<{
    repositories: Array<{
      name: string;
      owner: { login: string };
      isFork: boolean;
      isPrivate: boolean;
      languages: {
        edges: Array<{ size: number; node: { name: string; color?: string } }>;
      };
    }>;
  }> {
  const { includeForks = false, includePrivate = false } = options;

  const repositories: Array<{
    name: string;
    owner: { login: string };
    isFork: boolean;
    isPrivate: boolean;
    languages: {
      edges: Array<{ size: number; node: { name: string; color?: string } }>;
    };
  }> = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  // let totalCount = 0;

  // Note: Private repositories require the token to have the 'repo' scope and the viewer to have access.
  // The 'privacy' variable allows explicit filtering of public/private repos at the API level.
  const query = `
    query UserRepoLanguages($login: String!, $cursor: String, $privacy: RepositoryPrivacy) {
      user(login: $login) {
        repositories(
          first: 100
          after: $cursor
          ownerAffiliations: OWNER
          privacy: $privacy
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name
            owner { login }
            isFork
            isPrivate
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
        variables: {
          login: username,
          cursor,
          privacy: includePrivate ? null : "PUBLIC",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    const result: GitHubLanguageResponse = await response.json();

    if (Array.isArray(result.errors) && result.errors.length > 0) {
      // Check for permission/scope errors
      const forbidden = result.errors.find(e => e.message && e.message.toLowerCase().includes("forbidden"));
      if (forbidden) {
        throw new Error(`GitHub API permission error: Your token may lack required scopes or access. (${forbidden.message})`);
      }
      throw new Error(`GitHub GraphQL Error: ${result.errors[0]?.message}`);
    }

    if (result.data?.user === null) {
      throw new Error(`User \"${username}\" not found.`);
    }
    if (!result.data?.user?.repositories) {
      throw new Error(`No repositories found or insufficient permissions for user \"${username}\".`);
    }

    const repos = result.data.user.repositories;

    // totalCount removed

    // Filter based on options
    const reposToAdd = repos.nodes.filter((repo) => {
      if (!includeForks && repo.isFork) return false;
      if (!includePrivate && repo.isPrivate) return false;
      return true;
    });

    repositories.push(...reposToAdd);

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;

    // Optional: Log rate limit info for debugging
    if (result.data.rateLimit) {
      const { cost, remaining, resetAt } = result.data.rateLimit;
      // You can log or track this: console.log(`Cost: ${cost}, Remaining: ${remaining}, Reset: ${resetAt}`);
    }
  }

  return { repositories };
}

/**
 * Aggregates language statistics from all repositories
 */
function aggregateLanguageStats(
  repositories: Array<{
    name: string;
    owner: { login: string };
    isFork: boolean;
    isPrivate: boolean;
    languages: {
      edges: Array<{ size: number; node: { name: string; color?: string } }>;
    };
  }>,
): Map<string, LanguageAggregation> {
  const languageMap = new Map<string, LanguageAggregation>();

  for (const repo of repositories) {
    // Skip repos with no languages
    if (repo.languages.edges.length === 0) continue;

    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      const size = edge.size;
      const color = edge.node.color;
      // Use owner/name as unique repo identifier
      const repoId = repo.owner?.login ? `${repo.owner.login}/${repo.name}` : repo.name;

      const current = languageMap.get(name) ?? {
        bytes: 0,
        repos: new Set<string>(),
        color: color, // color is optional
      };

      current.bytes += size;
      current.repos.add(repoId);
      // Only set color if not already set and color is present
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
 * @param options - Optional settings
 * @param options.includeForks - Include forked repositories (default: false)
 * @param options.includePrivate - Include private repositories (default: false)
 * @returns Language statistics ordered by percentage (high to low)
 *
 * @example
 * ```typescript
 * // Simple usage - just get languages and percentages (public, non-fork repos only)
 * const stats = await fetchLanguageStats('octocat', process.env.GITHUB_TOKEN);
 * stats.languages.forEach(lang => {
 *   console.log(`${lang.language}: ${lang.percentage.toFixed(1)}%`);
 * });
 *
 * // Include everything (forks + private repos)
 * const allStats = await fetchLanguageStats('octocat', token, {
 *   includeForks: true,
 *   includePrivate: true
 * });
 * ```
 */
export async function fetchLanguageStats(
  username: string,
  token: string,
  options: { includeForks?: boolean; includePrivate?: boolean } = {},
): Promise<LanguageStatsResult> {
  // Fetch all repositories with pagination
  const { repositories } = await fetchAllRepositories(
    username,
    token,
    options,
  );

  // Aggregate language data (only repos with languages)
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
      totalRepos: repositories.length, // Filtered count
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
    totalRepos: repositories.length, // Filtered count
  };
}

/**
 * Gets the top N languages by usage percentage
 *
 * @param username - GitHub username
 * @param token - GitHub OAuth token or Personal Access Token
 * @param limit - Number of top languages to return (default: 10)
 * @param options - Optional settings for filtering repos
 * @returns Top N languages ordered by percentage
 *
 * @example
 * ```typescript
 * // Get top 5 languages (public, non-fork repos)
 * const topSkills = await getTopLanguages('octocat', process.env.GITHUB_TOKEN, 5);
 * topSkills.forEach(skill => {
 *   console.log(`${skill.language}: ${skill.percentage.toFixed(1)}%`);
 * });
 * ```
 */
export async function getTopLanguages(
  username: string,
  token: string,
  limit = 10,
  options: { includeForks?: boolean; includePrivate?: boolean } = {},
): Promise<LanguageStats[]> {
  const stats = await fetchLanguageStats(username, token, options);
  return stats.languages.slice(0, limit);
}
