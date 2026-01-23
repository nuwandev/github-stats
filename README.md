# @nuwan-dev/github-stats

> A lightweight TypeScript library and React component for rendering GitHub contribution graphs.

[![npm version](https://img.shields.io/npm/v/@nuwan-dev/github-stats.svg)](https://www.npmjs.com/package/@nuwan-dev/github-stats)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Fetch and render beautiful GitHub contribution calendars with full TypeScript support. Works with Next.js, Vite, and any React framework.

---

## Installation

```bash
npm install @nuwan-dev/github-stats
```

---

## Getting Started

### Step 1: Import the CSS

Add this **once** in your app's entry point:

```tsx
// index.tsx, main.tsx, or _app.tsx
import "@nuwan-dev/github-stats/style.css";
```

### Step 2: Get a GitHub Token

You need a GitHub Personal Access Token to fetch contribution data:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Select scope: **`read:user`**
4. Copy the token and save it in `.env.local`:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

### Step 3: Choose Your Usage Method

There are **two ways** to use this library:

---

## Usage Methods

### Method 1: Auto-Fetch (Easiest)

Let the component fetch the data automatically:

```tsx
import { ContributionGraph } from "@nuwan-dev/github-stats";

export default function Page() {
  return (
    <ContributionGraph
      username="nuwandev"
      githubToken={process.env.GITHUB_TOKEN}
    />
  );
}
```

**When to use:** Simple use cases, server components, when you don't need to manipulate the data.

---

### Method 2: Manual Fetch (More Control)

Fetch the data yourself and pass it to the component:

```tsx
import {
  fetchContributionCalendar,
  ContributionGraph,
} from "@nuwan-dev/github-stats";
import { useEffect, useState } from "react";

export default function Page() {
  const [calendar, setCalendar] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchContributionCalendar(
        "nuwandev",
        process.env.NEXT_PUBLIC_GITHUB_TOKEN,
      );
      setCalendar(data);
    }
    loadData();
  }, []);

  if (!calendar) return <div>Loading...</div>;

  return <ContributionGraph calendar={calendar} />;
}
```

**When to use:** Client-side fetching, custom date ranges, data manipulation, caching.

---

## API Reference

### `<ContributionGraph />`

The main component for rendering contribution graphs.

#### Props (Auto-Fetch Mode)

| Prop          | Type             | Required | Description                |
| ------------- | ---------------- | -------- | -------------------------- |
| `username`    | `string`         | ✅       | GitHub username            |
| `githubToken` | `string`         | ✅       | GitHub token (`read:user`) |
| `yearLabel`   | `string\|number` | ❌       | Custom header label        |
| `totalLabel`  | `string`         | ❌       | Custom footer text         |
| `className`   | `string`         | ❌       | Additional CSS classes     |

```tsx
<ContributionGraph
  username="nuwandev"
  githubToken={process.env.GITHUB_TOKEN}
  yearLabel="2025"
  totalLabel="592 contributions this year"
/>
```

#### Props (Manual Fetch Mode)

| Prop         | Type                   | Required | Description            |
| ------------ | ---------------------- | -------- | ---------------------- |
| `calendar`   | `ContributionCalendar` | ✅       | Calendar data object   |
| `yearLabel`  | `string\|number`       | ❌       | Custom header label    |
| `totalLabel` | `string`               | ❌       | Custom footer text     |
| `className`  | `string`               | ❌       | Additional CSS classes |

```tsx
<ContributionGraph
  calendar={calendarData}
  yearLabel="Last 12 months"
  className="rounded-lg shadow-xl"
/>
```

---

### `fetchContributionCalendar()`

Fetch GitHub contribution data programmatically.

```typescript
fetchContributionCalendar(
  username: string,
  token: string,
  start?: Date,
  end?: Date
): Promise<ContributionCalendar>
```

#### Parameters

| Parameter  | Type     | Required | Default    | Description                  |
| ---------- | -------- | -------- | ---------- | ---------------------------- |
| `username` | `string` | ✅       | -          | GitHub username              |
| `token`    | `string` | ✅       | -          | GitHub Personal Access Token |
| `start`    | `Date`   | ❌       | 1 year ago | Start date for contributions |
| `end`      | `Date`   | ❌       | Today      | End date for contributions   |

#### Example

```tsx
// Fetch last 12 months (default)
const calendar = await fetchContributionCalendar("nuwandev", token);

// Fetch specific date range
const calendar = await fetchContributionCalendar(
  "nuwandev",
  token,
  new Date("2024-01-01"),
  new Date("2024-12-31"),
);
```

#### Return Type

```typescript
interface ContributionCalendar {
  weeks: ContributionWeek[];
  total: number;
}

interface ContributionWeek {
  days: ContributionDay[];
}

interface ContributionDay {
  date: string; // ISO format: "2025-01-23"
  count: number; // Number of contributions
  level: number; // 0-4 (color intensity)
}
```

---

## Framework Examples

### Next.js App Router (Server Component)

```tsx
// app/page.tsx
import "@nuwan-dev/github-stats/style.css";
import { ContributionGraph } from "@nuwan-dev/github-stats";

export default function Home() {
  return (
    <main className="p-8">
      <h1>My GitHub Activity</h1>
      <ContributionGraph
        username="nuwandev"
        githubToken={process.env.GITHUB_TOKEN!}
      />
    </main>
  );
}
```

### Next.js Pages Router (SSR)

```tsx
// pages/index.tsx
import "@nuwan-dev/github-stats/style.css";
import {
  ContributionGraph,
  fetchContributionCalendar,
} from "@nuwan-dev/github-stats";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  const calendar = await fetchContributionCalendar(
    "nuwandev",
    process.env.GITHUB_TOKEN!,
  );
  return { props: { calendar } };
};

export default function Home({ calendar }) {
  return <ContributionGraph calendar={calendar} />;
}
```

### Vite + React (Client-Side)

```tsx
// src/main.tsx
import "@nuwan-dev/github-stats/style.css";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

```tsx
// src/App.tsx
import {
  fetchContributionCalendar,
  ContributionGraph,
} from "@nuwan-dev/github-stats";
import { useEffect, useState } from "react";

export default function App() {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributionCalendar("nuwandev", import.meta.env.VITE_GITHUB_TOKEN)
      .then(setCalendar)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading contributions...</div>;
  if (!calendar) return <div>Failed to load</div>;

  return <ContributionGraph calendar={calendar} />;
}
```

---

## Customization

### Custom Date Range

```tsx
const lastMonth = await fetchContributionCalendar(
  "nuwandev",
  token,
  new Date("2025-01-01"),
  new Date("2025-01-31"),
);

<ContributionGraph calendar={lastMonth} yearLabel="January 2025" />;
```

### Custom Labels

```tsx
<ContributionGraph
  username="nuwandev"
  githubToken={token}
  yearLabel={new Date().getFullYear()}
  totalLabel="Keep coding! 🚀"
/>
```

### Custom Styling

```tsx
<ContributionGraph
  username="nuwandev"
  githubToken={token}
  className="border-2 border-green-500 rounded-xl p-6 shadow-2xl"
/>
```

### Contribution Level Colors

The graph uses GitHub's official color palette:

| Level | Contributions | Color (Hex) | Description |
| ----- | ------------- | ----------- | ----------- |
| 0     | 0             | `#161b22`   | None        |
| 1     | 1-2           | `#0e4429`   | Low         |
| 2     | 3-5           | `#006d32`   | Medium      |
| 3     | 6-10          | `#26a641`   | High        |
| 4     | 10+           | `#39d353`   | Very High   |

---

## Security Best Practices

⚠️ **Never expose GitHub tokens in client-side code!**

### ✅ Good Practices

- Use environment variables (`.env.local`)
- Use server-side rendering (Next.js App Router, SSR)
- Use API routes to proxy requests
- Store tokens in secure backend services

### ❌ Bad Practices

- Hardcoding tokens in source code
- Exposing tokens in client-side JavaScript
- Committing tokens to version control
- Using `NEXT_PUBLIC_` prefix for tokens

---

## Troubleshooting

### Error: "Missing data or credentials"

Make sure you're either:

- Passing both `username` AND `githubToken`, OR
- Passing a `calendar` object

```tsx
// ❌ Wrong - missing githubToken
<ContributionGraph username="nuwandev" />

// ✅ Correct
<ContributionGraph username="nuwandev" githubToken={token} />
```

### Styles not appearing

Make sure you imported the CSS:

```tsx
import "@nuwan-dev/github-stats/style.css";
```

### "Start date must be before end date"

Check your date range in `fetchContributionCalendar`:

```tsx
// ❌ Wrong - start after end
await fetchContributionCalendar(
  user,
  token,
  new Date("2025-12-31"),
  new Date("2025-01-01"),
);

// ✅ Correct
await fetchContributionCalendar(
  user,
  token,
  new Date("2025-01-01"),
  new Date("2025-12-31"),
);
```

---

## TypeScript Support

All types are exported for your convenience:

```typescript
import type {
  ContributionCalendar,
  ContributionWeek,
  ContributionDay,
  ContributionGraphProps,
} from "@nuwan-dev/github-stats";
```

---

## Migration from v1.x

### Breaking Changes in v2.0.0

Styles are no longer auto-injected. Add this import:

```tsx
import "@nuwan-dev/github-stats/style.css";
```

**Why?** Better performance, Tailwind v4 support, smaller bundle size.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT © [nuwan-dev](https://github.com/nuwandev)

---

## Links

- 🐛 [Report Issues](https://github.com/nuwandev/github-stats/issues)
- 💬 [Discussions](https://github.com/nuwandev/github-stats/discussions)
- 📦 [npm Package](https://www.npmjs.com/package/@nuwan-dev/github-stats)

---

**Made with ❤️ by [nuwan-dev](https://github.com/nuwandev)**
