import type {
  LanguageStats,
  LanguageStatsResult,
  RepoCounts,
} from "../types/languages.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

interface GitHubLanguageResponse {
  data?: {
    viewer?: {
      login: string;
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
            pageInfo?: {
              hasNextPage: boolean;
              endCursor: string | null;
            };
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

interface GitHubRepoLanguagesResponse {
  data?: {
    repository?: {
      languages: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        edges: Array<{
          size: number;
          node: {
            name: string;
            color?: string;
          };
        }>;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
}

type LanguageEdge = {
  size: number;
  node: {
    name: string;
    color?: string;
  };
};

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
): Promise<{
  repositories: Array<{
    name: string;
    owner: { login: string };
    isFork: boolean;
    isPrivate: boolean;
    languages: {
      pageInfo?: { hasNextPage: boolean; endCursor: string | null };
      edges: LanguageEdge[];
    };
  }>;
}> {
  const repositories: Array<{
    name: string;
    owner: { login: string };
    isFork: boolean;
    isPrivate: boolean;
    languages: {
      pageInfo?: { hasNextPage: boolean; endCursor: string | null };
      edges: LanguageEdge[];
    };
  }> = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  const query = `
    query ViewerRepoLanguages($cursor: String) {
      viewer {
        login
        repositories(
          first: 100
          after: $cursor
          ownerAffiliations: OWNER
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
            languages(first: 100, orderBy: { field: SIZE, direction: DESC }) {
              pageInfo {
                hasNextPage
                endCursor
              }
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
    const result: GitHubLanguageResponse =
      await postGraphQL<GitHubLanguageResponse>(token, query, {
        cursor,
      });

    assertNoGraphQLErrors(result.errors);

    if (!result.data?.viewer?.repositories) {
      throw new Error(
        "No repositories found or insufficient permissions for the authenticated user.",
      );
    }

    if (result.data.viewer.login !== username) {
      throw new Error(
        `Authenticated user is "${result.data.viewer.login}" but requested "${username}". Use your own username to access private repos.`,
      );
    }

    const repos: NonNullable<
      NonNullable<GitHubLanguageResponse["data"]>["viewer"]
    >["repositories"] = result.data.viewer.repositories;

    // totalCount removed

    repositories.push(...repos.nodes);

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;

    // Optional: log rate limit info for debugging if needed
  }

  await enrichRepositoriesWithAllLanguages(repositories, token);

  return { repositories };
}

async function postGraphQL<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "@nuwan-dev/github-stats",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function assertNoGraphQLErrors(errors?: Array<{ message: string }>): void {
  if (!Array.isArray(errors) || errors.length === 0) return;

  const forbidden = errors.find((e) =>
    e.message?.toLowerCase().includes("forbidden"),
  );
  if (forbidden) {
    throw new Error(
      `GitHub API permission error: Your token may lack required scopes or access. (${forbidden.message})`,
    );
  }

  throw new Error(`GitHub GraphQL Error: ${errors[0]?.message}`);
}

async function enrichRepositoriesWithAllLanguages(
  repositories: Array<{
    name: string;
    owner: { login: string };
    languages: {
      pageInfo?: { hasNextPage: boolean; endCursor: string | null };
      edges: LanguageEdge[];
    };
  }>,
  token: string,
): Promise<void> {
  const repoLanguagesQuery = `
    query RepoLanguages($owner: String!, $name: String!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        languages(first: 100, after: $cursor, orderBy: { field: SIZE, direction: DESC }) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
  `;

  for (const repo of repositories) {
    if (!repo.languages.pageInfo?.hasNextPage) continue;

    const extraEdges = await fetchRemainingRepoLanguages(
      repo.owner.login,
      repo.name,
      repo.languages.pageInfo.endCursor,
      token,
      repoLanguagesQuery,
    );

    repo.languages.edges.push(...extraEdges);
  }
}

async function fetchRemainingRepoLanguages(
  owner: string,
  name: string,
  cursor: string | null,
  token: string,
  query: string,
): Promise<LanguageEdge[]> {
  const edges: LanguageEdge[] = [];
  let langCursor: string | null = cursor;
  let langHasNext = true;

  while (langHasNext) {
    const result = await postGraphQL<GitHubRepoLanguagesResponse>(
      token,
      query,
      {
        owner,
        name,
        cursor: langCursor,
      },
    );

    assertNoGraphQLErrors(result.errors);

    const languages = result.data?.repository?.languages;
    if (!languages) break;

    edges.push(...languages.edges);
    langHasNext = languages.pageInfo.hasNextPage;
    langCursor = languages.pageInfo.endCursor;
  }

  return edges;
}

function getRepoCounts(
  repositories: Array<{ isFork: boolean; isPrivate: boolean }>,
): RepoCounts {
  const total = repositories.length;
  const forks = repositories.filter((repo) => repo.isFork).length;
  const privateCount = repositories.filter((repo) => repo.isPrivate).length;
  const publicCount = total - privateCount;

  return {
    total,
    public: publicCount,
    private: privateCount,
    forks,
    nonForks: total - forks,
  };
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
      const repoId = repo.owner?.login
        ? `${repo.owner.login}/${repo.name}`
        : repo.name;

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
  const { includeForks = false, includePrivate = false } = options;

  // Fetch all repositories with pagination (unfiltered)
  const { repositories } = await fetchAllRepositories(username, token);

  const repoCounts = getRepoCounts(repositories);

  // Filter based on options (default: public, non-fork)
  const filteredRepositories = repositories.filter((repo) => {
    if (!includeForks && repo.isFork) return false;
    if (!includePrivate && repo.isPrivate) return false;
    return true;
  });

  const filteredRepoCounts = getRepoCounts(filteredRepositories);

  // Aggregate language data (only repos with languages)
  const languageMap = aggregateLanguageStats(filteredRepositories);

  // Calculate total bytes
  const totalBytes = [...languageMap.values()].reduce(
    (sum, lang) => sum + lang.bytes,
    0,
  );

  if (totalBytes === 0) {
    return {
      languages: [],
      languageStats: [],
      totalBytes: 0,
      bytesTotal: 0,
      totalRepos: filteredRepositories.length,
      reposTotal: filteredRepositories.length,
      repoCounts,
      reposAll: repoCounts,
      filteredRepoCounts,
      reposFiltered: filteredRepoCounts,
    };
  }

  // Convert to array and calculate percentages
  const languages: LanguageStats[] = [...languageMap.entries()]
    .map(([name, data]) => ({
      language: name,
      bytes: data.bytes,
      bytesUsed: data.bytes,
      repos: data.repos.size,
      repoCount: data.repos.size,
      percentage: (data.bytes / totalBytes) * 100,
      percent: (data.bytes / totalBytes) * 100,
      color: data.color,
    }))
    // Sort by percentage (high to low)
    .sort((a, b) => b.percentage - a.percentage);

  return {
    languages,
    languageStats: languages,
    totalBytes,
    bytesTotal: totalBytes,
    totalRepos: filteredRepositories.length,
    reposTotal: filteredRepositories.length,
    repoCounts,
    reposAll: repoCounts,
    filteredRepoCounts,
    reposFiltered: filteredRepoCounts,
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
