// Runs Lighthouse accessibility audits across the key pages and writes HTML
// reports to lighthouse-reports/ (used as evidence in the video walkthrough).
//
// Usage: npm run lighthouse   (the app must already be running on port 3000)

import { mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? "http://localhost:3000";
const chromePath = process.env.CHROME_PATH;
const outputDir = "lighthouse-reports";

const routes = [
  ["home", "/"],
  ["activities", "/activities"],
  ["wordle", "/wordle"],
  ["wordsearch", "/wordsearch"],
  ["dashboard", "/dashboard"],
];

const cli = join(process.cwd(), "node_modules", "lighthouse", "cli", "index.js");
if (!existsSync(cli)) {
  console.error("Lighthouse is not installed. Run: npm install");
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

let failures = 0;
for (const [name, route] of routes) {
  const url = `${baseUrl}${route}`;
  process.stdout.write(`Auditing ${url} ... `);

  const result = spawnSync(
    process.execPath,
    [
      cli,
      url,
      "--only-categories=accessibility",
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
      "--output=html",
      `--output-path=${join(outputDir, `${name}.html`)}`,
      "--quiet",
    ],
    {
      stdio: ["ignore", "ignore", "inherit"],
      env: chromePath ? { ...process.env, CHROME_PATH: chromePath } : process.env,
    },
  );

  if (result.status === 0) {
    console.log("done");
  } else {
    failures += 1;
    console.log("failed");
  }
}

const reportPath = join(outputDir, "dashboard.html");
console.log(`\nReports written to ${outputDir}/`);
console.log(`Open ${reportPath} to view the dashboard accessibility score.`);

process.exitCode = failures > 0 ? 1 : 0;
