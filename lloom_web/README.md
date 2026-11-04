# LLooM Web

The Next.js frontend for LLooM (Language Model-based Concept Induction).

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Getting Started

### Prerequisites

- Node.js 20.9 or newer
- npm

### Installation

From the `lloom_web/` directory, install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Changes to the source code will automatically update the application.

## Development Workflow

The project uses ESLint, TypeScript strict mode, and Prettier to maintain code quality and consistency.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run format` | Automatically format source files with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm run check` | Run linting, type checking, and formatting checks |

### Before Pushing Changes

All contributors should run:

```bash
npm run check
npm run build
```

If the formatting check fails, run:

```bash
npm run format
```

Then rerun the checks before pushing.

## Development Guidelines

Frontend architecture, coding conventions, styling guidelines, and expectations for AI coding agents are documented in [AGENTS.md](./AGENTS.md).

The frontend's visual design is maintained in [Figma](https://www.figma.com/design/ZD63PswmLrGbgtIn4OulsL/LLooM-Web-UI-Design?node-id=1-2&t=m9eXBtnLz6cpRU9c-1).

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)