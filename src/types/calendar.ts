export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}
export interface ContributionWeek {
  days: ContributionDay[];
}
export interface ContributionCalendar {
  weeks: ContributionWeek[];
  total: number;
}
