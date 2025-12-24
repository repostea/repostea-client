# Cypress E2E Tests

## Requirements
E2E tests require the Nuxt application to be running at `http://localhost:3000`.

## How to run

### 1. Start the development server
```bash
npm run dev
```

### 2. In another terminal, run the E2E tests
```bash
npm run test:e2e
```

## Available commands

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:open` - Open Cypress interactive interface
- `npm run test:e2e:headed` - Run tests with visible browser

## Important note

E2E tests are **NOT run** automatically with `npm test` because they require:
1. The Nuxt server running at `localhost:3000`
2. Possibly the backend API also running

Only unit tests run with `npm test`.

## Available E2E tests

### All tests are ready (551 tests)
All E2E tests now work without backend, only with `npm run dev`:

#### Basic Tests (75 tests)
- `auth-redirect-fix.cy.js` - Authentication redirect handling (8 tests)
- `comment-authentication.cy.js` - Comment authentication (5 tests)
- `comment-permalinks.cy.js` - Comment permalinks (13 tests)
- `markdown.cy.js` - Markdown rendering (10 tests)
- `seo-meta-tags.cy.js` - SEO meta tags (9 tests)
- `navigation-improvements.cy.js` - Navigation improvements (16 tests)
- `post-relationships.cy.js` - Post relationships (14 tests)

#### Critical Tests - Core Features (69 tests)
- `post-creation.cy.js` - Multi-step post creation wizard (15 tests) - CRITICAL
- `voting.cy.js` - Voting system with typed reasons (18 tests) - CRITICAL
- `reporting.cy.js` - Reporting and moderation system (16 tests) - SECURITY
- `authentication-complete.cy.js` - Complete authentication system (20 tests) - CRITICAL

#### Important Tests - Key Features (41 tests)
- `comments-complete.cy.js` - Complete comments system (14 tests) - IMPORTANT
- `user-profile.cy.js` - User profiles and settings (12 tests) - IMPORTANT
- `feed-discovery.cy.js` - Feed, pagination, search and filters (15 tests) - IMPORTANT

#### New Tests - Advanced Features (129 tests)
- `communities.cy.js` - Community management (28 tests) - NEW
- `notifications.cy.js` - Real-time notification system (20 tests) - NEW
- `post-comment-editing.cy.js` - Post and comment editing (33 tests) - NEW
- `saved-lists.cy.js` - Saved items and favorites lists (35 tests) - NEW
- `admin-panel.cy.js` - Admin and moderation panel (31 tests) - NEW

#### Additional Tests - New Features (237 tests)
- `onboarding.cy.js` - 7-step onboarding system (30 tests) - NEW
- `achievements-seals.cy.js` - Achievements and seals system (39 tests) - NEW
- `rankings.cy.js` - Rankings and leaderboards (27 tests) - NEW
- `activity-feed.cy.js` - Real-time activity feed (64 tests) - NEW
- `advanced-search.cy.js` - Advanced search with filters (77 tests) - NEW

**Total: 551 fully mocked E2E tests**

### Feature Coverage

#### Critical Features (100% Coverage)
- **Post Creation** - Complete multi-step wizard
- **Voting System** - 8 vote types with reasons
- **Content Reporting** - Moderation and security
- **Authentication** - Login, registration, guest, recovery

#### Important Features (100% Coverage)
- **Complete Comments** - Create, edit, delete, threading
- **User Profiles** - View profile, settings, avatar
- **Feed and Search** - Listing, pagination, sorting, search

#### Advanced Features (100% Coverage)
- **Communities** - Create, join, leave, view, validation
- **Notifications** - Badge, panel, filters, real-time, pagination
- **Editing** - Posts (title, content, NSFW, language), Comments (markdown)
- **Saved Items** - Read later, favorites, custom lists (create, edit, delete)
- **Admin Panel** - Dashboard, users, reports, settings, karma

#### Engagement Features (100% Coverage) - NEW
- **Onboarding** - 7 guided steps for new users (welcome, discover, create, vote, karma, notifications, features)
- **Achievements and Seals** - Gamification system with unlockable achievements and seals (recommendation/problematic)
- **Rankings** - Leaderboards with timeframe filters (all-time, monthly, weekly) and filtering users with 0 points
- **Activity Feed** - Real-time activity feed with type and time filters (last 24h), infinite scroll
- **Advanced Search** - Search modal with filters (content type, featured/pending, sort, comments), highlighting

#### Basic Features (100% Coverage)
- **SEO** - Meta tags, NSFW, JSON-LD
- **Navigation** - Menus, responsiveness, i18n
- **Markdown** - Rendering and sanitization
- **Post Relationships** - Reply, continuation, related

All tests use `cy.intercept()` to mock API responses, which means:
- No need for Laravel backend running
- No need for database
- Run quickly in CI/CD
- Deterministic and reliable

## Testing Strategy

Current E2E tests use **mocking** with `cy.intercept()`, so:
- **Only need** the Nuxt server running
- **Do NOT need** the Laravel backend
- **Do NOT need** database

**Additional documentation:**
- See `docs/cypress-TESTING_STRATEGY.md` - Testing strategies (mocking vs integration)
- See `docs/cypress-CI_CD.md` - E2E tests in GitHub Actions and CI/CD

## Troubleshooting

### Tests fail with "Timed out waiting for request"
1. Verify the Nuxt server is running: `npm run dev`
2. Verify the application is accessible at `http://localhost:3000`
3. Intercepts must be defined BEFORE `cy.visit()`

### Tests fail because they can't find elements
1. Tests use mocking - you don't need real data
2. Check that `[data-cy=...]` selectors exist in components
3. Verify fixtures in `cypress/fixtures/` have the correct structure
