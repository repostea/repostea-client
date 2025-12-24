import { marked } from 'marked'

/**
 * Check if a URL is from localhost (development environment)
 */
function isLocalhostUrl(url) {
  if (!url) return false
  return url.includes('localhost') || url.includes('127.0.0.1')
}

/**
 * Check if URL is an animated GIF that should not be processed by IPX
 * IPX converts images to WebP which breaks GIF animations
 */
function isAnimatedGif(url) {
  if (!url) return false
  // Check if it's a .gif file or from known GIF providers
  return (
    url.toLowerCase().endsWith('.gif') ||
    url.includes('tenor.com') ||
    url.includes('giphy.com') ||
    url.includes('gfycat.com')
  )
}

/**
 * Check if image alt text contains NSFW marker
 */
function isNsfwImage(altText) {
  return altText && altText.includes('{nsfw}')
}

/**
 * Remove NSFW marker from alt text
 */
function cleanAltText(altText) {
  return altText ? altText.replace('{nsfw}', '').trim() : ''
}

/**
 * Creates a custom marked renderer that optimizes images
 * - Adds loading="lazy" to all images
 * - Transforms image URLs to use IPX proxy for optimization (except localhost in dev)
 * - Stores original URL in data-original-src for lightbox full-size viewing
 * - Wraps NSFW images in blur container (detected by {nsfw} marker in alt text)
 */
export function createOptimizedRenderer() {
  const renderer = new marked.Renderer()

  // marked v4+ passes a token object instead of individual params
  renderer.image = ({ href, title, text }) => {
    const originalSrc = href
    let src = href

    // Use IPX proxy for optimization (800px width, webp, 80% quality)
    // Skip IPX for:
    // - localhost URLs in development (IPX doesn't whitelist localhost)
    // - Animated GIFs (IPX converts to WebP which breaks animations)
    if (href && !isLocalhostUrl(href) && !isAnimatedGif(href)) {
      src = `/_ipx/w_800,f_webp,q_80/${href}`
    }

    // Check if image is NSFW
    const isNsfw = isNsfwImage(text)
    const cleanedAlt = isNsfw ? cleanAltText(text) : text

    const titleAttr = title ? ` title="${title}"` : ''
    const altAttr = cleanedAlt ? ` alt="${cleanedAlt}"` : ''
    // Store original URL for lightbox to show full resolution
    const dataOriginal = originalSrc ? ` data-original-src="${originalSrc}"` : ''

    const imgTag = `<img src="${src}" loading="lazy"${altAttr}${titleAttr}${dataOriginal} />`

    // Wrap NSFW images in blur container with elaborate overlay
    // Text is added via CSS ::after pseudo-elements for i18n support
    if (isNsfw) {
      return `<span class="nsfw-image-container">
        <span class="nsfw-blur-wrapper">${imgTag}</span>
        <span class="nsfw-overlay">
          <span class="nsfw-content">
            <span class="nsfw-title"></span>
            <span class="nsfw-adult-only"></span>
            <span class="nsfw-enter-btn"></span>
          </span>
        </span>
      </span>`
    }

    return imgTag
  }

  return renderer
}

/**
 * Process large emoji syntax before markdown parsing
 * :::emoji::: = extra large (text-4xl)
 * ::emoji:: = large (text-2xl)
 */
export function processLargeEmojis(text) {
  if (!text) return text

  // Process ::: first (extra large) - must be before :: to avoid conflicts
  // Match emojis and short text (1-5 chars) between :::
  text = text.replace(/:::([\p{Emoji}\p{Emoji_Component}]{1,10}|.{1,5}):::/gu, (match, content) => {
    return `<span class="emoji-xl">${content}</span>`
  })

  // Process :: (large)
  text = text.replace(/::([\p{Emoji}\p{Emoji_Component}]{1,10}|.{1,5})::/gu, (match, content) => {
    return `<span class="emoji-lg">${content}</span>`
  })

  return text
}

/**
 * Configure marked with optimized settings
 */
export function configureMarked() {
  marked.setOptions({
    breaks: true,
    gfm: true,
    pedantic: false,
    sanitize: false,
    smartypants: false,
    renderer: createOptimizedRenderer(),
  })
}

/**
 * DOMPurify configuration for restricted markdown (descriptions)
 * Allows basic formatting and emojis but NO images or GIFs
 * Used for: link, video, image, audio, poll content types
 */
export const RESTRICTED_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'del',
    's',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'hr',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  FORBID_TAGS: [
    'img',
    'video',
    'audio',
    'iframe',
    'object',
    'embed',
    'script',
    'form',
    'input',
    'textarea',
    'button',
    'svg',
    'math',
    'canvas',
  ],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
    'style',
  ],
}

/**
 * DOMPurify configuration for full markdown (text posts)
 * Allows images and full formatting
 */
export const FULL_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'del',
    's',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'loading', 'data-original-src'],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
  ],
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'button'],
  ADD_ATTR: ['target'],
  ADD_DATA_URI_TAGS: ['img'],
}

/**
 * Embed syntax pattern: [embed:provider](url)
 * Used in comments and agora messages to embed external content
 */
const EMBED_PATTERN = /\[embed:([^\]]+)\]\(([^)]+)\)/g

/**
 * Extract embeds from content
 * Returns array of { provider, url, fullMatch, index }
 */
export function extractEmbeds(content) {
  if (!content) return []

  const embeds = []
  let match

  // Reset regex state
  EMBED_PATTERN.lastIndex = 0

  while ((match = EMBED_PATTERN.exec(content)) !== null) {
    embeds.push({
      provider: match[1],
      url: match[2],
      fullMatch: match[0],
      index: match.index,
    })
  }

  return embeds
}

/**
 * Remove embed syntax from content, replacing with placeholder markers
 * Returns the modified content with placeholders
 */
export function replaceEmbedsWithPlaceholders(content) {
  if (!content) return content

  let index = 0
  return content.replace(EMBED_PATTERN, () => {
    return `<!--EMBED_PLACEHOLDER_${index++}-->`
  })
}

/**
 * Check if content contains any embeds
 */
export function hasEmbeds(content) {
  if (!content) return false
  EMBED_PATTERN.lastIndex = 0
  return EMBED_PATTERN.test(content)
}
