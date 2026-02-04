import type { ContributionCalendar } from "../types/calendar.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

interface GitHubRawResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              date: string;
              contributionCount: number;
              color?: string;
            }>;
          }>;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

type RawCalendar = {
  weeks?: Array<{
    contributionDays: Array<{
      date: string;
      contributionCount: number;
      color?: string;
    }>;
  }>;
};

function mapCalendar(raw: RawCalendar): ContributionCalendar {
  let total = 0;
  const weeks = (raw.weeks ?? []).map((week) => ({
    days: week.contributionDays.map((day) => {
      const count = day.contributionCount;
      total += count;

      let level: number;
      if (count === 0) level = 0;
      else if (count <= 2) level = 1;
      else if (count <= 5) level = 2;
      else if (count <= 10) level = 3;
      else level = 4;

      return {
        date: day.date,
        count,
        level,
        color: day.color,
      };
    }),
  }));
  return { weeks, total };
}

export async function fetchContributionCalendar(
  username: string,
  token: string,
  start?: Date,
  end?: Date,
): Promise<ContributionCalendar> {
  const to = end ? new Date(end) : new Date();
  const from = start
    ? new Date(start)
    : new Date(new Date(to).setFullYear(to.getFullYear() - 1));

  if (from > to) throw new Error("Start date must be before end date");

  const query = `
    query getContributions($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "@nuwan-dev/github-stats",
    },
    body: JSON.stringify({
      query,
      variables: { username, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  const result: GitHubRawResponse = await response.json();

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    throw new Error(`GitHub GraphQL Error: ${result.errors[0]?.message}`);
  }

  const rawCalendar =
    result.data?.user?.contributionsCollection?.contributionCalendar;
  if (!rawCalendar) {
    throw new Error(
      `User "${username}" not found or has no contribution data.`,
    );
  }

  return mapCalendar(rawCalendar);
}
