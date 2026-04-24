# 🎭 Playwright API Automation

A scalable **TypeScript-based API and end-to-end testing framework** built with Playwright.
This project focuses on automating **deposit workflow scenarios** using a modular and maintainable architecture.

---

## 🚀 Quick Start

```bash
git clone https://github.com/theh0neybadg3r/playwright-api-automation.git
cd playwright-api-automation
npm install
npx playwright install
npm test
```

---

## ✨ Features

* API + UI testing in a single framework
* Modular structure (helpers, models, utilities)
* Environment-based configuration
* Built-in linting and type checking before test runs
* Scalable test organization using fixtures and POMs

---

## 📁 Project Structure

```
playwright-api-automation/
├── e2e/
│   └── deposit-workflow/       # End-to-end test scenarios
├── helpers/
│   ├── const/                  # Shared constants
│   ├── models/                 # TypeScript interfaces
│   └── utils/                  # Reusable utilities
├── fixtures/                   # Custom Playwright fixtures
├── pages/                      # Page Object Models
├── config/                     # Environment configurations
├── error-logs/                 # Captured test errors
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## ⚙️ Environment Setup

Environment variables are stored in the `config/` directory:

| File           | Description            |
| -------------- | ---------------------- |
| `.env.develop` | Default environment    |
| `.env.live`    | Production environment |

Example:

```bash
BASE_URL=https://your-api-url.com
API_KEY=your_api_key
```

Run tests against a specific environment:

```bash
npm run test:live
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run in UI mode
npm run ui

# Specify the enviroment and then run a specific test file
ENV=develop npx playwright test e2e/deposit-workflow/example.spec.ts
```

> `pretest` automatically runs TypeScript checks and ESLint before execution.

---

## ⚙️ Configuration Highlights

### Playwright

* Test directory: `./e2e`
* Browser: Chromium
* Parallelism: Disabled
* Reporter: HTML
* Trace: On first retry
* Headless: Disabled

### TypeScript Aliases

| Alias         | Path               |
| ------------- | ------------------ |
| `@const/*`    | `helpers/const/*`  |
| `@fixtures/*` | `fixtures/*`       |
| `@models/*`   | `helpers/models/*` |
| `@pages/*`    | `pages/*`          |
| `@utils/*`    | `helpers/utils/*`  |

---

## 🛠️ Tech Stack

* Playwright
* TypeScript
* ESLint
* dotenv
* cross-env

---

## 📜 Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm test`          | Run lint + type check + tests |
| `npm run test:live` | Run tests against production  |
| `npm run ui`        | Open Playwright UI mode       |

---

## 🔍 Test Scope

Current coverage focuses on the **deposit workflow**, located in:

```
e2e/deposit-workflow/
```

Includes validation of both **API and UI flows**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch
3. Commit your changes
4. Open a Pull Request

---
