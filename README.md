# @nuwan-dev/github-stats

---

## 🆕 v2.0.0: Tailwind v4 Migration & Compiled Styles

- **Breaking:** Styles are no longer injected automatically. **You must add:**

  ```js
  import "@nuwan-dev/github-stats/style.css";
  ```

  to your root file (e.g., `index.js`, `main.tsx`, or `_app.tsx`) to ensure the component is styled correctly.

---

> Typed SDK and React component to fetch and render GitHub contribution calendars — stable, composable, production-ready.

[![npm version](https://img.shields.io/npm/v/@nuwan-dev/github-stats.svg)](https://www.npmjs.com/package/@nuwan-dev/github-stats)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🔍 Fetch** user's GitHub contribution calendar via official GraphQL API
- **🎨 Render** a beautiful, responsive, GitHub-style heatmap in React
- **📘 Typed** Full TypeScript support with strict type safety
- **📱 Responsive** Works perfectly on mobile, tablet, and desktop
- **🌗 Dark Mode** Built-in dark mode support
- **⚡ Modern** React 18+, Next.js ready
- **🎯 Zero Dependencies** (except peer deps: React for UI component)
- **🔧 Customizable** Bring your own styles or use the defaults

---

## 📦 Installation

```bash
npm install @nuwan-dev/github-stats
# or
yarn add @nuwan-dev/github-stats
# or
pnpm add @nuwan-dev/github-stats
```

---

## 🚀 Quick Start

### 0. Import Styles (Required)

Before using the component, import the compiled CSS at the root of your project:

```js
import "@nuwan-dev/github-stats/style.css";
```

### 1. Fetch Calendar Data (Node.js/API)

```typescript
import { fetchContributionCalendar } from "@nuwan-dev/github-stats";

// Get a GitHub Personal Access Token with 'read:user' scope
const calendar = await fetchContributionCalendar(
  "your-username",
  process.env.GITHUB_TOKEN,
);
// from and to are now optional! Defaults to last 12 months

console.log(`Total: ${calendar.total} contributions`);
console.log(`Weeks: ${calendar.weeks.length}`);
```

> **DX Improvement:** `from` and `to` are now optional. If omitted, the calendar defaults to the last 12 months.

### 2. Render in React

```tsx
import { ContributionGraph } from "@nuwan-dev/github-stats";

export default function GitHubStats({ calendar }) {
  return <ContributionGraph calendar={calendar} />;
}
```

### 3. Complete Example (Next.js App Router)

```tsx
// app/github-stats/page.tsx
import {
  fetchContributionCalendar,
  ContributionGraph,
} from "@nuwan-dev/github-stats";

export default async function GitHubStatsPage() {
  const calendar = await fetchContributionCalendar(
    "your-username",
    process.env.GITHUB_TOKEN!,
  );
  // from and to are now optional! Defaults to last 12 months

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">My GitHub Activity</h1>
      <ContributionGraph
        calendar={calendar}
        yearLabel={new Date().getFullYear()}
        totalLabel={`${calendar.total.toLocaleString()} contributions this year`}
      />
    </div>
  );
}
```

### 4. Client-Side Example (Next)

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  fetchContributionCalendar,
  ContributionGraph,
} from "@nuwan-dev/github-stats";

export default function GitHubStats() {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchContributionCalendar(
          "nuwandev", // GitHub username
          "YOUR_TOKEN", // ⚠️ Never expose tokens in client-side code!
        );
        // from and to are now optional! Defaults to last 12 months
        setCalendar(data);
      } catch (error) {
        console.error("Failed to load contributions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading contributions...</div>;
  if (!calendar) return <div>Failed to load contributions</div>;

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

## 📚 API Reference

### `fetchContributionCalendar(username, token, from?, to?)`

Fetches contribution data from GitHub's GraphQL API.

**Parameters:**

- `username` (string): GitHub username
- `token` (string): GitHub Personal Access Token with `read:user` scope
- `from` (Date, optional): Start date for contributions (defaults to 12 months ago)
- `to` (Date, optional): End date for contributions (defaults to today)

**Returns:** `Promise<ContributionCalendar>`

```typescript
interface ContributionCalendar {
  weeks: ContributionWeek[];
  total: number;
}

interface ContributionWeek {
  days: ContributionDay[];
}

interface ContributionDay {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number; // Number of contributions
  level: number; // 0-4 (intensity level)
}
```

### `<ContributionGraph />` Component

**Props:**

- `calendar` (ContributionCalendar, required): Contribution data from API
- `yearLabel` (string | number, optional): Label to display (e.g., "2025")
- `totalLabel` (string, optional): Summary text (e.g., "592 contributions")
- `className` (string, optional): Additional CSS classes

**Example:**

Recommended (auto-generated labels):

```tsx
// Shows: "Last 12 months" and "592 contributions in the last year"
<ContributionGraph calendar={data} />
```

Custom labels:

```tsx
// For specific year range
<ContributionGraph
  calendar={data}
  yearLabel="2025-2026"
  totalLabel={`${data.total} contributions`}
  className="custom-class"
/>
```

---

## 🔐 Getting a GitHub Token for Testing

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scope: `read:user`
4. Generate and copy the token
5. Store securely in environment variables (`.env.local`):

```bash
   GITHUB_TOKEN=ghp_your_token_here
```

⚠️ **Security Note:** Never expose tokens in client-side code! Use server-side rendering or API routes.

---

## 🎨 Styling & Customization

The component uses Tailwind CSS classes and supports dark mode out of the box. You can customize:

### Color Levels

The component uses GitHub's official color scheme:

- Level 0: `#161b22` (no contributions)
- Level 1: `#0e4429` (low)
- Level 2: `#006d32` (medium-low)
- Level 3: `#26a641` (medium-high)
- Level 4: `#39d353` (high)

### Custom Styling

Pass custom classes via `className` prop:

```tsx
<ContributionGraph calendar={data} className="my-custom-border shadow-2xl" />
```

---

## 🔄 Level Calculation

Contribution levels (0-4) are calculated as:

- `0`: No contributions
- `1`: 1-2 contributions
- `2`: 3-5 contributions
- `3`: 6-10 contributions
- `4`: 10+ contributions

This matches GitHub's display logic for consistency.

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/nuwandev/github-stats.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

**Requirements:**

- Node.js 18+
- React 18+ (peer dependency for UI component)
- TypeScript 5+

---

## 📝 Examples

Check out the [examples directory](./examples) for:

- Next.js App Router example
- Next.js Pages Router example
- Vite + React example
- Node.js CLI tool example

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © [nuwan-dev](https://github.com/nuwandev)

---

## 🙏 Acknowledgments

- Inspired by GitHub's contribution graph
- Built with TypeScript, React, and Tailwind CSS
- Uses GitHub's official GraphQL API

---

## 📞 Support

- 🐛 [Report a bug](https://github.com/nuwandev/github-stats/issues)
- 💡 [Request a feature](https://github.com/nuwandev/github-stats/issues)
- 📧 [Email support](mailto:your-email@example.com)

---

**Made with ❤️ by [nuwan-dev](https://github.com/nuwandev)**
