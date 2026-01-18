# @nuwan-dev/github-stats

> Typed SDK and React component to fetch and render GitHub contribution calendars — stable, composable, production-ready.

## Features

- **Fetch** user’s GitHub contribution calendar via official GraphQL API.
- **Render** an accessible, GitHub-style heatmap in React (`ContributionGraph`).
- **Typed** TypeScript data models so your code is always safe and predictable.
- **Optional UI:** Use the fetcher alone in Node/CLI/SSR, or add the React component for dashboard UIs.
- **Zero vendor lock:** CSS and color system customizable.

---

## Install

```sh
npm install @nuwan-dev/github-stats
# or
yarn add @nuwan-dev/github-stats
```

---

## Usage

### Fetch Calendar Data (API/Node/Vanilla)

```ts
import { fetchContributionCalendar } from "@nuwan-dev/github-stats";

// Get an OAuth token from your environment or secret manager!
const calendar = await fetchContributionCalendar(
  "octocat",
  process.env.GITHUB_TOKEN,
  new Date("2025-01-01"),
  new Date(),
);

console.log(calendar.total, calendar.weeks.length);
```

### Render in React

```tsx
import {
  ContributionGraph,
  fetchContributionCalendar,
} from "@nuwan-dev/github-stats";
import { useEffect, useState } from "react";

export default function Demo() {
  const [calendar, setCalendar] = useState();

  useEffect(() => {
    fetchContributionCalendar(
      "octocat",
      MY_TOKEN,
      new Date("2025-01-01"),
      new Date(),
    ).then(setCalendar);
  }, []);

  if (!calendar) return <div>Loading...</div>;
  return (
    <ContributionGraph
      calendar={calendar}
      yearLabel="2025"
      totalLabel={`${calendar.total} contributions`}
    />
  );
}
```

---

## Advanced: Customization

- **Theming/color:** (Coming soon, tracked in [issues](https://github.com/nuwandev/github-stats/issues))
- **Streak helpers:** (Soon—PRs welcome!)

---

## Development

- **Node.js v18+ recommended**
- TypeScript strict mode; peerDependency: React >=18 only for UI parts.
- PRs welcome for features and customizations!

---

## License

MIT © [nuwan-dev](https://github.com/nuwandev)
