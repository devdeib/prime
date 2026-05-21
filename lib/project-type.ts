export const PROJECT_TYPES = ["residential", "commercial"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export function normalizeProjectType(value: unknown): ProjectType {
  return value === "commercial" ? "commercial" : "residential";
}

export function projectTypeLabel(
  type: ProjectType,
  language: string
): string {
  if (language === "ar") {
    return type === "commercial" ? "تجاري" : "سكني";
  }
  return type === "commercial" ? "Commercial" : "Residential";
}
