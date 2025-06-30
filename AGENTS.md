# Agent Guidelines for One-Goal Repository

## 2. Code Style Guidelines

- **Formatting**: Adhere to Prettier rules (`npm run format`). Key settings include:
  - Semicolons: Yes
  - Single Quotes: Yes
  - Tab Width: 2 spaces
  - Trailing Commas: ES5
  - Print Width: 100 characters
- **Linting**: Follow ESLint rules (`npm run lint`). The configuration extends `next/core-web-vitals` and `next/typescript`.
  - Unused variables: Warn (`@typescript-eslint/no-unused-vars`)
  - Explicit function return types: Off
  - Explicit module boundary types: Off
- **Types**: Use TypeScript strictly (`strict: true` in `tsconfig.json`). Ensure proper type annotations for clarity and maintainability.
- **Imports**: Prefer absolute imports using the `@/` alias for paths within the `app` directory (e.g., `import { foo } from '@/components/foo';`).
- **Naming Conventions**: Follow standard JavaScript/TypeScript and React naming conventions (e.g., `PascalCase` for components, `camelCase` for variables and functions).
- **Error Handling**: Implement robust error handling using `try-catch` blocks for asynchronous operations and validate user input.

## 3. Agent-Specific Instructions

- Always include the full file path as a comment at the top of every file (e.g., `// app/services/authService.ts`).
- Use the `@/` path alias for imports from the `./app` directory, as configured in `tsconfig.json`.
- Leverage the existing dependencies listed in `package.json` when adding new features.
- Utilize existing utility functions (like those in `app/utils/`) wherever it makes sense to avoid code duplication.
- The project is a Next.js static export build, configured for deployment on GitHub Pages. No API routes or server-side rendering is used.
- User authentication is handled exclusively through Google Sign-In via Firebase.
- Strictly avoid using the `any` type in TypeScript. Use it only as a last resort if it provides a significant advantage and a specific type is not feasible.
- Implement loading indicators (e.g., spinners) on all action buttons (like save, delete, update) to provide visual feedback during asynchronous operations.
- Apply the `cursor-pointer` Tailwind CSS utility class to all clickable UI elements to ensure a clear user experience.
- Avoid vague comments like `adding this line here.` All comments should be meaningful and explain the `why` behind the code, not just the `what`.
- To prevent infinite render loops with Zustand, always select state slices individually. Do not create new objects or arrays within the selector. For example, `const myVal = useStore(state => state.myVal)` is correct, but `const { myVal } = useStore(state => ({ myVal: state.myVal }))` will cause issues.
