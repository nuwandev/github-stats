# @nuwan-dev/github-stats

> A powerful TypeScript library for GitHub analytics - fetch contribution calendars, analyze language statistics, and build beautiful developer profiles.

[![npm version](https://img.shields.io/npm/v/@nuwan-dev/github-stats.svg)](https://www.npmjs.com/package/@nuwan-dev/github-stats)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

Build comprehensive GitHub profiles with contribution graphs and programming language insights. Perfect for portfolios, dashboards, and developer analytics.

---

## ✨ Features

- 📅 **Contribution Calendars** - Beautiful GitHub-style contribution graphs with React components
- 🎨 **Language Statistics** - Analyze programming languages, skills, and expertise levels
- ⚡ **High Performance** - GraphQL-based API with smart pagination and caching
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🎨 **Customizable** - Flexible styling, custom date ranges, and label overrides
- 🚀 **Framework Agnostic** - Works with Next.js, Vite, React, and any TypeScript project

---

## 📦 Installation

```bash
npm install @nuwan-dev/github-stats
```

---

## 🚀 Quick Start

### 1. Get a GitHub Token

You need a GitHub Personal Access Token:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Select scope: **`read:user`** and **`repo`**
4. Save in `.env.local`:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

### 2. Choose Your Feature

```tsx
import {
  ContributionGraph, // React component for graphs
  fetchContributionCalendar, // API for contribution data
  fetchLanguageStats, // API for language analysis
  getTopLanguages, // Helper for top N languages
} from "@nuwan-dev/github-stats";

// For React components
import "@nuwan-dev/github-stats/style.css";
```

---

## 📊 Feature 1: Contribution Calendars

Beautiful, GitHub-style contribution graphs as React components.

### Auto-Fetch Mode (Easiest)

```tsx
import { ContributionGraph } from "@nuwan-dev/github-stats";
import "@nuwan-dev/github-stats/style.css";

export default function Page() {
  return (
    <ContributionGraph
      username="nuwandev"
      githubToken={process.env.GITHUB_TOKEN}
    />
  );
}
```

### Manual Fetch Mode (More Control)

```tsx
import {
  fetchContributionCalendar,
  ContributionGraph,
} from "@nuwan-dev/github-stats";

const calendar = await fetchContributionCalendar("nuwandev", token);

<ContributionGraph
  calendar={calendar}
  yearLabel="2025"
  totalLabel="Keep coding! 🚀"
/>;
```

### Custom Date Ranges

```tsx
const lastQuarter = await fetchContributionCalendar(
  "nuwandev",
  token,
  new Date("2024-10-01"),
  new Date("2024-12-31"),
);

<ContributionGraph calendar={lastQuarter} yearLabel="Q4 2024" />;
```

### API Reference

#### `<ContributionGraph />` Props

| Prop          | Type                   | Required        | Description            |
| ------------- | ---------------------- | --------------- | ---------------------- |
| `username`    | `string`               | ✅ (auto-fetch) | GitHub username        |
| `githubToken` | `string`               | ✅ (auto-fetch) | GitHub token           |
| `calendar`    | `ContributionCalendar` | ✅ (manual)     | Calendar data          |
| `yearLabel`   | `string \| number`     | ❌              | Custom header label    |
| `totalLabel`  | `string`               | ❌              | Custom footer text     |
| `className`   | `string`               | ❌              | Additional CSS classes |

#### `fetchContributionCalendar()`

```typescript
fetchContributionCalendar(
  username: string,
  token: string,
  start?: Date,    // Default: 1 year ago
  end?: Date       // Default: today
): Promise<ContributionCalendar>
```

**Returns:**

```typescript
interface ContributionCalendar {
  weeks: ContributionWeek[];
  total: number;
}

interface ContributionDay {
  date: string; // ISO format: "2025-01-23"
  count: number; // Number of contributions
  level: number; // 0-4 (color intensity)
  color?: string; // GitHub's color
}
```

---

## 🎯 Feature 2: Language Statistics

Analyze programming languages and skills from GitHub repositories.

### Basic Usage

```typescript
import { fetchLanguageStats } from "@nuwan-dev/github-stats";

const stats = await fetchLanguageStats("nuwandev", token);

console.log(stats);
// {
//   languages: [
//     {
//       language: 'TypeScript',
//       bytes: 1234567,
//       repos: 42,
//       percentage: 45.2,
//       color: '#3178c6'
//     },
//     { language: 'JavaScript', bytes: 987654, repos: 38, percentage: 36.1, ... },
//     ...
//   ],
//   totalBytes: 2734567,
//   totalRepos: 95
// }
```

### Get Top Languages

```typescript
import { getTopLanguages } from "@nuwan-dev/github-stats";

const topSkills = await getTopLanguages("nuwandev", token, 5);

topSkills.forEach((skill, i) => {
  console.log(`${i + 1}. ${skill.language} - ${skill.percentage.toFixed(1)}%`);
});
// 1. TypeScript - 45.2%
// 2. JavaScript - 36.1%
// 3. Python - 16.7%
// 4. Go - 1.5%
// 5. Rust - 0.5%
```

### Build a Skills Profile

```typescript
const stats = await fetchLanguageStats("username", token);

const profile = {
  // Most used language
  primarySkill: stats.languages[0],

  // Expert level (>15% of codebase)
  expertise: stats.languages.filter((l) => l.percentage > 15),

  // Proficient (5-15%)
  proficient: stats.languages.filter(
    (l) => l.percentage >= 5 && l.percentage <= 15,
  ),

  // Familiar (<5%)
  familiar: stats.languages.filter((l) => l.percentage < 5),

  // Metrics
  diversity: stats.languages.length,
  totalProjects: stats.totalRepos,
  linesOfCode: Math.round(stats.totalBytes / 50), // Rough estimate
};
```

### Generate Badges for README

```typescript
const stats = await fetchLanguageStats("username", token);

const badges = stats.languages.slice(0, 5).map((lang) => {
  const color = lang.color?.replace("#", "") || "blue";
  return `https://img.shields.io/badge/${lang.language}-${lang.percentage.toFixed(1)}%25-${color}`;
});

// Use in your GitHub README:
// ![TypeScript](https://img.shields.io/badge/TypeScript-45.2%25-3178c6)
```

### Compare Multiple Developers

```typescript
async function compareSkills(users: string[], token: string) {
  const results = await Promise.all(
    users.map((user) => fetchLanguageStats(user, token)),
  );

  return results.map((stats, i) => ({
    username: users[i],
    primaryLanguage: stats.languages[0]?.language,
    languageCount: stats.languages.length,
    totalRepos: stats.totalRepos,
    topSkills: stats.languages.slice(0, 3).map((l) => l.language),
  }));
}

const comparison = await compareSkills(["user1", "user2", "user3"], token);
```

### API Reference

#### `fetchLanguageStats()`

```typescript
fetchLanguageStats(
  username: string,
  token: string
): Promise<LanguageStatsResult>
```

**Returns:**

```typescript
interface LanguageStatsResult {
  languages: LanguageStats[]; // Sorted by percentage (high to low)
  totalBytes: number; // Total code across all languages
  totalRepos: number; // Repositories analyzed
}

interface LanguageStats {
  language: string; // "TypeScript", "JavaScript", etc.
  bytes: number; // Total bytes of code
  repos: number; // Number of repos using this language
  percentage: number; // Percentage of total codebase (0-100)
  color?: string; // GitHub's official color (#hex)
}
```

#### `getTopLanguages()`

```typescript
getTopLanguages(
  username: string,
  token: string,
  limit?: number  // Default: 10
): Promise<LanguageStats[]>
```

---

## 🎨 Complete Examples

### Developer Portfolio Dashboard

```tsx
import {
  fetchContributionCalendar,
  fetchLanguageStats,
  ContributionGraph,
} from "@nuwan-dev/github-stats";
import "@nuwan-dev/github-stats/style.css";

export default async function Portfolio() {
  const username = "nuwandev";
  const token = process.env.GITHUB_TOKEN!;

  // Fetch all data in parallel
  const [contributions, languages] = await Promise.all([
    fetchContributionCalendar(username, token),
    fetchLanguageStats(username, token),
  ]);

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div>
        <h1>@{username}</h1>
        <p>{contributions.total} contributions this year</p>
        <p>Primary language: {languages.languages[0]?.language}</p>
      </div>

      {/* Contribution Graph */}
      <ContributionGraph
        calendar={contributions}
        yearLabel={new Date().getFullYear()}
      />

      {/* Top Skills */}
      <div>
        <h2>Top Skills</h2>
        {languages.languages.slice(0, 5).map((lang) => (
          <div key={lang.language}>
            <span>{lang.language}</span>
            <span>{lang.percentage.toFixed(1)}%</span>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${lang.percentage}%`,
                backgroundColor: lang.color,
              }}
            />
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h3>Total Repos</h3>
          <p>{languages.totalRepos}</p>
        </div>
        <div>
          <h3>Languages</h3>
          <p>{languages.languages.length}</p>
        </div>
        <div>
          <h3>Code Size</h3>
          <p>{(languages.totalBytes / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
    </div>
  );
}
```

### Skills Visualization Component

```tsx
import { fetchLanguageStats } from "@nuwan-dev/github-stats";
import { useEffect, useState } from "react";

export function SkillsChart({ username, token }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchLanguageStats(username, token).then(setStats);
  }, [username, token]);

  if (!stats) return <div>Loading skills...</div>;

  return (
    <div className="space-y-4">
      <h2>Language Distribution</h2>

      {/* Pie chart or bar chart */}
      {stats.languages.map((lang) => (
        <div key={lang.language} className="flex items-center gap-4">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: lang.color }}
          />
          <span className="flex-1">{lang.language}</span>
          <span className="font-mono">{lang.percentage.toFixed(1)}%</span>
          <span className="text-sm text-gray-500">{lang.repos} repos</span>
        </div>
      ))}

      <div className="text-sm text-gray-600">
        Total: {stats.totalRepos} repositories, {stats.languages.length}{" "}
        languages
      </div>
    </div>
  );
}
```

### API Route (Next.js)

```typescript
// app/api/github-stats/route.ts
import {
  fetchContributionCalendar,
  fetchLanguageStats,
} from "@nuwan-dev/github-stats";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const token = process.env.GITHUB_TOKEN!;

    const [contributions, languages] = await Promise.all([
      fetchContributionCalendar(username, token),
      fetchLanguageStats(username, token),
    ]);

    return NextResponse.json({
      username,
      contributions: {
        total: contributions.total,
        weeks: contributions.weeks.length,
      },
      languages: {
        primary: languages.languages[0],
        top5: languages.languages.slice(0, 5),
        total: languages.languages.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch GitHub stats" },
      { status: 500 },
    );
  }
}
```

---

## 🎯 Framework Integration

### Next.js App Router (Server Component)

```tsx
// app/page.tsx
import "@nuwan-dev/github-stats/style.css";
import { ContributionGraph, fetchLanguageStats } from "@nuwan-dev/github-stats";

export default async function Page() {
  const stats = await fetchLanguageStats("nuwandev", process.env.GITHUB_TOKEN!);

  return (
    <main>
      <ContributionGraph
        username="nuwandev"
        githubToken={process.env.GITHUB_TOKEN!}
      />

      <div className="mt-8">
        <h2>Primary Skills</h2>
        {stats.languages.slice(0, 5).map((lang) => (
          <div key={lang.language}>
            {lang.language}: {lang.percentage.toFixed(1)}%
          </div>
        ))}
      </div>
    </main>
  );
}
```

### Next.js Pages Router (SSR)

```tsx
// pages/profile.tsx
import type { GetServerSideProps } from "next";
import {
  fetchContributionCalendar,
  fetchLanguageStats,
} from "@nuwan-dev/github-stats";

export const getServerSideProps: GetServerSideProps = async () => {
  const token = process.env.GITHUB_TOKEN!;
  const [contributions, languages] = await Promise.all([
    fetchContributionCalendar("nuwandev", token),
    fetchLanguageStats("nuwandev", token),
  ]);

  return { props: { contributions, languages } };
};

export default function Profile({ contributions, languages }) {
  return (
    <div>
      <h1>GitHub Profile</h1>
      <p>{contributions.total} contributions</p>
      <p>Top language: {languages.languages[0]?.language}</p>
    </div>
  );
}
```

### Vite + React (Client-Side)

```tsx
// src/App.tsx
import { useEffect, useState } from "react";
import { fetchLanguageStats, ContributionGraph } from "@nuwan-dev/github-stats";
import "@nuwan-dev/github-stats/style.css";

export default function App() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchLanguageStats("nuwandev", import.meta.env.VITE_GITHUB_TOKEN)
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div>
      <ContributionGraph
        username="nuwandev"
        githubToken={import.meta.env.VITE_GITHUB_TOKEN}
      />

      {stats && (
        <div className="mt-8">
          <h2>Skills</h2>
          {stats.languages.slice(0, 5).map((lang) => (
            <div key={lang.language}>{lang.language}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 Security Best Practices

### ✅ DO

- Store tokens in environment variables (`.env.local`)
- Use server-side rendering (Next.js App Router, SSR)
- Create API routes to proxy GitHub requests
- Use server-only tokens (`GITHUB_TOKEN`, not `NEXT_PUBLIC_*`)

### ❌ DON'T

- Hardcode tokens in source code
- Expose tokens in client-side JavaScript
- Commit tokens to version control
- Use `NEXT_PUBLIC_` prefix for GitHub tokens

### Example: Secure API Route

```typescript
// app/api/stats/route.ts - Server only
import { fetchLanguageStats } from "@nuwan-dev/github-stats";

export async function GET(request: Request) {
  const token = process.env.GITHUB_TOKEN; // Server-side only
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  const stats = await fetchLanguageStats(username!, token!);
  return Response.json(stats);
}
```

```tsx
// app/page.tsx - Client
"use client";

async function getStats(username: string) {
  const res = await fetch(`/api/stats?username=${username}`);
  return res.json();
}
```

---

## ⚙️ Advanced Configuration

### Custom Contribution Colors

The library uses GitHub's official color palette. To customize:

```css
/* Override in your global CSS */
.contribution-day[data-level="0"] {
  background-color: #161b22;
}
.contribution-day[data-level="1"] {
  background-color: #0e4429;
}
.contribution-day[data-level="2"] {
  background-color: #006d32;
}
.contribution-day[data-level="3"] {
  background-color: #26a641;
}
.contribution-day[data-level="4"] {
  background-color: #39d353;
}
```

### Caching Language Statistics

Language stats don't change frequently. Consider caching:

```typescript
// Example with Redis
import { fetchLanguageStats } from "@nuwan-dev/github-stats";
import redis from "./redis-client";

async function getCachedLanguageStats(username: string, token: string) {
  const cacheKey = `github:lang:${username}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch fresh data
  const stats = await fetchLanguageStats(username, token);

  // Cache for 24 hours
  await redis.setex(cacheKey, 3600 * 24, JSON.stringify(stats));

  return stats;
}
```

### Rate Limiting

GitHub's GraphQL API has a **5,000 cost points per hour** limit:

- Contribution calendar: ~1 point per request
- Language statistics: ~1-5 points per page (~3-5 pages for 300 repos)

You can safely fetch stats for **hundreds of users per hour**.

---

## 🔧 Troubleshooting

### "Missing data or credentials"

Ensure you're providing the required props:

```tsx
// ❌ Wrong - missing token
<ContributionGraph username="nuwandev" />

// ✅ Correct - auto-fetch mode
<ContributionGraph username="nuwandev" githubToken={token} />

// ✅ Correct - manual mode
<ContributionGraph calendar={calendarData} />
```

### Styles not appearing

Import the CSS file:

```tsx
import "@nuwan-dev/github-stats/style.css";
```

### "User not found or has no repositories"

The user may:

- Not exist
- Have no public repositories
- Have only forked repositories (these are excluded)
- Have invalid GitHub token

### TypeScript Errors

Make sure you're importing types:

```typescript
import type {
  ContributionCalendar,
  LanguageStats,
  LanguageStatsResult,
} from "@nuwan-dev/github-stats";
```

---

## 📊 How It Works

### Contribution Calendar

- Uses GitHub's GraphQL API
- Fetches contribution data for specified date range
- Maps contribution counts to color levels (0-4)
- Renders as React component with GitHub-style grid

### Language Statistics

- Queries all user repositories (excludes forks)
- Fetches up to 20 languages per repository
- Aggregates by **bytes of code** (not repo count)
- Calculates percentages across total codebase
- Same algorithm as GitHub's profile language graph

**Why bytes, not repo count?**

- More accurate representation of actual work
- A 1M-line TypeScript project weighs more than a 10-line shell script
- Matches GitHub's official methodology

---

## 📚 TypeScript Support

Full type definitions included:

```typescript
import type {
  // Contribution types
  ContributionCalendar,
  ContributionWeek,
  ContributionDay,
  ContributionGraphProps,

  // Language types
  LanguageStats,
  LanguageStatsResult,
} from "@nuwan-dev/github-stats";
```

---

## 🗺️ Roadmap

- [ ] Organization statistics
- [ ] Pull request metrics
- [ ] Issue tracking analytics
- [ ] Commit frequency analysis
- [ ] Repository star history
- [ ] Follower/following insights
- [ ] Custom graph themes
- [ ] Export to PNG/SVG

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) – see the LICENSE file for details.

---

## 🔗 Links

- 📦 [npm Package](https://www.npmjs.com/package/@nuwan-dev/github-stats)
- 🐛 [Report Issues](https://github.com/nuwandev/github-stats/issues)
- 💬 [Discussions](https://github.com/nuwandev/github-stats/discussions)
- 📖 [Documentation](https://github.com/nuwandev/github-stats#readme)
- 🌟 [Star on GitHub](https://github.com/nuwandev/github-stats)

---

## 🙏 Acknowledgments

- GitHub's GraphQL API for powerful data access
- The open-source community for inspiration and feedback

---

**Made with ❤️ by [nuwan-dev](https://github.com/nuwandev)**

If you find this library useful, please consider giving it a ⭐ on GitHub!
