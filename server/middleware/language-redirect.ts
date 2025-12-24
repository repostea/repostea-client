import { defineEventHandler, getCookie, sendRedirect, getRequestURL, setResponseHeader } from 'h3'

/**
 * Server middleware to handle language redirect on root URL
 *
 * - If user has i18n_redirected cookie → redirect to their saved locale
 * - If no cookie → serve language selector page
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  // Only handle exact root URL
  if (url.pathname !== '/') {
    return
  }

  // Check for language cookie
  const savedLocale = getCookie(event, 'i18n_redirected')

  if (savedLocale) {
    // User has a saved preference, redirect to their locale
    return sendRedirect(event, `/${savedLocale}`, 302)
  }

  // No cookie - serve language selector page
  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')

  // Get supported locales and app name from environment
  const supportedLocales = (process.env.NUXT_PUBLIC_SUPPORTED_LOCALES || 'es,en').split(',').map(l => l.trim())
  const appName = process.env.NUXT_PUBLIC_APP_NAME || 'Repostea'

  const localeInfo: Record<string, { code: string; native: string; tagline: string; slogan: string }> = {
    es: {
      code: 'ES',
      native: 'Español',
      tagline: 'Un espacio digital donde el pensamiento crítico, la diversidad de perspectivas y la calidad del contenido son prioridades fundamentales.',
      slogan: 'Descubre, participa, evoluciona'
    },
    en: {
      code: 'EN',
      native: 'English',
      tagline: 'A digital space where critical thinking, diversity of perspectives, and quality content are fundamental priorities.',
      slogan: 'Discover, participate, evolve'
    },
    ca: {
      code: 'CA',
      native: 'Català',
      tagline: 'Un espai digital on el pensament crític, la diversitat de perspectives i la qualitat del contingut són prioritats fonamentals.',
      slogan: 'Descobreix, participa, evoluciona'
    },
    gl: {
      code: 'GL',
      native: 'Galego',
      tagline: 'Un espazo dixital onde o pensamento crítico, a diversidade de perspectivas e a calidade do contido son prioridades fundamentais.',
      slogan: 'Descobre, participa, evoluciona'
    },
    eu: {
      code: 'EU',
      native: 'Euskara',
      tagline: 'Espazio digitala non pentsamendu kritikoa, ikuspegiaren aniztasuna eta edukinaren kalitatea lehentasun nagusiak diren.',
      slogan: 'Aurkitu, parte hartu, eboluzionatu'
    },
  }

  const localeButtons = supportedLocales
    .map(locale => {
      const info = localeInfo[locale] || { code: locale.toUpperCase(), native: locale, tagline: '', slogan: '' }
      return `
        <a href="/${locale}" class="locale-btn" data-slogan="${info.slogan}" onclick="setLocaleCookie('${locale}')">
          <span class="code">${info.code}</span>
          <span class="name">${info.native}</span>
        </a>
      `
    })
    .join('')

  // Build taglines array for rotation (only supported locales)
  const taglines = supportedLocales
    .map(locale => localeInfo[locale]?.tagline || '')
    .filter(Boolean)

  // Build slogans array for rotation
  const slogans = supportedLocales
    .map(locale => localeInfo[locale]?.slogan || '')
    .filter(Boolean)

  // Build tagline items HTML (duplicated for seamless loop)
  const taglineItems = [...taglines, ...taglines]
    .map(t => `<p class="tagline">${t}</p>`)
    .join('')

  // Calculate scroll duration based on number of taglines (4s per tagline)
  const scrollDuration = taglines.length * 4

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} - Elige tu idioma / Choose your language</title>
  <meta name="description" content="Selecciona tu idioma preferido para continuar a ${appName} - Plataforma de contenido colaborativo">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f9fafb;
      color: #111827;
      padding: 20px;
    }

    /* Blue accent bar at top */
    .accent-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #3b82f6 100%);
    }

    .container {
      text-align: center;
      max-width: 700px;
      width: 100%;
    }

    .logo {
      width: 100px;
      height: 100px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 8px;
      font-weight: 700;
      color: #111827;
    }

    .slogan {
      font-size: 1rem;
      color: #3b82f6;
      margin-bottom: 32px;
      font-weight: 500;
      min-height: 24px;
      transition: opacity 0.3s ease;
    }

    .locales {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }

    .locale-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 16px 24px;
      min-width: 110px;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      color: #111827;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .locale-btn:hover {
      background: #eff6ff;
      border-color: #3b82f6;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .locale-btn:active {
      transform: translateY(0);
    }

    .code {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3b82f6;
    }

    .locale-btn:hover .code {
      color: #2563eb;
    }

    .name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
    }

    /* Tagline scroller */
    .tagline-container {
      height: 120px;
      margin-top: 40px;
      overflow: hidden;
      position: relative;
      max-width: 700px;
      width: 100%;
      mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    }

    .tagline-scroller {
      display: flex;
      flex-direction: column;
      animation: scroll-up var(--scroll-duration, 16s) linear infinite;
    }

    .tagline {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
      padding: 12px 20px;
      text-align: center;
      flex-shrink: 0;
    }

    @keyframes scroll-up {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(-50%);
      }
    }

    .tagline-container:hover .tagline-scroller {
      animation-play-state: paused;
    }

    @media (max-width: 480px) {
      .locale-btn {
        min-width: 100px;
        padding: 14px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="accent-bar"></div>

  <div class="container">
    <img src="/logo-wolf.png" alt="${appName}" class="logo">
    <h1>${appName}</h1>
    <p class="slogan" id="slogan"></p>

    <div class="locales">
      ${localeButtons}
    </div>

    <div class="tagline-container" style="--scroll-duration: ${scrollDuration}s">
      <div class="tagline-scroller">
        ${taglineItems}
      </div>
    </div>
  </div>

  <script>
    function setLocaleCookie(locale) {
      const domain = window.location.hostname;
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = 'i18n_redirected=' + locale + '; path=/; expires=' + expires + '; SameSite=Lax' + (domain !== 'localhost' ? '; domain=' + domain : '');
    }

    const sloganEl = document.getElementById('slogan');

    document.querySelectorAll('.locale-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const locale = this.getAttribute('href').replace('/', '');
        setLocaleCookie(locale);
      });

      // Show slogan on hover
      btn.addEventListener('mouseenter', function() {
        const slogan = this.getAttribute('data-slogan');
        sloganEl.style.opacity = '0';
        setTimeout(() => {
          sloganEl.textContent = slogan;
          sloganEl.style.opacity = '1';
        }, 150);
      });

      btn.addEventListener('mouseleave', function() {
        sloganEl.style.opacity = '0';
        setTimeout(() => {
          sloganEl.textContent = '';
        }, 150);
      });
    });
  </script>
</body>
</html>`
})
