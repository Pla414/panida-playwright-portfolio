/**
 * users.cases.ts — test case details of e2e/api-tests/users.spec.ts for the Excel test result.
 */
import type { SuiteSpec } from "./test-case.types";

export const USERS_API_SUITE: SuiteSpec = {
  specPath: "e2e/api-tests/users.spec.ts",
  filePrefix: "TestResult_UsersApi",
  ticket: "Regression - Users API",
  topic: "JSONPlaceholder /users - CRUD API",
  module: "JSONPlaceholder API",
  subject: "Users API",
  role: "Anonymous (API)",
  preconditions: "1. API_BASE_URL from e2e/config/env.ts\n2. Test data: e2e/test-data/users.json\n3. API test: no screenshot",
  cases: [
    { tsn: "US01", priority: "High", category: "Positive", topic: "Read", description: "GET /users returns user list", dataTest: "GET /users", expected: "200, JSON, every user has id / name / username / valid email, ids are unique" },
    { tsn: "US02", priority: "High", category: "Positive", topic: "Read", description: "GET /users/:id returns one user", dataTest: "GET /users/1", expected: "200 and the user with id 1" },
    { tsn: "US03", priority: "Medium", category: "Negative", topic: "Read", description: "GET /users/:id returns 404 for unknown user", dataTest: "GET /users/9999", expected: "404 with empty body {}" },
    { tsn: "US04", priority: "High", category: "Positive", topic: "Write", description: "POST /users creates a user", dataTest: "{ name: Panida, job: QA Automation Engineer }", expected: "201, body echoes the fields and has an id" },
    { tsn: "US05", priority: "Medium", category: "Positive", topic: "Write", description: "PUT /users/:id updates a user", dataTest: "PUT /users/1 { name: Panida B., job: Senior QA Automation Engineer }", expected: "200, body = sent fields + id 1" },
    { tsn: "US06", priority: "Medium", category: "Positive", topic: "Write", description: "DELETE /users/:id deletes a user", dataTest: "DELETE /users/1", expected: "200 with empty body {}" },
  ],
};
