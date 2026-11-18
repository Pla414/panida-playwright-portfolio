/**
 * users.spec.ts — JSONPlaceholder /users CRUD API (US01–US06).
 *   US01–US03  read: list, single user, missing user
 *   US04–US06  write: create, update, delete
 * Requests go to API_BASE_URL through the UsersApi object.
 */
import { test, expect } from "@playwright/test";
import { UsersApi } from "../api/UsersApi";
import { API_BASE_URL } from "../config/env";
import data from "../test-data/users.json";

test.use({ baseURL: API_BASE_URL });

let users: UsersApi;

test.beforeEach(async ({ request }) => {
  users = new UsersApi(request);
});

/** Assert an object has every required user field and a valid email. */
function expectUserShape(user: Record<string, unknown>): void {
  for (const field of data.requiredFields) expect(user, `user has "${field}"`).toHaveProperty(field);
  expect(user.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
}

test.describe("Read", () => {
  // US01
  // EN: GET /users returns JSON with a list of complete users and unique ids
  test("US01 GET /users returns user list", async () => {
    const response = await test.step("Send GET /users", () => users.list());

    await test.step("Verify status, content type and user fields", async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");
      const body: Record<string, unknown>[] = await response.json();
      expect(body.length).toBeGreaterThan(0);
      body.forEach(expectUserShape);
      expect(new Set(body.map((u) => u.id)).size, "ids are unique").toBe(body.length);
    });
  });

  // US02
  // EN: GET /users/:id returns that exact user
  test("US02 GET /users/:id returns one user", async () => {
    const response = await test.step(`Send GET /users/${data.existingUserId}`, () => users.get(data.existingUserId));

    await test.step("Verify status and user", async () => {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expectUserShape(body);
      expect(body.id).toBe(data.existingUserId);
    });
  });

  // US03
  // EN: GET /users/:id with an unknown id returns 404
  test("US03 GET /users/:id returns 404 for unknown user", async () => {
    const response = await test.step(`Send GET /users/${data.missingUserId}`, () => users.get(data.missingUserId));

    await test.step("Verify 404 with empty body", async () => {
      expect(response.status()).toBe(404);
      expect(await response.json()).toEqual({});
    });
  });
});

test.describe("Write", () => {
  // US04
  // EN: POST /users creates a user and echoes the sent fields with a new id
  test("US04 POST /users creates a user", async () => {
    const response = await test.step("Send POST /users", () => users.create(data.newUser));

    await test.step("Verify 201 and echoed body", async () => {
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject(data.newUser);
      expect(body.id).toBeTruthy();
    });
  });

  // US05
  // EN: PUT /users/:id replaces the user and keeps the same id
  test("US05 PUT /users/:id updates a user", async () => {
    const response = await test.step(`Send PUT /users/${data.existingUserId}`, () =>
      users.update(data.existingUserId, data.updatedUser),
    );

    await test.step("Verify 200 and updated body", async () => {
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ ...data.updatedUser, id: data.existingUserId });
    });
  });

  // US06
  // EN: DELETE /users/:id succeeds with an empty body
  test("US06 DELETE /users/:id deletes a user", async () => {
    const response = await test.step(`Send DELETE /users/${data.existingUserId}`, () =>
      users.remove(data.existingUserId),
    );

    await test.step("Verify 200 with empty body", async () => {
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({});
    });
  });
});
