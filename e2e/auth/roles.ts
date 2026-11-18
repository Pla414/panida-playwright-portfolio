/**
 * roles.ts — single place for roles and login accounts.
 * Add a role to ROLE_DEFINITIONS and its <ROLE>_USERNAME / <ROLE>_PASSWORD vars to e2e/.env.
 * In specs, refer to roles through ROLES.<name>, never as a typed string:
 *   test.use(asRole(ROLES.StandardUser))
 */
import path from "path";
import { ACTIVE_ROLE as ACTIVE_ROLE_ENV, optionalEnv } from "../config/env";
import { AUTH_DIR } from "../config/paths";

interface RoleDefinition {
  description: string;
  usernameVar: string;
  passwordVar: string;
  /** Public SauceDemo account used when the env var is not set. */
  defaultUsername: string;
  defaultPassword: string;
  /** true = auth.setup.ts logs in and saves a session for this role. */
  session: boolean;
}

const ROLE_DEFINITIONS = {
  StandardUser: {
    description: "Regular user who can log in and shop",
    usernameVar: "STANDARD_USER_USERNAME",
    passwordVar: "STANDARD_USER_PASSWORD",
    defaultUsername: "standard_user",
    defaultPassword: "secret_sauce",
    session: true,
  },
  LockedOutUser: {
    description: "Account that is blocked from logging in",
    usernameVar: "LOCKED_OUT_USER_USERNAME",
    passwordVar: "LOCKED_OUT_USER_PASSWORD",
    defaultUsername: "locked_out_user",
    defaultPassword: "secret_sauce",
    session: false,
  },
} as const satisfies Record<string, RoleDefinition>;

export type RoleName = keyof typeof ROLE_DEFINITIONS;

/** Role names as constants, e.g. ROLES.StandardUser. */
export const ROLES = Object.fromEntries(
  Object.keys(ROLE_DEFINITIONS).map((name) => [name, name]),
) as { readonly [K in RoleName]: K };

export const ALL_ROLES = Object.keys(ROLE_DEFINITIONS) as RoleName[];

/** Roles that can log in, so auth.setup.ts saves a session for them. */
export const SESSION_ROLES = ALL_ROLES.filter((role) => ROLE_DEFINITIONS[role].session);

export interface Credentials {
  username: string;
  password: string;
}

/** Return the username / password of a role (env var first, then the public default). */
export function credentialsFor(role: RoleName): Credentials {
  const def = ROLE_DEFINITIONS[role];
  return {
    username: optionalEnv(def.usernameVar) ?? def.defaultUsername,
    password: optionalEnv(def.passwordVar) ?? def.defaultPassword,
  };
}

/** Path of the saved session file for a role. */
export function storageStateFor(role: RoleName): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/** Validate ACTIVE_ROLE and return it (defaults to StandardUser). */
export function getActiveRole(): RoleName {
  const role = ACTIVE_ROLE_ENV ?? ROLES.StandardUser;
  if (!(role in ROLE_DEFINITIONS)) {
    throw new Error(`[roles] Unknown ACTIVE_ROLE="${role}". Valid roles: ${ALL_ROLES.join(", ")}`);
  }
  return role as RoleName;
}

/** test.use() options that run a spec with the saved session of a role. */
export function asRole(role: RoleName) {
  return { storageState: storageStateFor(role) };
}

/** test.use() options that start without any session (for login tests). */
export const AS_GUEST = { storageState: { cookies: [], origins: [] } };
