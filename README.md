# Repostea Client

Frontend for the **Repostea** project, built with [Nuxt 3](https://nuxt.com) and [Tailwind CSS](https://tailwindcss.com). This client consumes the API from the `server` backend, developed in Laravel.

## 🧱 Stack

- [Nuxt 3](https://nuxt.com)
- [Pinia](https://pinia.vuejs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [@nuxt/ui](https://ui.nuxt.com)
- [VueUse](https://vueuse.org)
- [i18n](https://i18n.nuxtjs.org) multilingual support
- [Axios](https://axios-http.com)
- [TypeScript](https://www.typescriptlang.org)

## 🚀 Scripts

> ⚠️ **Use `pnpm` instead of `npm` or `yarn`.**

### PNPM Setup

If you encounter the error `ERR_PNPM_NO_GLOBAL_BIN_DIR Unable to find the global bin directory`, run the following command to configure PNPM correctly:

```bash
pnpm run setup-pnpm
```

This script:
1. Runs `pnpm setup` to create the global bin directory
2. Configures the `.npmrc` file with the correct path
3. Provides instructions to set the `PNPM_HOME` environment variable

After running the script, restart your terminal for changes to take effect.

### Installation:

```bash
pnpm install
```

Development:

```bash
pnpm run dev
```

Build:

```bash
pnpm run build
```

Static Generation (production API):

```bash
pnpm run generate:api
```

Static Generation (local API):

```bash
pnpm run generate:local
```

Preview the build:

```bash
pnpm run preview
```

Linter and Prettier:

```bash
pnpm run quality
```

## 🧪 Code Quality

- ESLint with Nuxt and Vue rules
- Prettier
- Stylelint for CSS/SCSS
- Lint-staged + Husky (pre-commit)

## 🌍 i18n

Multilingual project with internationalized routes and full support via `@nuxtjs/i18n`.

## 🛠 Project Structure

```
.
├── components/         # Reusable Vue components
├── composables/        # Hooks and shared logic
├── locales/            # Translations
├── pages/              # Nuxt pages
├── public/             # Static files
├── server/             # Endpoints and middlewares
├── tailwind.config.js  # Tailwind configuration
└── nuxt.config.ts      # Main project config
```

## 📚 Additional Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide (PWA, i18n, configuration)
- **[TESTING.md](./TESTING.md)** - Testing guide

## 🧑‍💻 Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`pnpm run quality` first)
4. Open a PR

## 💬 Using Repostea?

We'd love to hear from you! If you're using Repostea for your project, please [open an issue](https://github.com/repostea/repostea/issues/new?labels=showcase&title=Showcase:%20[Your%20Project%20Name]) to let us know. It helps us understand how the project is being used and motivates continued development.

## 📄 License

[GPL-3.0](LICENSE)
