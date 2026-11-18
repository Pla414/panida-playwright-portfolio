/**
 * UsersApi.ts — API object for JSONPlaceholder /users (the API version of a page object).
 * Paths are relative, so the spec must set baseURL to API_BASE_URL.
 * Every call is logged (request + response) to the current step via sendLogged().
 */
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { sendLogged } from "../helpers/api-log";

export interface UserInput {
  name: string;
  job: string;
}

export class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  /** GET /users */
  list(): Promise<APIResponse> {
    return sendLogged(this.request, "GET", "/users");
  }

  /** GET /users/:id */
  get(id: number): Promise<APIResponse> {
    return sendLogged(this.request, "GET", `/users/${id}`);
  }

  /** POST /users */
  create(user: UserInput): Promise<APIResponse> {
    return sendLogged(this.request, "POST", "/users", user);
  }

  /** PUT /users/:id */
  update(id: number, user: UserInput): Promise<APIResponse> {
    return sendLogged(this.request, "PUT", `/users/${id}`, user);
  }

  /** DELETE /users/:id */
  remove(id: number): Promise<APIResponse> {
    return sendLogged(this.request, "DELETE", `/users/${id}`);
  }
}
