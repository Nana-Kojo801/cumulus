/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

<<<<<<< HEAD
import type * as canvasConnections from "../canvasConnections.js";
import type * as canvasSync from "../canvasSync.js";
import type * as courses from "../courses.js";
import type * as criteria from "../criteria.js";
import type * as data from "../data.js";
import type * as http from "../http.js";
import type * as scoreEntries from "../scoreEntries.js";
import type * as semesters from "../semesters.js";
import type * as users from "../users.js";

=======
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

<<<<<<< HEAD
declare const fullApi: ApiFromModules<{
  canvasConnections: typeof canvasConnections;
  canvasSync: typeof canvasSync;
  courses: typeof courses;
  criteria: typeof criteria;
  data: typeof data;
  http: typeof http;
  scoreEntries: typeof scoreEntries;
  semesters: typeof semesters;
  users: typeof users;
}>;
=======
declare const fullApi: ApiFromModules<{}>;
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
