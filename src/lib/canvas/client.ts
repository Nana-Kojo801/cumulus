import type { CanvasUser, CanvasCourse, CanvasAssignmentGroup } from './types';

const CANVAS_BASE = import.meta.env.DEV
  ? '/canvas'
  : import.meta.env.VITE_CANVAS_PROXY_URL;

export class CanvasApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'CanvasApiError';
  }
}

function proxyUrl(absoluteUrl: string): string {
  if (import.meta.env.DEV) {
    const url = new URL(absoluteUrl);
    return `/canvas${url.pathname}${url.search}`;
  }
  return absoluteUrl.replace('https://ashesi.instructure.com', import.meta.env.VITE_CANVAS_PROXY_URL);
}

async function canvasGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${CANVAS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new CanvasApiError(response.status, response.statusText);
  }
  return response.json();
}

async function canvasFetchAll<T>(path: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${CANVAS_BASE}${path}${path.includes('?') ? '&' : '?'}per_page=100`;

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new CanvasApiError(response.status, response.statusText);
    }
    results.push(...(await response.json() as T[]));

    const link = response.headers.get('Link') ?? '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    url = next ? proxyUrl(next) : null;
  }

  return results;
}

export const canvasApi = {
  getUser: (token: string) =>
    canvasGet<CanvasUser>('/api/v1/users/self', token),

  getCourses: (token: string) =>
    canvasFetchAll<CanvasCourse>(
      '/api/v1/courses?enrollment_type=student&enrollment_state=active&include[]=term&include[]=total_scores&state[]=available&state[]=completed',
      token
    ),

  getAssignmentGroups: (courseId: number, token: string) =>
    canvasFetchAll<CanvasAssignmentGroup>(
      `/api/v1/courses/${courseId}/assignment_groups?include[]=assignments&include[]=submission`,
      token
    ),
};
