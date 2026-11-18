# 🚀 Playwright QA Framework

Professional Playwright QA Framework with UI Testing, API Testing, Page Object Model (POM), HTML Reports, Screenshots, Videos, and Trace Support.

---

## 📌 Features

28 test cases (25 functional + 3 end-to-end journeys), data-driven where it counts. Negative cases are rows in JSON, and expected totals and sort order are computed from the page.

| Feature | Spec | Cases |
|---|---|---|
| Login & session | `e2e/ui/login.spec.ts` | LG01 valid login · LG02 locked-out user · LG03–LG05 invalid credentials · LG06 protected page · LG07 logout |
| Product list | `e2e/ui/inventory.spec.ts` | IN01 catalog integrity · IN02–IN05 all 4 sort options |
| Cart | `e2e/ui/cart.spec.ts` | CT01 add · CT02 remove · CT03 persists after reload |
| Checkout | `e2e/ui/checkout.spec.ts` | CO01 end-to-end purchase with price math · CO02–CO04 required fields |
| **E2E user journey** | `e2e/ui/user-journey.spec.ts` | UJ01 buy the cheapest products, full loop · UJ02 edit the cart before buying · UJ03 recover from input mistakes |
| Users API (CRUD) | `e2e/api-tests/users.spec.ts` | US01 list · US02 get · US03 404 · US04 create · US05 update · US06 delete |

### Framework Architecture

* Page Object Model (POM)
* Test Data Management (JSON)
* Fixtures Support
* Environment Configuration

### Reporting & Debugging

* HTML Report
* Screenshots
* Video Recording
* Trace Viewer

---

# 📂 Project Structure

```text
panida-playwright-portfolio/
├── e2e/
│   ├── auth/
│   │   ├── auth.setup.ts       # logs in once per role → .auth/<Role>.json
│   │   └── roles.ts            # ROLES, credentials, asRole(), AS_GUEST
│   ├── config/
│   │   ├── env.ts              # the only place that reads e2e/.env
│   │   └── paths.ts            # project paths
│   ├── api/                    # API objects
│   │   └── UsersApi.ts
│   ├── helpers/
│   │   ├── helper.ts
│   │   ├── logger.ts
│   │   ├── step-screenshot.ts
│   │   └── test.ts             # test + `step` fixture (screenshot after every step)
│   ├── page/                   # Page Objects
│   │   ├── LoginPage.ts
│   │   ├── InventoryPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts
│   ├── ui/                     # UI specs (SauceDemo, one file per feature)
│   │   ├── login.spec.ts       # LG01–LG07
│   │   ├── inventory.spec.ts   # IN01–IN05
│   │   ├── cart.spec.ts        # CT01–CT03
│   │   ├── checkout.spec.ts    # CO01–CO04
│   │   └── user-journey.spec.ts # UJ01–UJ03 (end-to-end)
│   ├── api-tests/              # API specs (JSONPlaceholder)
│   │   └── users.spec.ts       # US01–US06
│   ├── test-data/              # one JSON per feature, each with "_readme"
│   │   ├── login.json
│   │   ├── inventory.json
│   │   ├── cart.json
│   │   ├── checkout.json
│   │   ├── user-journey.json
│   │   ├── <feature>.cases.ts  # test case details for the Excel result
│   │   └── test-case.types.ts
│   │   └── users.json
│   ├── reporters/
│   │   └── excel-test-result.ts # one Excel test result per spec
│   ├── templates/
│   │   └── TestResult_template.xlsx
│   └── .env.example
├── reports/
├── playwright.config.ts        # "setup" project → "chromium" project
├── package.json
└── tsconfig.json
```

## Conventions

* Spec: `e2e/<app>/<feature>.spec.ts`, Page Object: `e2e/page/<Page>.ts`, data: `e2e/test-data/<feature>.json`
* Test name starts with a TSN (2 letters + number), e.g. `test("LG01 ...")`, with `// LG01` and `// EN: ...` above it
* Role: `test.use(asRole(ROLES.StandardUser))`. Never type a role name as a string
* No passwords in test data. Accounts live in `e2e/.env` (defaults in `e2e/auth/roles.ts`)

---

# 🛠 Prerequisites

Install:

* Node.js 18+
* VS Code
* Playwright

Verify installation:

```bash
node -v
npm -v
```

---

# ⚙️ Installation

Clone or extract the project.

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

---

# ▶️ Run UI Tests

Run all UI test cases:

```bash
npm run test:ui
```

Expected Result:

```text
19 passed (+1 setup)
```

---

# ▶️ Run API Tests

Run all API test cases:

```bash
npm run test:api
```

Expected Result:

```text
6 passed (+1 setup)
```

---

# ▶️ Run All Tests

```bash
npm run test:e2e
npm run typecheck
```

---

# 📊 HTML Report

Open report manually:

```bash
npm run report
```

Or open directly:

```bash
npx playwright show-report
```

---

# 📑 Excel Test Result

Every run writes one workbook per spec, built from `e2e/templates/TestResult_template.xlsx`:

```text
reports/TestResult_Login_<YYYYMMDD>.xlsx
reports/TestResult_Inventory_<YYYYMMDD>.xlsx
reports/TestResult_Cart_<YYYYMMDD>.xlsx
reports/TestResult_Checkout_<YYYYMMDD>.xlsx
reports/TestResult_UserJourney_<YYYYMMDD>.xlsx
reports/TestResult_UsersApi_<YYYYMMDD>.xlsx
```

* **Summary**: one row per test case with its status for this run (Passed / Failed / N/A / To be Execute). Capture Screen links to the case sheet
* **Test Progress**: totals, percentages and a chart (recalculated when Excel opens the file)
* **One sheet per TSN**: case details, actual result (the error if it failed), a step table, and **one screenshot per step**

UI specs use `step(...)` from `e2e/helpers/test.ts`, which screenshots the page after each step, including a failing one.
To add a spec, create `e2e/test-data/<feature>.cases.ts` and add it to `SUITES` in `e2e/reporters/excel-test-result.ts`.

---

# 📸 Screenshot Support

Framework automatically captures screenshots during test execution.

Configuration:

```ts
screenshot: 'on'
```

---

# 🎥 Video Recording

Videos are generated when test retries occur.

Configuration:

```ts
video: 'on-first-retry'
```

---

# 🔍 Trace Viewer

Trace files are generated automatically.

Configuration:

```ts
trace: 'on'
```

Open Trace:

```bash
npx playwright show-trace trace.zip
```

---

# 🔧 Environment Variables

Create a local environment file:

```bash
cp e2e/.env.example e2e/.env
```

Example:

```env
BASE_URL=https://www.saucedemo.com
```

---

# 🧪 Test Data Example

Example login data:

```json
{
  "invalidCredentials": [
    { "tsn": "LG03", "title": "wrong password is rejected",
      "username": "standard_user", "password": "wrong_password",
      "error": "Username and password do not match any user in this service" }
  ]
}
```

---

# 💡 Best Practices

* Keep locators inside Page Objects.
* Store test data in JSON files.
* Use fixtures for reusable setup.
* Keep tests independent.
* Use meaningful test names.

---

# 📦 Framework Version

Version: 1.1.0

Included:

✅ UI Testing

✅ API Testing

✅ Page Object Model

✅ Fixtures

✅ JSON Test Data

✅ HTML Report

✅ Screenshot

✅ Video

✅ Trace

✅ TypeScript Support

---

# 👩‍💻 Author

Panida Banyen

QA Engineer | Automation Testing | Playwright Framework

---

Happy Testing 🚀
