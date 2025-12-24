<template>
  <footer class="gradient-bg text-white py-6">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
        <!-- Site Section -->
        <div>
          <h3 class="text-lg font-bold mb-4">{{ siteName }}</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <a
                :href="getFooterUrl('', $i18n.locale)"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.home') }}
              </a>
            </li>
            <li>
              <a
                :href="getFooterUrl('manifesto', $i18n.locale)"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.manifesto') }}
              </a>
            </li>
            <li>
              <a
                :href="getFooterUrl('about', $i18n.locale)"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.about') }}
              </a>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/help')"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('help.title') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- RSS Feeds Section -->
        <div>
          <h3 class="text-lg font-bold mb-4">{{ t('footer.rss_feeds') }}</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <a
                :href="`${getBackendUrl()}/rss/published`"
                class="text-white hover:text-blue-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('footer.rss_published') }}
              </a>
            </li>
            <li>
              <a
                :href="`${getBackendUrl()}/rss/queued`"
                class="text-white hover:text-blue-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ t('footer.rss_queued') }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Fediverse Section -->
        <div v-if="fediverseHandle">
          <h3 class="text-lg font-bold mb-4">{{ t('footer.fediverse') }}</h3>
          <p class="text-xs opacity-80 mb-3">{{ t('footer.fediverse_description') }}</p>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center">
              <Icon name="fa6-solid:globe" class="mr-2 w-4 flex-shrink-0" aria-hidden="true" />
              <code class="text-blue-200 text-xs break-all">{{ fediverseHandle }}</code>
            </li>
          </ul>
        </div>

        <!-- Contact Section -->
        <div v-if="contactEmail">
          <h3 class="text-lg font-bold mb-4">{{ t('footer.contact') }}</h3>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center">
              <Icon name="fa6-solid:envelope" class="mr-2 w-4" aria-hidden="true" />
              <span>{{ contactEmail }}</span>
            </li>
          </ul>
        </div>

        <!-- Legal Documents Section -->
        <div>
          <h3 class="text-lg font-bold mb-4">{{ t('footer.legal_documents') }}</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <a
                :href="getFooterUrl('privacy', $i18n.locale)"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.privacy_policy') }}
              </a>
            </li>
            <li>
              <a
                :href="getFooterUrl('terms', $i18n.locale)"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.terms') }}
              </a>
            </li>
            <li>
              <a
                :href="getFooterUrl('cookies', $i18n.locale)"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.cookies') }}
              </a>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/accessibility')"
                class="text-white hover:text-blue-200 transition-colors"
              >
                {{ t('footer.accessibility') }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
      <!-- Copyright and Purpose Section -->
      <div class="border-t border-white border-opacity-10 pt-6">
        <div
          class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
        >
          <div class="text-sm">
            <p>&copy; {{ new Date().getFullYear() }} {{ siteName }}. {{ t('footer.rights_reserved') }}</p>
            <p class="text-xs opacity-70 mt-1">
              Powered by <a href="https://github.com/repostea" target="_blank" rel="noopener" class="underline hover:opacity-80 transition-opacity">Repostea</a> - Open Source Software (GPL v3)
            </p>
          </div>
          <div class="text-sm opacity-80 max-w-md text-left md:text-right">
            <p>{{ t('footer.purpose_text') }}</p>
          </div>
        </div>
      </div>


    </div>
  </footer>
</template>

<script setup>
  import { useI18n, useLocalePath } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { getFooterUrl, getBackendUrl } = useAppUrl()
  const config = useRuntimeConfig()

  const siteName = config.public.appName || 'Repostea'
  const contactEmail = config.public.contactEmail || ''
  const fediverseHandle = config.public.fediverseHandle || ''
</script>

<style scoped>
  .gradient-bg {
    background: linear-gradient(135deg, var(--color-navbar-bg) 0%, var(--color-navbar-bg) 100%);
  }

  @media (max-width: 768px) {
    .border-t.border-primary.pt-6 {
      flex-direction: column;
      align-items: center;
    }

    .border-t.border-primary.pt-6 > div:first-child {
      margin-bottom: 1rem;
      order: 2;
    }

    .border-t.border-primary.pt-6 > div:last-child {
      margin-bottom: 1rem;
      order: 1;
    }
  }
</style>
