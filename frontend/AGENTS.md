<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Frontend Guidelines

This project has been explicitly migrated from a Lovable / `@tanstack/react-start` SSR architecture to a standard Vite + React Single Page Application (SPA).

## 🛠 Tech Stack

- **Framework:** React 19 + Vite
- **Routing:** `react-router-dom` (v6) - Do not use file-based routing or TanStack router APIs.
- **Styling:** Tailwind CSS v4 + Radix UI (shadcn/ui style)
- **State Management:** Zustand (`src/store/`)
- **Data Fetching:** Axios (`src/services/api.ts`) + React Query
- **Forms:** React Hook Form + Zod

## 📁 Directory Structure

- `src/pages/`: Contains all route components (`Home.tsx`, `ProductDetail.tsx`, etc.). Export default functions.
- `src/layouts/`: Contains layout wrappers (e.g. `MainLayout.tsx`).
- `src/components/`: Reusable UI components.
- `src/services/`: API configurations and Axios instances.
- `src/store/`: Global client state (Zustand). Note: Ensure state is persisted if it needs to survive reloads.
- `src/lib/`: Utilities and helpers.

## ⚠️ Anti-Patterns to Avoid

1. **Hardcoded Data:** Do not import static arrays directly in pages (like `products` from `lib/products.ts`). Use Axios to fetch data from the backend.
2. **TanStack Router Leftovers:** Never use `createFileRoute`, `useLoaderData`, or `@tanstack/react-router`. Always rely on `react-router-dom`.
3. **Non-null Assertions:** Avoid using `!` (e.g., `getProduct(id)!`). Handle undefined gracefully or use error boundaries to prevent app crashes.
4. **Volatile Global State:** Do not store critical data (like shopping cart contents) in pure memory Zustand stores without the `persist` middleware.
