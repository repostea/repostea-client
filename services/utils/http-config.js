/**
 * Configuración centralizada para llamadas HTTP externas
 * Incluye User-Agent profesional e información de contacto
 */

export const HTTP_CONFIG = {
  userAgent: 'Repostea/1.0 (+https://github.com/repostea)',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'es,en;q=0.9',
    'Cache-Control': 'no-cache',
  },
}

/**
 * Genera headers estándar para llamadas a APIs externas
 * @param {string} referrer - URL de referencia opcional
 * @returns {Object} Headers configurados
 */
export function createHttpHeaders(referrer = null) {
  const headers = {
    ...HTTP_CONFIG.headers,
    'User-Agent': HTTP_CONFIG.userAgent,
  }

  if (referrer) {
    headers['Referer'] = referrer
  }

  return headers
}

/**
 * Configuración de axios para servicios de agregadores
 * @param {string} baseURL - URL base del servicio
 * @param {number} timeout - Timeout personalizado (opcional)
 * @returns {Object} Configuración de axios
 */
export function createAxiosConfig(baseURL, timeout = HTTP_CONFIG.timeout) {
  return {
    baseURL,
    timeout,
    headers: createHttpHeaders(baseURL),
  }
}

export default {
  HTTP_CONFIG,
  createHttpHeaders,
  createAxiosConfig,
}
