const fs = require('fs');
const path = require('path');

// Load .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '');
          env[key.trim()] = value;
        }
      }
    });
  }

  return env;
}

const dotenv = loadEnv();

module.exports = {
  apps: [
    // PRODUCCIÓN - Cluster mode con 4 instancias
    {
      name: 'nuxt-prod',
      script: '.output/server/index.mjs',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        NITRO_PORT: 3100,
        NUXT_PUBLIC_SUPPORTED_LOCALES: dotenv.NUXT_PUBLIC_SUPPORTED_LOCALES || 'es,en,ca,gl,eu',
        NUXT_PUBLIC_DEFAULT_LOCALE: dotenv.NUXT_PUBLIC_DEFAULT_LOCALE || 'es',
      },
      max_memory_restart: '500M',
      error_file: './logs/pm2-prod-error.log',
      out_file: './logs/pm2-prod-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    // STAGING - Cluster mode con 2 instancias
    {
      name: 'nuxt-staging',
      script: '.output/server/index.mjs',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
        NITRO_PORT: 3010,
        NUXT_PUBLIC_SUPPORTED_LOCALES: dotenv.NUXT_PUBLIC_SUPPORTED_LOCALES || 'es,en,ca,gl,eu',
        NUXT_PUBLIC_DEFAULT_LOCALE: dotenv.NUXT_PUBLIC_DEFAULT_LOCALE || 'es',
      },
      max_memory_restart: '500M',
      error_file: './logs/pm2-staging-error.log',
      out_file: './logs/pm2-staging-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
