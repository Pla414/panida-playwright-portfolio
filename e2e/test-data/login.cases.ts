/**
 * login.cases.ts — test case details of e2e/ui/login.spec.ts for the Excel test result.
 */
import type { SuiteSpec } from "./test-case.types";

export const LOGIN_SUITE: SuiteSpec = {
  specPath: "e2e/ui/login.spec.ts",
  filePrefix: "TestResult_Login",
  ticket: "Regression - Login",
  topic: "SauceDemo (/) - login with valid / locked / invalid credentials, protected page and logout",
  module: "SauceDemo",
  subject: "Login",
  role: "Guest → StandardUser / LockedOutUser",
  preconditions:
    "1. Starts without a session (AS_GUEST)\n2. Accounts from e2e/auth/roles.ts / e2e/.env\n3. Test data: e2e/test-data/login.json",
  cases: [
    { tsn: "LG01", priority: "Critical", category: "Positive", topic: "Login", description: "Login succeeds with valid credentials", dataTest: "ROLES.StandardUser", expected: "User lands on /inventory.html and the title is 'Products'" },
    { tsn: "LG02", priority: "High", category: "Negative", topic: "Login", description: "Locked-out user cannot log in", dataTest: "ROLES.LockedOutUser", expected: "Error 'Sorry, this user has been locked out.' and the login form stays" },
    { tsn: "LG03", priority: "High", category: "Negative", topic: "Login", description: "Wrong password is rejected", dataTest: "standard_user / wrong_password", expected: "Error 'Username and password do not match any user in this service'" },
    { tsn: "LG04", priority: "Medium", category: "Negative", topic: "Login", description: "Empty username is required", dataTest: "'' / any_password", expected: "Error 'Username is required'" },
    { tsn: "LG05", priority: "Medium", category: "Negative", topic: "Login", description: "Empty password is required", dataTest: "standard_user / ''", expected: "Error 'Password is required'" },
    { tsn: "LG06", priority: "High", category: "Negative", topic: "Session", description: "Protected page requires login", dataTest: "/inventory.html", expected: "Redirect to login with \"You can only access '/inventory.html' when you are logged in.\"" },
    { tsn: "LG07", priority: "High", category: "Positive", topic: "Session", description: "Logout ends the session", dataTest: "ROLES.StandardUser", expected: "1. Logout returns to the login form\n2. /inventory.html is blocked afterwards" },
  ],
};
