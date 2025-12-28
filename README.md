# Repostea Client

Frontend application for **[Repostea](https://github.com/repostea/server)** - an open-source content aggregation platform.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.x-green.svg)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org)

## Overview

This is the Nuxt 3 frontend for Repostea. For the complete platform setup, see the **[main repository](https://github.com/repostea/server)**.

## Tech Stack

- [Nuxt 3](https://nuxt.com) - Vue framework with SSR
- [Vue 3](https://vuejs.org) - Composition API
- [Pinia](https://pinia.vuejs.org) - State management
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [i18n](https://i18n.nuxtjs.org) - 15+ languages

## Quick Start

> **Note**: You need the [backend server](https://github.com/repostea/server) running first.

```bash
# Install dependencies (use pnpm)
pnpm install

# Configure environment
cp .env.example .env

# Start development server
pnpm dev
```

Visit http://localhost:3000

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm quality      # Run ESLint + Prettier
pnpm test         # Run Vitest unit tests
pnpm test:e2e     # Run Cypress E2E tests
```

## Configuration

Edit `.env` file:

```env
# API endpoint (your backend server)
NUXT_PUBLIC_API_BASE=http://localhost:8000/api
NUXT_PUBLIC_SERVER_URL=http://localhost:8000
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Site branding
NUXT_PUBLIC_APP_NAME=Repostea
```

See `.env.example` for all available options.

## Project Structure

```
client/
├── components/     # Vue components
├── composables/    # Reusable logic (use*)
├── i18n/           # Translations
├── pages/          # Nuxt pages (file-based routing)
├── stores/         # Pinia stores
├── public/         # Static assets
└── server/         # Server middleware
```

## Full Documentation

For complete setup instructions including:
- Backend installation
- Database configuration
- Production deployment
- Nginx/Apache setup

See the **[Server Repository](https://github.com/repostea/server)**.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `pnpm quality` before committing
4. Open a Pull Request

## Using Repostea?

We'd love to hear from you! [Let us know](https://github.com/repostea/server/issues/new?labels=showcase&title=Showcase:%20[Your%20Site%20Name]) if you're running a Repostea instance.

## License

[GPL-3.0](LICENSE)
