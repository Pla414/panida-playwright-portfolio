# 🚀 Playwright QA Framework

Professional Playwright QA Framework with UI Testing, API Testing, Page Object Model (POM), HTML Reports, Screenshots, Videos, and Trace Support.

---

## 📌 Features

### UI Automation Testing

* Login Success Test
* Login Failed Test
* Add Product to Cart Test

### API Automation Testing

* GET Users API
* CREATE User API

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
playwright-qa-framework/

├── tests/
│   ├── ui/
│   └── api/
│
├── pages/
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   └── CartPage.ts
│
├── fixtures/
│   ├── auth.fixture.ts
│   └── test.fixture.ts
│
├── test-data/
│   ├── login-data.json
│   ├── users.json
│   └── products.json
│
├── reports/
│   └── .gitkeep
│
├── screenshots/
│   └── .gitkeep
│
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

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
3 passed
```

---

# ▶️ Run API Tests

Run all API test cases:

```bash
npm run test:api
```

Expected Result:

```text
2 passed
```

---

# ▶️ Run All Tests

```bash
npm run test
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
cp .env.example .env
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
  "username": "standard_user",
  "password": "secret_sauce"
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
