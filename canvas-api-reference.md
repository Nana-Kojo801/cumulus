# Canvas LMS API — Reference for Cumulus

This document covers everything Claude Code needs to understand about the Canvas LMS REST API to implement the Canvas sync feature in Cumulus. It covers only the endpoints, concepts, and behaviours that are relevant to this app. Nothing else.

---

## What Cumulus Needs from Canvas

A student using Cumulus wants to import their academic data automatically instead of entering it manually. From Canvas, Cumulus needs to fetch:

1. The student's enrolled courses (to create Semesters and Courses in Cumulus)
2. Assignment groups per course (to create Criteria — the weighted evaluation components)
3. Assignments within each group (to create Score Entries — the individual graded items)
4. The student's submission scores for each assignment (to fill in the actual scores)

That's it. Cumulus does not write anything back to Canvas. All operations are read-only.

---

## Base URL and Format

All Canvas API requests follow this pattern:

```
https://<canvas_domain>/api/v1/<endpoint>
```

For Ashesi University, the Canvas domain is `ashesi.instructure.com`, so the base URL is:

```
https://ashesi.instructure.com/api/v1
```

- All responses are JSON
- All IDs are 64-bit integers
- All timestamps are ISO 8601 format in UTC (e.g. `2024-09-01T08:00:00Z`)

---

## Authentication

Canvas uses Bearer token authentication. Every API request must include the student's access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

In Cumulus, the student generates this token manually from their Canvas profile settings page:

```
https://ashesi.instructure.com/profile/settings
```

Under "Approved Integrations", they click **New Access Token**, give it a name ("Cumulus"), optionally set an expiry date, and copy the generated token. Cumulus stores this token in IndexedDB and attaches it to every Canvas API request.

The token grants access to Canvas with the same permissions as the student's own account — so it can only read data the student themselves can see. It cannot access other students' data.

---

## CORS and the Vite Proxy

Canvas does not allow direct browser requests from third-party origins. Attempting to call the Canvas API directly from the Cumulus SPA will be blocked by the browser's CORS policy.

### During Development

Use Vite's built-in proxy to forward requests server-side, bypassing CORS:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/canvas': {
        target: 'https://ashesi.instructure.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/canvas/, ''),
      }
    }
  }
})
```

With this config, a request from the app to `/canvas/api/v1/courses` is forwarded to `https://ashesi.instructure.com/api/v1/courses` by Vite's dev server — no CORS issue.

### In Production

Vite's proxy only runs during development. In production, requests must go through a real proxy server — a Cloudflare Worker is the recommended approach (free, ~20 lines of code, no server to maintain).

### Handling Both Environments

Use an environment variable to switch between the two:

```typescript
// src/lib/canvas/client.ts
const CANVAS_BASE = import.meta.env.DEV
  ? '/canvas'
  : import.meta.env.VITE_CANVAS_PROXY_URL

// All Canvas API calls use CANVAS_BASE as their prefix
```

In `.env.development`, `VITE_CANVAS_PROXY_URL` is not needed (Vite proxy handles it).
In `.env.production`, set `VITE_CANVAS_PROXY_URL=https://your-worker.workers.dev`.

---

## Pagination

Canvas paginates all list endpoints. A response that contains more items than the page size (default: 10, max: 100) will include a `Link` header with the URL for the next page:

```
Link: <https://ashesi.instructure.com/api/v1/courses?page=2&per_page=50>; rel="next",
      <https://ashesi.instructure.com/api/v1/courses?page=1&per_page=50>; rel="first"
```

When `rel="next"` is absent from the `Link` header, you have reached the last page.

Always request the maximum page size to minimise round trips:

```
?per_page=100
```

### Pagination Helper

The `rel="next"` URLs in the `Link` header are absolute Canvas URLs (`https://ashesi.instructure.com/...`). They must be rewritten to go through the proxy before being fetched. Define `proxyUrl` first so the fetch helper can use it:

```typescript
// Rewrite absolute Canvas URLs to go through the proxy
function proxyUrl(absoluteUrl: string): string {
  if (import.meta.env.DEV) {
    const url = new URL(absoluteUrl);
    return `/canvas${url.pathname}${url.search}`;
  }
  return absoluteUrl.replace('https://ashesi.instructure.com', import.meta.env.VITE_CANVAS_PROXY_URL);
}
```

Implement a single reusable function that handles pagination for all Canvas requests:

```typescript
async function canvasFetchAll<T>(
  path: string,
  token: string
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${CANVAS_BASE}${path}${path.includes('?') ? '&' : '?'}per_page=100`;

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new CanvasApiError(response.status, await response.text());
    }

    const data: T[] = await response.json();
    results.push(...data);

    // Parse the Link header; rewrite the absolute URL through the proxy
    const linkHeader = response.headers.get('Link') ?? '';
    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? proxyUrl(nextMatch[1]) : null;
  }

  return results;
}
```

---

## Rate Limiting

Canvas rate-limits API calls per token. Every response includes an `X-Rate-Limit-Remaining` header. For Cumulus's use case (syncing once per session, not polling), rate limits will not be a practical concern. No special handling is required beyond basic error handling for `429 Too Many Requests`.

---

## Error Handling

| HTTP Status | Meaning | Action |
|---|---|---|
| `401 Unauthorized` | Token is invalid or expired | Prompt student to re-enter their token |
| `403 Forbidden` | Student doesn't have permission to access this resource | Skip and continue |
| `404 Not Found` | Resource doesn't exist | Skip and continue |
| `429 Too Many Requests` | Rate limit hit | Wait 1 second and retry |
| `500+` | Canvas server error | Show error, allow retry |

---

## The Endpoints Cumulus Uses

### 1. Get Current User

Used to verify the token is valid and retrieve the student's name and ID on first connection.

```
GET /api/v1/users/self
```

**Response fields used by Cumulus:**

```json
{
  "id": 12345,
  "name": "Nana Kojo Mensah",
  "short_name": "Nana Kojo",
  "login_id": "nkojo@ashesi.edu.gh"
}
```

**Use:** Confirm the token works and display the student's name in the Canvas connection settings screen.

---

### 2. Get Enrolled Courses

Fetches all courses the student is enrolled in as a student.

```
GET /api/v1/courses?enrollment_type=student&enrollment_state=active&include[]=term&include[]=total_scores&state[]=available&state[]=completed
```

**Query parameters:**

| Parameter | Value | Purpose |
|---|---|---|
| `enrollment_type` | `student` | Only return courses where the user is a student, not a teacher or TA |
| `enrollment_state` | `active` | Only active enrollments (not dropped/rejected) |
| `include[]=term` | — | Include the academic term object so Cumulus can group courses into semesters |
| `include[]=total_scores` | — | Include the student's current score in each course |
| `state[]=available` | — | Include currently running courses |
| `state[]=completed` | — | Include concluded/past courses so past semesters can be imported |

**Response fields used by Cumulus:**

```json
{
  "id": 98765,
  "name": "Database Systems",
  "course_code": "CS 311",
  "workflow_state": "available",
  "start_at": "2025-01-15T00:00:00Z",
  "end_at": "2025-05-30T00:00:00Z",
  "term": {
    "id": 4,
    "name": "Year 2 Semester 2",
    "start_at": "2025-01-15T00:00:00Z",
    "end_at": "2025-05-30T00:00:00Z"
  },
  "enrollments": [
    {
      "type": "student",
      "enrollment_state": "active",
      "computed_current_score": 83.4,
      "computed_final_score": 79.1,
      "computed_current_grade": "B+",
      "computed_final_grade": "B"
    }
  ]
}
```

**Mapping to Cumulus:**

| Canvas field | Cumulus field |
|---|---|
| `name` | `Course.name` |
| `course_code` | `Course.code` |
| `term.name` | Used to group courses into `Semester.name` |
| `term.id` | Used to group courses into a `Semester` |
| `term.start_at` | Used to determine semester year and term number |

**Important note on credit hours:** Canvas does not reliably expose credit hours in a standard field accessible to students. The `credits` field exists in some Canvas configurations but is not guaranteed. Cumulus should default credit hours to 3 and let the student adjust them after import.

---

### 3. Get Assignment Groups for a Course

Assignment groups in Canvas are the direct equivalent of Cumulus's Criteria. A course might have groups like "Quizzes (20%)", "Midterm Exam (30%)", "Final Exam (40%)", "Lab Work (10%)". Each group has a weight and contains individual assignments.

```
GET /api/v1/courses/:course_id/assignment_groups?include[]=assignments&include[]=submission
```

**Query parameters:**

| Parameter | Value | Purpose |
|---|---|---|
| `include[]=assignments` | — | Include the list of assignments within each group |
| `include[]=submission` | — | Include the student's own submission data for each assignment |

**Response fields used by Cumulus:**

```json
[
  {
    "id": 111,
    "name": "Quizzes",
    "group_weight": 20.0,
    "assignments": [
      {
        "id": 5001,
        "name": "Quiz 1",
        "points_possible": 20.0,
        "due_at": "2025-02-10T23:59:00Z",
        "workflow_state": "published",
        "submission": {
          "score": 17.0,
          "grade": "17",
          "submitted_at": "2025-02-10T14:30:00Z",
          "workflow_state": "graded",
          "missing": false,
          "late": false
        }
      },
      {
        "id": 5002,
        "name": "Quiz 2",
        "points_possible": 20.0,
        "due_at": "2025-03-01T23:59:00Z",
        "workflow_state": "published",
        "submission": {
          "score": null,
          "grade": null,
          "submitted_at": null,
          "workflow_state": "unsubmitted",
          "missing": false,
          "late": false
        }
      }
    ]
  },
  {
    "id": 112,
    "name": "Final Exam",
    "group_weight": 40.0,
    "assignments": [
      {
        "id": 5010,
        "name": "Final Examination",
        "points_possible": 100.0,
        "due_at": "2025-05-20T23:59:00Z",
        "workflow_state": "published",
        "submission": {
          "score": null,
          "grade": null,
          "submitted_at": null,
          "workflow_state": "unsubmitted"
        }
      }
    ]
  }
]
```

**Mapping to Cumulus:**

| Canvas field | Cumulus field |
|---|---|
| `assignment_group.name` | `Criterion.name` |
| `assignment_group.group_weight` | `Criterion.weight` |
| `assignment.name` | `ScoreEntry.label` |
| `assignment.points_possible` | `ScoreEntry.total` |
| `submission.score` | `ScoreEntry.score` (null if not yet graded) |

**Important notes:**

- `group_weight` is only meaningful when the course has **Weighted Assignment Groups** enabled. If the course doesn't use weighting, all `group_weight` values will be `0`. Cumulus must detect this and warn the student — see the "Detecting Unweighted Courses" section below.
- A submission with `workflow_state: "unsubmitted"` or `score: null` (and `excused: false`) means the assessment hasn't been graded yet. Map this to `ScoreEntry.score = null` (pending).
- A submission with `excused: true` means the instructor has excused the student from this assignment — it does not count toward their grade. **Skip it entirely** (do not create a ScoreEntry).
- A submission with `workflow_state: "graded"` and `score: 0.0` means the student received a zero. A grader giving an explicit zero sets `score: 0.0`, not `null`. Do not conflate this with `score: null`.
- A submission with `workflow_state: "graded"` and `score: null` is rare and almost always indicates an excused assignment — check `excused: true` and skip. Do not treat it as `score: 0`.
- Assignments with `workflow_state` other than `"published"` (e.g. `"deleted"`, `"unpublished"`) should be skipped.
- Canvas assignment groups support optional **drop rules** (e.g. drop the lowest N scores). These affect Canvas's own grade calculation but Cumulus does not replicate them — all assignments are imported. If a course uses drop rules, Cumulus's calculated running grade may differ slightly from Canvas's `current_score`. This is expected and acceptable.

---

### 4. Get Enrollments (for current course grade)

Used to fetch the student's current overall grade in a course, as a cross-check against Cumulus's own calculation.

```
GET /api/v1/courses/:course_id/enrollments?user_id=self&include[]=current_points
```

**Response fields used by Cumulus:**

```json
[
  {
    "id": 99001,
    "course_id": 98765,
    "type": "StudentEnrollment",
    "grades": {
      "current_score": 83.4,
      "current_grade": "B+",
      "final_score": 79.1,
      "final_grade": "B"
    }
  }
]
```

**Meaning of grade fields:**

| Field | Meaning |
|---|---|
| `current_score` | Student's score based only on graded assignments (ignores ungraded work) |
| `final_score` | Student's score treating all ungraded assignments as 0 |
| `current_grade` | Letter grade equivalent of `current_score` using the course's grading scheme |
| `final_grade` | Letter grade equivalent of `final_score` |

Cumulus shows `current_score` as the "grade so far" — equivalent to its own `courseRunningGrade` calculation.

This endpoint is optional if assignment group data with submissions is already fetched (Cumulus calculates grades itself). It's useful as a sanity check during the sync preview step.

---

## Detecting Unweighted Courses

Not all Canvas courses use weighted assignment groups. When a course does not have weighting enabled, all `group_weight` values come back as `0`. If Cumulus blindly imports these, every criterion would have 0% weight, which is meaningless.

**How to detect it:**

After fetching assignment groups, check if the total weight sums to approximately 100:

```typescript
function courseIsWeighted(groups: AssignmentGroup[]): boolean {
  const totalWeight = groups.reduce((sum, g) => sum + (g.group_weight ?? 0), 0);
  return Math.abs(totalWeight - 100) < 1; // allow for minor float imprecision
}
```

If `courseIsWeighted` returns false, Cumulus should:
1. Still import the course and its assignments with their scores
2. Leave criterion weights as 0 (or distribute equally as a default)
3. Show a warning in the sync preview: "This course doesn't use weighted grading groups in Canvas. You'll need to set criterion weights manually."

---

## Data Mapping — Full Picture

Here is how the full Canvas data model maps to Cumulus's data model:

**Schema extension required:** The fields marked `(store for re-sync)` below do not exist in the current Cumulus schema. Before implementing Canvas sync, add a new Dexie version to `schema.ts` that adds `canvasId` to `courses`, `canvasGroupId` to `criteria`, and `canvasAssignmentId` to `scoreEntries`. Index `canvasId` and `canvasAssignmentId` for fast lookup during re-sync. Also add `manuallyEdited: boolean` to `ScoreEntry` (see Re-sync Behaviour).

```
Canvas                          Cumulus
──────────────────────────────────────────────────────
Term                        →   Semester
  term.name                 →     semester.name
  term.id                   →     semester.id (external ref)
  term.start_at             →     Used to derive semester.year and semester.term

Course                      →   Course
  course.name               →     course.name
  course.course_code        →     course.code
  course.id                 →     course.canvasId  ← new field, index it
  (not available reliably)  →     course.credits  ← student sets manually (default 3)

AssignmentGroup             →   Criterion
  group.name                →     criterion.name
  group.group_weight        →     criterion.weight
  group.id                  →     criterion.canvasGroupId  ← new field
  group.assignments.length  →     criterion.instanceCount

Assignment + Submission     →   ScoreEntry
  assignment.name           →     scoreEntry.label
  assignment.points_possible→     scoreEntry.total
  submission.score          →     scoreEntry.score (null if ungraded; skip if excused)
  assignment.id             →     scoreEntry.canvasAssignmentId  ← new field, index it
```

---

## The Sync Flow

This is the recommended sequence of API calls and UI steps for the Canvas import feature in Cumulus.

### Step 1 — Verify token

```
GET /api/v1/users/self
```

If this returns 401, the token is invalid. Show an error and ask the student to re-enter the token.

### Step 2 — Fetch all courses

```
GET /api/v1/courses?enrollment_type=student&enrollment_state=active&include[]=term&include[]=total_scores&state[]=available&state[]=completed&per_page=100
```

Group courses by `term.id` to build the list of semesters.

### Step 3 — For each course, fetch assignment groups with submissions

```
GET /api/v1/courses/:course_id/assignment_groups?include[]=assignments&include[]=submission&per_page=100
```

This is the most important call. It returns everything Cumulus needs — the criterion structure, the weights, the individual assignments, and the student's scores — in a single request per course.

Run these in parallel (e.g. `Promise.all`) across all courses to keep the sync fast. With 5–6 courses, this is 5–6 parallel requests, completing in roughly one round trip.

### Step 4 — Show a sync preview

Before writing anything to IndexedDB, show the student a preview of what will be imported:
- List of semesters and courses detected
- For each course: the criteria found, the weights, how many assignments are scored vs pending
- Warnings for any courses where weights don't sum to 100
- A field to set credit hours for each course (defaulting to 3)
- Checkboxes to deselect courses they don't want imported

### Step 5 — Write to IndexedDB

Only after the student confirms the preview, write the mapped data to Dexie. If a course already exists in Cumulus (matched by `canvasId`), offer to merge (update scores only) or replace.

### Step 6 — Store the token and canvas domain

Store both in IndexedDB so subsequent syncs don't require re-entry:

```typescript
interface CanvasConnection {
  domain: string;       // e.g. "ashesi.instructure.com"
  token: string;        // the personal access token
  connectedAt: number;  // timestamp
  studentName: string;  // from /users/self
  studentId: number;    // from /users/self
}
```

---

## Re-sync Behaviour

After the initial import, students can re-sync to pull in new scores. The re-sync should:

1. Fetch assignment groups with submissions again for each course
2. Update `ScoreEntry.score` for any entries where `submission.score` has changed
3. Add new score entries for any new assignments added since the last sync
4. Never overwrite scores that the student has manually edited in Cumulus (track a `manuallyEdited: boolean` flag on ScoreEntry)
5. Never delete courses, criteria, or score entries that were manually created in Cumulus

---

## What Canvas Cannot Provide

These are limitations to communicate clearly in the Cumulus UI:

| What Cumulus needs | Canvas status |
|---|---|
| Credit hours per course | Not reliably available to students via API. Must be set manually. |
| Ashesi-specific grade scale | Canvas uses its own grading schemes per course. Ignore Canvas grades — Cumulus applies the Ashesi scale to raw scores itself. |
| Semester year/term number | Only the term name is available. Ashesi uses the pattern `"Year X Semester Y"` consistently — parse it with: `termName.match(/Year\s+(\d+)\s+Semester\s+(\d+)/i)`. If the match fails (e.g. summer term or exchange programme), fall back to prompting the student. |
| Assignment group weights for unweighted courses | Not available. Student must set weights manually. |

---

## Sample API Client Structure

```typescript
// src/lib/canvas/client.ts

const CANVAS_BASE = import.meta.env.DEV
  ? '/canvas'
  : import.meta.env.VITE_CANVAS_PROXY_URL;

class CanvasApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function canvasGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${CANVAS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new CanvasApiError(response.status, response.statusText);
  return response.json();
}

async function canvasFetchAll<T>(path: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${CANVAS_BASE}${path}${path.includes('?') ? '&' : '?'}per_page=100`;

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new CanvasApiError(response.status, response.statusText);
    results.push(...(await response.json() as T[]));

    const link = response.headers.get('Link') ?? '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    // Rewrite absolute Canvas URL to go through proxy
    url = next ? next.replace('https://ashesi.instructure.com', CANVAS_BASE) : null;
  }

  return results;
}

// Exported API methods
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
```

---

## TypeScript Types

```typescript
interface CanvasUser {
  id: number;
  name: string;
  short_name: string;
  login_id: string;
}

interface CanvasTerm {
  id: number;
  name: string;
  start_at: string | null;
  end_at: string | null;
}

interface CanvasEnrollment {
  type: string;
  enrollment_state: string;
  computed_current_score: number | null;
  computed_final_score: number | null;
  computed_current_grade: string | null;
  computed_final_grade: string | null;
}

interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  start_at: string | null;
  end_at: string | null;
  term: CanvasTerm | null;
  enrollments: CanvasEnrollment[];
}

interface CanvasSubmission {
  score: number | null;
  grade: string | null;
  submitted_at: string | null;
  workflow_state: 'submitted' | 'unsubmitted' | 'graded' | 'pending_review';
  missing: boolean;
  late: boolean;
  excused: boolean;
}

interface CanvasAssignment {
  id: number;
  name: string;
  points_possible: number;
  due_at: string | null;
  workflow_state: string;
  submission: CanvasSubmission | null;
}

interface CanvasAssignmentGroup {
  id: number;
  name: string;
  group_weight: number;
  assignments: CanvasAssignment[];
}
```