export interface CourseTemplate {
  name: string;
  code: string;
  credits: number;
  criteria: Array<{ name: string; weight: number; instanceCount: number }>;
}

export function encodeTemplate(template: CourseTemplate): string {
  const json = JSON.stringify(template);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeTemplate(encoded: string): CourseTemplate | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    if (!parsed.name || !Array.isArray(parsed.criteria)) return null;
    return parsed as CourseTemplate;
  } catch {
    return null;
  }
}

export function buildShareUrl(template: CourseTemplate): string {
  const encoded = encodeTemplate(template);
  const base = window.location.origin;
  return `${base}/import?template=${encoded}`;
}
