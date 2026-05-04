# Clerk + Convex — SPA Integration Reference for Cumulus

This document explains exactly how to integrate Clerk and Convex in a **React SPA (Vite)** context. The previous implementation was done incorrectly using SSR/Next.js patterns. This document is the source of truth — follow it precisely.

---

## The Core Difference: SPA vs SSR

The wrong implementation likely used patterns from `@clerk/nextjs` — including `clerkMiddleware`, server components, `CLERK_SECRET_KEY`, or `'use client'` directives. None of those exist in a Vite SPA.

In a Vite SPA:
- There is no server. No middleware. No server components.
- The correct Clerk package is `@clerk/react`, not `@clerk/nextjs`
- There is no `CLERK_SECRET_KEY` — only the `VITE_CLERK_PUBLISHABLE_KEY`
- Route protection happens entirely on the client using React components and hooks
- The Convex backend validates JWTs using the Clerk issuer domain configured in `convex/auth.config.ts`

---

## Packages

```bash
npm install @clerk/react convex convex/react-clerk
```

The relevant packages and what they provide:

| Package | What it provides |
|---|---|
| `@clerk/react` | `ClerkProvider`, `useSignIn`, `useSignUp`, `useAuth`, `useUser`, `AuthenticateWithRedirectCallback` |
| `convex/react` | `ConvexReactClient`, `useQuery`, `useMutation`, `useConvexAuth`, `Authenticated`, `Unauthenticated`, `AuthLoading` |
| `convex/react-clerk` | `ConvexProviderWithClerk` — the bridge between the two |

---

## Environment Variables

In `.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

There is no `CLERK_SECRET_KEY` in a SPA. That key is only for server-side use. Do not add it.

---

## Step 1 — Convex Backend Auth Config

In `convex/auth.config.ts`, tell Convex to trust JWTs issued by your Clerk instance:

```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // This is your Clerk Frontend API URL / Issuer URL
      // Get it from: Clerk Dashboard → JWT Templates → Convex → Issuer
      // Dev format:  https://verb-noun-00.clerk.accounts.dev
      // Prod format: https://clerk.<your-domain>.com
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

Set `CLERK_JWT_ISSUER_DOMAIN` as an environment variable in the **Convex Dashboard** (not in your `.env` file — this is a server-side Convex env var, not a Vite one).

Run `npx convex dev` after creating this file to sync the config to the backend.

**Important:** In the Clerk Dashboard, you must activate the Convex integration and create a JWT Template named exactly `convex`. The `ConvexProviderWithClerk` fetches a token using this exact name. If the template is named anything else, authentication will silently fail.

---

## Step 2 — Provider Setup in main.tsx

This is the correct provider nesting for a Vite SPA. Do not deviate from this structure.

```typescript
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
);
```

Key rules:
- `ClerkProvider` must be the **outer** wrapper — `ConvexProviderWithClerk` reads from Clerk's context
- `ConvexProviderWithClerk` takes `useAuth` from `@clerk/react` as a prop — this is how it gets Clerk tokens to send to Convex
- The `convex` client is instantiated **once** outside the component tree — do not instantiate it inside a component
- No `'use client'` directive — this is a SPA, not Next.js App Router

---

## Step 3 — Route Protection (SPA pattern)

In a SPA there is no middleware. Route protection is done using Convex's `<Authenticated>`, `<Unauthenticated>`, and `<AuthLoading>` components from `convex/react`.

### The root App component

```typescript
// src/App.tsx
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./screens/AuthPage";
import AppShell from "./components/layout/AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <AuthLoading>
        {/* Shown while Convex is checking the auth token — render a spinner */}
        <FullScreenSpinner />
      </AuthLoading>

      <Unauthenticated>
        {/* Only the auth screen is shown to unauthenticated users */}
        <AuthPage />
      </Unauthenticated>

      <Authenticated>
        {/* All protected app routes go here */}
        <AppShell />
      </Authenticated>
    </BrowserRouter>
  );
}
```

This pattern guarantees:
- Unauthenticated users always see `AuthPage` regardless of which URL they visit
- Authenticated users never see `AuthPage`
- During the brief auth loading state, neither flashes — a spinner is shown instead

### Critical: use `useConvexAuth`, not `useAuth`

When you need to check auth state imperatively (e.g. in a hook or inside a component not wrapped by `<Authenticated>`), always use Convex's hook:

```typescript
// ✅ Correct
import { useConvexAuth } from "convex/react";
const { isAuthenticated, isLoading } = useConvexAuth();

// ❌ Wrong — Clerk's hook doesn't know if Convex has validated the token yet
import { useAuth } from "@clerk/react";
const { isSignedIn } = useAuth();
```

`useConvexAuth` waits until Convex has fetched and validated the auth token from Clerk. `useAuth` only checks Clerk's local session state, which can return `true` before Convex is ready, causing race conditions on queries.

---

## Step 4 — Custom Google Sign-In Button

**There is no SSO callback route. There is no `authenticateWithRedirect`. There is no `<AuthenticateWithRedirectCallback />`.**

The correct approach for a Vite SPA is to use Clerk's `<SignInButton />` component from `@clerk/react` and pass a custom-styled button as its child. Clerk handles the entire OAuth flow internally — the sign-in modal or hosted page, the Google redirect, and the callback — with no extra routes needed in your app.

### Configure Clerk Dashboard first

In your Clerk Dashboard, go to your application's **User & Authentication → Social connections** settings and enable only Google. Disable all other sign-in methods (email/password, phone, etc.). This ensures that when Clerk's sign-in UI appears, it only shows Google — matching Cumulus's single-button design intent.

### The auth screen

```typescript
// src/screens/AuthPage.tsx
import { SignInButton } from "@clerk/react";

export default function AuthPage() {
  return (
    <div className="auth-screen">
      {/* Cumulus logo and tagline */}
      <SignInButton mode="modal">
        <button className="...your custom styles...">
          {/* Google SVG icon */}
          Continue with Google
        </button>
      </SignInButton>
    </div>
  );
}
```

`<SignInButton>` accepts any React element as a child — the child becomes the clickable trigger. Your button is styled exactly as you want it; Clerk just wires up the click handler. With only Google enabled in the Clerk Dashboard, the modal will go straight to Google authentication.

Use `mode="modal"` to show the sign-in UI as an overlay without navigating away. Use `mode="redirect"` to go to Clerk's hosted sign-in page instead — either works, modal is smoother for a PWA.

### Handling both sign-in and sign-up

Clerk automatically handles both new and returning users from a single `<SignInButton />`. New Google accounts get a Clerk account created. Existing accounts get signed in. No separate sign-up flow needed.

### No SSO callback route needed

Do not add a `/sso-callback` route. Do not use `<AuthenticateWithRedirectCallback />`. Do not use `useSignIn` with `authenticateWithRedirect`. These are for building fully custom OAuth flows from scratch — they are unnecessary here and will cause complexity and bugs. `<SignInButton />` is the correct and officially recommended approach for React SPAs.

---

## Step 5 — Accessing User Identity in Convex Functions

On the backend, every Convex query and mutation can access the authenticated user's identity:

```typescript
// convex/users.ts
import { query, mutation } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null; // not authenticated
    
    // identity.subject is the Clerk user ID (stable across sessions)
    // identity.email is the user's email
    // identity.name is the user's display name
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
```

**User data scoping:** Every Convex query or mutation that accesses user data must check `ctx.auth.getUserIdentity()` and filter by the user's `subject` (Clerk ID). This ensures users can never read each other's data.

---

## Step 6 — Syncing Users to Convex via Webhooks

There are two ways to get user records into Convex. The webhook approach is more robust because it keeps user data in sync automatically even when users update or delete their Clerk accounts. Use this approach for Cumulus.

### How it works

Clerk calls a Convex HTTP endpoint any time a user signs up, updates their profile, or deletes their account. Convex receives the webhook, verifies it's genuinely from Clerk using a signing secret, and upserts/deletes the user record in the database. The React client never needs to call a mutation to create the user — it just waits until the webhook has fired and the user record exists.

### Step 6a — Install svix

Clerk uses svix to sign webhooks. Install it in your project:

```bash
npm install svix @clerk/backend
```

### Step 6b — Schema

```typescript
// convex/schema.ts
users: defineTable({
  name: v.string(),
  email: v.string(),
  externalId: v.string(),       // Clerk user ID (identity.subject)
  onboardingComplete: v.boolean(),
  createdAt: v.number(),
}).index("byExternalId", ["externalId"]),
```

### Step 6c — User mutations

```typescript
// convex/users.ts
import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";

// Exposes current user to the client
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Called by the webhook when a user signs up or updates their account
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email_addresses[0]?.email_address ?? "",
      externalId: data.id,
      onboardingComplete: false,
      createdAt: Date.now(),
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      // Preserve onboardingComplete when updating
      await ctx.db.patch(user._id, {
        name: userAttributes.name,
        email: userAttributes.email,
      });
    }
  },
});

// Called by the webhook when a user deletes their account
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);
    if (user !== null) {
      await ctx.db.delete(user._id);
    }
  },
});

// Mutation to mark onboarding as complete (called from the client)
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { onboardingComplete: true });
  },
});

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await userByExternalId(ctx, identity.subject);
}

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("User not found");
  return user;
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}
```

### Step 6d — HTTP webhook endpoint

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;
      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }
      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
```

### Step 6e — Configure the webhook in Clerk Dashboard

1. Go to **Clerk Dashboard → Webhooks → Add Endpoint**
2. Set the **Endpoint URL** to:
   ```
   https://<your-deployment-name>.convex.site/clerk-users-webhook
   ```
   Note the domain ends in `.site`, not `.cloud`. Find your deployment name in `.env.local` or on the Convex dashboard.
3. Under **Message Filtering**, select all **user** events: `user.created`, `user.updated`, `user.deleted`
4. Click **Create**
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Set it as `CLERK_WEBHOOK_SECRET` in your **Convex dashboard** environment variables (not in `.env` — this is a server-side Convex variable)

### Step 6f — Using the user record on the client

Because the user record is created by the webhook (not by the client), there can be a brief delay between the user signing in and the webhook firing. The client should wait for the user record to exist before rendering the app. Use `useQuery(api.users.current)` and treat `null` as "not ready yet":

```typescript
// src/components/layout/AppShell.tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function AppShell() {
  const user = useQuery(api.users.current);

  // undefined = query still loading, null = query done but no user record yet
  // (webhook hasn't fired yet — show a spinner in both cases)
  if (user === undefined || user === null) {
    return <FullScreenSpinner />;
  }

  if (!user.onboardingComplete) {
    return <OnboardingRouter />;
  }

  return <MainAppRouter />;
}
```

This is safe because Convex queries are reactive — the moment the webhook fires and `upsertFromClerk` runs, `useQuery(api.users.current)` will automatically re-render with the new user record. The spinner resolves itself without any polling or manual refresh.

### Step 6g — Remove AuthInitializer

Delete the `AuthInitializer` pattern from the previous approach (the `useEffect` that called `upsertUser`). With webhooks, user creation is handled server-side by Clerk. The client never needs to call a mutation to create the user.

---

## Step 7 — Onboarding Routing

After the webhook has fired and the user record exists in Convex, check `onboardingComplete` to route the user appropriately. The `AppShell` query in Step 6f handles this already. Here's the onboarding completion flow:

```typescript
// src/screens/onboarding/OnboardingCanvas.tsx
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

export default function OnboardingCanvas() {
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const navigate = useNavigate();

  const handleSkip = async () => {
    await completeOnboarding();
    navigate("/");
  };

  const handleConnect = async (token: string) => {
    // Save Canvas token, then mark onboarding complete
    await saveCanvasToken(token);
    await completeOnboarding();
    navigate("/");
  };

  return (
    // ... onboarding UI
  );
}
```

---

## Step 8 — Sign Out

```typescript
import { useClerk } from "@clerk/react";

function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button onClick={() => signOut({ redirectUrl: "/" })}>
      Sign out
    </button>
  );
}
```

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| Using `@clerk/nextjs` instead of `@clerk/react` | Always `@clerk/react` in a Vite SPA |
| Adding `CLERK_SECRET_KEY` to `.env` | This key is server-only. SPAs only need `VITE_CLERK_PUBLISHABLE_KEY` |
| Using `clerkMiddleware` for route protection | Use `<Authenticated>` / `<Unauthenticated>` from `convex/react` |
| Using `useAuth()` from Clerk to check auth state | Use `useConvexAuth()` from `convex/react` instead |
| Using `useSignIn` with `authenticateWithRedirect` and a custom `/sso-callback` route | Use `<SignInButton />` from `@clerk/react` with a custom child — no callback route needed |
| Adding `<AuthenticateWithRedirectCallback />` anywhere | Not needed when using `<SignInButton />` — remove it entirely |
| Calling Convex queries outside of `<Authenticated>` | Queries that require auth will throw — always gate them inside `<Authenticated>` |
| Naming the Clerk JWT template anything other than `convex` | The name must be exactly `convex` — `ConvexProviderWithClerk` looks for this exact name |
| Creating the `convex` client inside a component | Create it once outside the component tree, at module level |
| Creating user records from the client with `useEffect` | Use the webhook approach — Clerk calls your Convex HTTP endpoint server-side |
| Setting `CLERK_WEBHOOK_SECRET` in `.env` instead of the Convex dashboard | This is a server-side Convex env var — set it in the Convex dashboard, not in Vite's `.env` |
| Using `.convex.cloud` in the webhook URL | The webhook endpoint URL must end in `.convex.site`, not `.convex.cloud` |

---

## Full Flow Summary

```
1. User opens app
      ↓
2. ClerkProvider + ConvexProviderWithClerk initialise
      ↓
3. AuthLoading renders (brief) → spinner shown
      ↓
4a. No session found → Unauthenticated renders → AuthPage shown
      ↓ (user clicks "Continue with Google" — the <SignInButton> child)
4b. Clerk opens modal showing only Google
      ↓
5. User authenticates with Google
      ↓
6a. Clerk handles the OAuth callback internally — no custom route needed
6b. Simultaneously: Clerk fires a user.created webhook to
    https://<deployment>.convex.site/clerk-users-webhook
      ↓
7. convex/http.ts receives the webhook, verifies the svix signature,
   calls internal.users.upsertFromClerk → user record created in Convex DB
      ↓
8. Clerk session created → ConvexProviderWithClerk fetches a "convex" JWT
      ↓
9. Convex backend validates JWT against auth.config.ts issuer domain
      ↓
10. useConvexAuth returns isAuthenticated: true
       ↓
11. Authenticated renders → AppShell shown
       ↓
12. AppShell calls useQuery(api.users.current)
    → waits (spinner) until webhook has fired and user record exists
       ↓
13. User record found → check onboardingComplete
       ↓ false              ↓ true
14a. Onboarding flow   14b. Dashboard
```