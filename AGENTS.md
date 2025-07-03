This document provides a set of guidelines and instructions for agents and developers contributing to the **One Goal** repository. Adhering to these standards ensures code quality, consistency, and maintainability.

## 1. Code Style & Conventions

- **Formatting**: Strictly adhere to the Prettier rules defined in `.prettierrc.json`. Run `yarn format` before committing to ensure all files are correctly formatted.
- **Linting**: All code must pass the ESLint checks configured in `eslint.config.mjs`. Run `yarn lint` to identify and fix issues.
- **TypeScript**: The project uses TypeScript with `strict: true` enabled. Avoid using the `any` type unless it is a last resort for complex third-party library types or for mocking in tests (with a comment justifying its use).
- **Imports**: Always use absolute imports with the `@/` alias for paths within the `app` directory (e.g., `import { MyComponent } from '@/components/MyComponent';`).
- **Naming Conventions**: Follow standard JavaScript/TypeScript and React naming conventions (e.g., `PascalCase` for components, `camelCase` for variables and functions).
- **Theming**: The project uses a custom theme system based on CSS variables defined in `app/globals.css`. All new components **must** use these variables (e.g., `bg-bg-primary`, `text-text-primary`, `border-border-primary`) instead of hardcoded colors to ensure they support both light and dark modes.

## 2. Agent-Specific Instructions

- **File Paths**: Always include the full file path as a comment at the top of every file (e.g., `// app/services/authService.ts`).
- **Dependency Usage**: Leverage existing dependencies listed in `package.json` before introducing new ones.
- **Utility Functions**: Utilize existing utility functions from the `app/utils/` directory to avoid code duplication.
- **Static Export**: Remember that the project is a Next.js static export build. No API routes or server-side rendering features should be used.
- **Loading Indicators**: Implement loading indicators (e.g., spinners) on all action buttons (save, delete, update) to provide visual feedback during asynchronous operations.
- **User Experience**: Apply the `cursor-pointer` utility class to all clickable UI elements.
- **Comments**: All comments should be meaningful and explain the _why_ behind the code, not just the _what_. Avoid vague comments like `// adding this line`.
- **Zustand State Selection**: To prevent infinite render loops, always select state slices individually from Zustand stores. Do not create new objects or arrays within the selector.
  - **Correct**: `const myVal = useStore(state => state.myVal)`
  - **Incorrect**: `const { myVal } = useStore(state => ({ myVal: state.myVal }))`

## 3. Project Architecture & Key Decisions

- **State Management**:
  - Global application state is managed by **Zustand**. Each store (`useGoalStore`, `useNotificationStore`, etc.) handles a specific domain of the application's state.
  - Theme preference is managed on the client-side using **`localStorage`**.
- **Data Layer**:
  - All interactions with Firebase Firestore are encapsulated within the `app/services/` directory.
  - Each service is responsible for a single domain (e.g., `goalService`, `todoService`), ensuring a clean separation of concerns.
- **Theming Implementation**:
  - The application uses a **manual theme-switching mechanism**, not a third-party library.
  - The core logic involves toggling a `dark` class on the `<html>` element.
  - A `ThemeInitializer` component injects a script to run before page render, preventing the "flash of incorrect theme" (FOUC).

## 4. Testing & CI/CD

- **Testing Framework**: The project uses **Jest** for running tests and **React Testing Library** for rendering and interacting with components.
- **Service Tests**: All data services in the `app/services/` directory are fully tested. These tests use mocks to isolate the service logic from the Firebase backend, ensuring fast and reliable tests.
- **Continuous Integration (CI)**: The project is configured with several GitHub Actions workflows:
  - `eslint-prettier.yml`: Runs on every push and pull request to enforce code style and linting rules.
  - `test.yml`: Runs the complete Jest test suite to ensure that no changes break existing functionality.
  - `codeql.yml`: Performs automated security analysis on the codebase.
  - `deploy.yml`: Automatically deploys the application to GitHub Pages when changes are merged into the `main` branch.
