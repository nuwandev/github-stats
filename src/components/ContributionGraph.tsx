import { fetchContributionCalendar } from "../api/contributions.js";
import { ContributionGraphView } from "./ContributionGraphView.js";
import type { ContributionCalendar } from "../types/calendar.js";

export type ContributionGraphProps = {
  className?: string;
  yearLabel?: string;
  totalLabel?: string;
} & (
  | { calendar: ContributionCalendar; username?: never; githubToken?: never }
  | { calendar?: never; username: string; githubToken: string }
);

export async function ContributionGraph(props: ContributionGraphProps) {
  const { calendar, username, githubToken, ...rest } = props;

  let data = calendar;

  if (!data && username && githubToken) {
    data = await fetchContributionCalendar(username, githubToken);
  }

  if (!data) {
    return (
      <div className="text-red-500">Error: Missing data or credentials.</div>
    );
  }

  return <ContributionGraphView calendar={data} {...rest} />;
}
