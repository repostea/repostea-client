<template>
  <div class="w-full">
    <!-- Simplified view in sidebar (no confirmation) -->
    <div v-if="post.is_nsfw && !showContent && !showFullText" class="relative min-h-[200px]">
      <!-- Blurred content -->
      <div class="blur-[40px] pointer-events-none opacity-20">
        <slot :show-content="false" />
      </div>

      <!-- Overlay -->
      <div class="absolute inset-0 nsfw-overlay-light z-10 rounded-lg" />

      <!-- Simple button to go to post -->
      <div class="absolute inset-0 z-20 flex items-center justify-center p-4">
        <div class="text-center">
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {{ t('posts.nsfw_badge', 'NSFW +18') }}
          </p>
          <NuxtLink
            :to="getPostLink()"
            class="nsfw-view-btn inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium"
          >
            <Icon name="fa6-solid:eye" class="text-xs" aria-hidden="true" />
            <span>{{ t('posts.nsfw_view_content', 'Ver contenido') }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Full view on post page (with confirmation) -->
    <div v-else-if="post.is_nsfw && !showContent && showFullText" class="relative min-h-[400px]">
      <!-- Heavily blurred content in background -->
      <div class="blur-[60px] pointer-events-none opacity-10">
        <slot :show-content="false" />
      </div>

      <!-- Soft overlay -->
      <div class="absolute inset-0 nsfw-overlay-full z-10 rounded-lg" />

      <!-- Centered warning content -->
      <div class="absolute inset-0 z-20 flex items-center justify-center p-6">
        <div class="max-w-md text-center">
          <!-- Title -->
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {{ t('posts.nsfw_warning_title', 'Contenido para adultos') }}
          </h3>

          <!-- Subtitle -->
          <p class="text-sm font-semibold text-red-600 dark:text-red-500 mb-4">
            {{ t('posts.nsfw_adult_only', 'Solo mayores de 18 años') }}
          </p>

          <!-- Content list -->
          <div class="text-left mb-4 text-sm text-gray-700 dark:text-gray-300">
            <p class="font-medium mb-2">
              {{ t('posts.nsfw_warning_message', 'Este contenido puede incluir:') }}
            </p>
            <ul class="space-y-1 pl-5 list-disc">
              <li>
                {{ t('posts.nsfw_explicit_content', 'Desnudos o contenido sexual explícito') }}
              </li>
              <li>{{ t('posts.nsfw_violence', 'Violencia gráfica') }}</li>
              <li>{{ t('posts.nsfw_sensitive', 'Contenido sensible para algunas audiencias') }}</li>
            </ul>
          </div>

          <!-- Age confirmation message -->
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-4">
            {{
              t(
                'posts.nsfw_age_confirmation',
                'Al hacer clic en "Entrar", confirmas que eres mayor de 18 años y aceptas ver contenido explícito.'
              )
            }}
          </p>

          <!-- Enter button -->
          <button
            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors shadow-sm mb-2"
            @click="revealContent"
          >
            {{ t('posts.nsfw_confirm_enter', 'Soy mayor de 18 años, Entrar') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contenido visible (no NSFW o revelado) -->
    <div v-else class="w-full">
      <slot :show-content="true" />

      <!-- Show external link after NSFW confirmation -->
      <div
        v-if="post.is_nsfw && showContent && post.url && showFullText"
        class="nsfw-external-link mt-4 p-4 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <Icon
            name="fa6-solid:arrow-up-right-from-square"
            class="text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          />
          <div class="flex-grow">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {{ t('posts.external_link_available', 'Enlace externo disponible') }}
            </p>
            <a
              :href="post.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:text-primary-dark font-medium break-all"
            >
              {{ post.url }}
            </a>
          </div>
          <a
            :href="post.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors text-sm font-medium"
          >
            {{ t('posts.open_link', 'Abrir enlace') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
    showFullText: {
      type: Boolean,
      default: false,
    },
  })

  const showContent = ref(false)

  function revealContent() {
    showContent.value = true
  }

  function getPostLink() {
    if (props.post.slug) {
      return localePath(`/posts/${props.post.slug}`)
    } else if (props.post.id) {
      return localePath(`/p/${props.post.id}`)
    }
    return '#'
  }
</script>

<style scoped>
  .nsfw-view-btn {
    background-color: var(--color-bg-card);
    border: 2px solid var(--color-border-strong);
    color: var(--color-text-secondary);
  }

  .nsfw-view-btn:hover {
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }

  .nsfw-external-link {
    background-color: var(--color-bg-hover);
    border: 1px solid var(--color-border-default);
  }

  .nsfw-overlay-light {
    background-color: rgba(var(--color-bg-subtle-rgb, 245, 245, 245), 0.8);
  }

  :global(.dark) .nsfw-overlay-light {
    background-color: rgba(17, 17, 17, 0.8);
  }

  .nsfw-overlay-full {
    background-color: rgba(var(--color-bg-subtle-rgb, 245, 245, 245), 0.9);
  }

  :global(.dark) .nsfw-overlay-full {
    background-color: rgba(17, 17, 17, 0.9);
  }
</style>
