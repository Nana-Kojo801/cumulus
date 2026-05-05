<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Cumulus. Here's a summary of all changes made:

**SDK setup:** `posthog-js` and `@posthog/react` were installed. PostHog is initialized in `src/main.tsx` with the `PostHogProvider` wrapping the entire app. Environment variables `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` were added to `.env.local`.

**User identification:** `src/components/layout/AppShell.tsx` now identifies users via PostHog when Clerk authentication loads, passing the Clerk user ID, email, and name. PostHog is reset on sign-out.

**Event tracking:** 12 events added across 6 files covering the core user journey — Canvas onboarding, course management, grade entry, and GPA forecasting.

| Event | Description | File |
|-------|-------------|------|
| `canvas_connected` | User successfully connects Canvas LMS during onboarding | `src/screens/OnboardingScreen.tsx` |
| `canvas_import_completed` | User confirms and completes Canvas course import during onboarding | `src/screens/OnboardingScreen.tsx` |
| `onboarding_skipped` | User skips Canvas setup during onboarding | `src/screens/OnboardingScreen.tsx` |
| `canvas_sync_started` | User starts a Canvas sync from Settings | `src/screens/CanvasSyncPreview.tsx` |
| `canvas_sync_completed` | User successfully completes a Canvas sync from Settings | `src/screens/CanvasSyncPreview.tsx` |
| `course_created` | User creates a new course | `src/screens/CourseEdit.tsx` |
| `course_updated` | User edits and saves an existing course | `src/screens/CourseEdit.tsx` |
| `criterion_added` | User adds a new evaluation criterion to a course | `src/components/modals/CriterionModal.tsx` |
| `criterion_updated` | User edits an existing evaluation criterion | `src/components/modals/CriterionModal.tsx` |
| `criterion_deleted` | User deletes an evaluation criterion and its score entries | `src/screens/CourseDetail.tsx` |
| `scores_saved` | User saves score entries for a criterion | `src/components/modals/ScoreEntryModal.tsx` |
| `gpa_forecast_viewed` | User opens the "What score do I need?" GPA forecast tool | `src/screens/CourseDetail.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1546054)
- [Course & Criterion Creation](/insights/B2wcX6WT) — Tracks how often users create courses and add criteria over time
- [Onboarding: Canvas Setup Funnel](/insights/832iEvcs) — Conversion rate from Canvas connect → import completed
- [Onboarding: Canvas Connect vs Skip](/insights/OPvOhaCD) — How many users complete vs skip Canvas setup
- [Score Entry Activity](/insights/8n4FwRGJ) — Frequency of score entry sessions
- [GPA Forecast Tool Engagement](/insights/GwWs3edN) — Usage of the "What score do I need?" feature

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
