# Contributing Guide

Thank you for considering contributing to **Repostea Client**! 🎉

We welcome pull requests, bug reports, and feature requests. Follow the steps below to contribute effectively.

---

## 🛠 Getting Started

1. Fork this repository
2. Clone your fork locally
3. Install dependencies:

```bash
npm install
```

4. Create a new branch:

```bash
git checkout -b your-feature-name
```

---

## 💻 Code Standards

This project uses:

- **ESLint** for JavaScript/TypeScript linting
- **Prettier** for consistent code formatting
- **Stylelint** for CSS
- **Husky** + **lint-staged** to auto-run linting on commits

Run these manually if needed:

```bash
npm run eslint:fix
npm run prettier:write
```

If hooks don’t run automatically after cloning:

```bash
npm run prepare
```

---

## ✅ Submitting a Pull Request

- Keep PRs focused and small if possible.
- Include clear commit messages.
- Make sure your code passes all linters.
- Document any new features or changes in the `README.md` if applicable.

---

## 🐞 Found a Bug?

Please open an issue with:

- A clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details if relevant

---

Thanks again for helping improve the project! 🙌
