import type { EvidenceEntry, ScoreBreakdown } from "./scoring/types";

export type RoleRequirement = {
  id: string;
  label: string;
  category: "language" | "framework" | "practice" | "domain";
  weight: number;
  keywords: string[];
};

export type RoleFitEvidence = {
  repoFullName: string;
  primaryLanguage: string | null;
  commits: number;
  mergedPrs: number;
  stars: number;
  scoreEvidenceWeight: number;
  matchedSignals: string[];
};

export type RoleFitRequirementResult = {
  requirement: RoleRequirement;
  score: number;
  strengths: RoleFitEvidence[];
  gap: boolean;
  remediation: string;
};

export type RoleFitReport = {
  fitScore: number;
  requirements: RoleFitRequirementResult[];
  verifiedStrengths: RoleFitRequirementResult[];
  gaps: RoleFitRequirementResult[];
  summary: {
    totalRequirements: number;
    verifiedRequirements: number;
    gapCount: number;
    topLanguages: string[];
  };
};

const REQUIREMENT_CATALOG: Array<Omit<RoleRequirement, "id" | "weight">> = [
  {
    label: "TypeScript",
    category: "language",
    keywords: ["typescript", "ts", "next", "next.js", "nextjs", "react"],
  },
  {
    label: "JavaScript",
    category: "language",
    keywords: ["javascript", "node", "node.js"],
  },
  {
    label: "Python",
    category: "language",
    keywords: ["python", "django", "fastapi", "flask"],
  },
  {
    label: "Go",
    category: "language",
    keywords: ["go", "golang"],
  },
  {
    label: "Rust",
    category: "language",
    keywords: ["rust"],
  },
  {
    label: "Frontend product engineering",
    category: "framework",
    keywords: ["frontend", "react", "next", "next.js", "nextjs", "ui", "ux"],
  },
  {
    label: "Backend/API engineering",
    category: "framework",
    keywords: ["backend", "api", "server", "database", "db", "worker", "cloudflare"],
  },
  {
    label: "Testing discipline",
    category: "practice",
    keywords: ["test", "testing", "vitest", "jest", "playwright", "qa"],
  },
  {
    label: "CI and release hygiene",
    category: "practice",
    keywords: ["ci", "github actions", "deployment", "deploy", "release", "devops"],
  },
  {
    label: "Documentation",
    category: "practice",
    keywords: ["documentation", "docs", "readme", "technical writing"],
  },
  {
    label: "Open-source collaboration",
    category: "domain",
    keywords: ["open source", "oss", "pull request", "pr", "collaboration", "maintainer"],
  },
];

const STOPWORDS = new Set([
  "and",
  "are",
  "for",
  "the",
  "with",
  "you",
  "our",
  "that",
  "this",
  "will",
  "from",
  "have",
  "has",
  "into",
  "using",
  "build",
  "work",
  "team",
  "role",
]);

export function extractRoleRequirements(jobDescription: string): RoleRequirement[] {
  const normalized = normalize(jobDescription);
  const requirements: RoleRequirement[] = [];

  for (const item of REQUIREMENT_CATALOG) {
    const matched = item.keywords.filter((keyword) => normalized.includes(normalize(keyword)));
    if (matched.length === 0) continue;
    requirements.push({
      ...item,
      id: slugify(item.label),
      weight: item.category === "language" ? 1.15 : 1,
      keywords: Array.from(new Set(item.keywords.map(normalize))),
    });
  }

  const extraKeywords = extractExtraKeywords(normalized);
  for (const keyword of extraKeywords) {
    if (requirements.some((requirement) => requirement.keywords.includes(keyword))) continue;
    requirements.push({
      id: slugify(keyword),
      label: toTitle(keyword),
      category: "domain",
      weight: 0.7,
      keywords: [keyword],
    });
  }

  return requirements.slice(0, 12);
}

export function buildRoleFitReport(params: {
  jobDescription: string;
  score: Pick<ScoreBreakdown, "languages">;
  evidence: EvidenceEntry[];
}): RoleFitReport {
  const requirements = extractRoleRequirements(params.jobDescription);
  const results = requirements.map((requirement) =>
    matchRequirement(requirement, params.evidence, params.score.languages),
  );
  const totalWeight = results.reduce((sum, result) => sum + result.requirement.weight, 0);
  const weighted = results.reduce(
    (sum, result) => sum + result.score * result.requirement.weight,
    0,
  );
  const fitScore = totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;

  return {
    fitScore,
    requirements: results,
    verifiedStrengths: results.filter((result) => !result.gap),
    gaps: results.filter((result) => result.gap),
    summary: {
      totalRequirements: results.length,
      verifiedRequirements: results.filter((result) => !result.gap).length,
      gapCount: results.filter((result) => result.gap).length,
      topLanguages: params.score.languages.slice(0, 4).map((language) => language.language),
    },
  };
}

export function serializePublicRoleFitReport(report: RoleFitReport): RoleFitReport {
  return {
    ...report,
    requirements: report.requirements.map(serializeResult),
    verifiedStrengths: report.verifiedStrengths.map(serializeResult),
    gaps: report.gaps.map(serializeResult),
  };
}

function matchRequirement(
  requirement: RoleRequirement,
  evidence: EvidenceEntry[],
  languages: ScoreBreakdown["languages"],
): RoleFitRequirementResult {
  const strengths = evidence
    .map((entry) => matchEvidence(entry, requirement))
    .filter((entry): entry is RoleFitEvidence => entry !== null)
    .sort((a, b) => b.scoreEvidenceWeight - a.scoreEvidenceWeight)
    .slice(0, 4);

  const languageHit = languages.find((language) =>
    requirement.keywords.some((keyword) => normalize(language.language) === normalize(keyword)),
  );
  const baseScore = strengths.reduce((sum, item) => sum + item.scoreEvidenceWeight, 0);
  const languageScore = languageHit ? Math.min(35, Math.round(languageHit.share * 100)) : 0;
  const score = Math.min(100, Math.round(baseScore + languageScore));

  return {
    requirement,
    score,
    strengths,
    gap: score < 35,
    remediation: buildRemediation(requirement, score),
  };
}

function matchEvidence(entry: EvidenceEntry, requirement: RoleRequirement): RoleFitEvidence | null {
  const haystack = normalize(
    [
      entry.repoFullName,
      entry.primaryLanguage ?? "",
      ...(entry.craftTags ?? []),
      entry.isAuthor ? "authored maintainer owner" : "pull request collaboration",
    ].join(" "),
  );
  const matchedSignals = requirement.keywords.filter((keyword) => haystack.includes(normalize(keyword)));
  if (matchedSignals.length === 0) return null;

  return {
    repoFullName: entry.repoFullName,
    primaryLanguage: entry.primaryLanguage,
    commits: entry.commits,
    mergedPrs: entry.mergedPrs,
    stars: entry.stars,
    scoreEvidenceWeight: Math.min(70, Math.round(entry.weight / 2 + matchedSignals.length * 8)),
    matchedSignals,
  };
}

function buildRemediation(requirement: RoleRequirement, score: number) {
  if (score >= 70) return "Keep this proof fresh with recent commits and visible releases.";
  if (score >= 35) return `Add clearer README, tests, or recent commits that mention ${requirement.label}.`;
  return `Create or update a public repo that directly demonstrates ${requirement.label}, with tests, CI, and a short README.`;
}

function serializeResult(result: RoleFitRequirementResult): RoleFitRequirementResult {
  return {
    ...result,
    strengths: result.strengths.map((strength) => ({
      ...strength,
      scoreEvidenceWeight: Math.round(strength.scoreEvidenceWeight),
    })),
  };
}

function extractExtraKeywords(normalized: string) {
  const words = normalized
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
