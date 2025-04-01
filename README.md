# Repostea Client (Nuxt 3 Minimal Starter)

A minimal and customizable Nuxt 3 frontend for content aggregation platforms.

📚 Check out the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

---

## 🚀 Quick Setup

### 1. Clone the repository

```bash
git clone https://github.com/repostea/repostea-client
cd repostea-client
```

### 2. Install dependencies

```bash
npm install
```

You can also use `pnpm`, `yarn`, or `bun` if preferred.

---

## ⚙️ Environment Configuration

### Create your `.env` file

```bash
cp .env.example .env
```

Then edit `.env` with your own credentials:

```env
REPOSTEA_API_KEY=your_api_key
REPOSTEA_ID=your_tenant_id
NUXT_PUBLIC_API_BASE=https://api.repostea.com/api/v1
```

### Supabase integration

To enable Supabase authentication, also set:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_api_key
```

---

## 🛠 Development

Start the development server at `http://localhost:3000`:

```bash
npm run dev
```

---

## 🧪 Code Quality

This project uses the following tools to ensure consistent code quality:

- **Prettier** for code formatting
- **ESLint** for linting JavaScript/TypeScript
- **Stylelint** for CSS/Tailwind
- **Husky** and **lint-staged** to enforce formatting on commit

### Manual usage

```bash
# Format all code with Prettier
npm run prettier:write

# Fix lint issues with ESLint
npm run eslint:fix
```

### Auto-run on commit

Husky and lint-staged automatically run linters on staged files before each commit.

If hooks are not working after cloning, run:

```bash
npm run prepare
```

---

## 🧩 Customization

Once deployed, you can customize your platform from the admin panel:

- Set primary and secondary colors
- Upload logo and favicon
- Select data sources and fonts
- Configure voting thresholds and karma
- Enable/disable optional features

---

## 📦 Production

### Build for production

```bash
npm run build
```

### Deploy to your server

```bash
rsync -av .output/ /var/www/html/
```

---

## 🌐 Domain Setup

You have two options:

- **Option 1**: Use our subdomain (e.g. `yourname.repostea.com`)
- **Option 2**: Use your own custom domain (e.g. `yourdomain.com`)

This is a static site, so it can be hosted on:

- Vercel
- Netlify
- GitHub Pages
- Any static hosting provider


---

## 🙌 Attribution

If you use this project publicly, please give credit to [Repostea](https://github.com/repostea) with a link to the original repository.

---

## 📄 License

This project is licensed under the MIT License.  
© 2025 [Repostea](https://github.com/repostea). Attribution is appreciated.
