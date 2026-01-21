import type { ContributionCalendar } from "../types/calendar.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

function mapCalendar(raw: any): ContributionCalendar {
  let total = 0;
  const weeks = (raw.weeks ?? []).map((week: any) => ({
    days: week.contributionDays.map((day: any) => {
      total += day.contributionCount;
      let level: number;
      if (day.contributionCount === 0) {
        level = 0;
      } else if (day.contributionCount > 10) {
        level = 4;
      } else if (day.contributionCount > 5) {
        level = 3;
      } else if (day.contributionCount > 2) {
        level = 2;
      } else {
        level = 1;
      }
      return {
        date: day.date,
        count: day.contributionCount,
        level,
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
  if (start && end && start > end) {
    throw new Error("start date must be before end date");
  }

  const to = end ? new Date(end) : new Date();
  const from = start
    ? new Date(start)
    : new Date(to.getFullYear() - 1, to.getMonth(), to.getDate());

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
                weekday
              }
            }
          }
        }
      }
    }
  `;
  const variables = {
    username,
    from: from.toISOString(),
    to: to.toISOString(),
  };

  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} - ${response.statusText}`,
    );
  }

  const data = await response.json();
  const rawCalendar =
    data?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!rawCalendar) throw new Error("Missing calendar data in API response.");

  return mapCalendar(rawCalendar);
}
