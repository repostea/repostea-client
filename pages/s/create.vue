<template>
  <div class="container mx-auto p-2 sm:p-4 max-w-3xl">
    <!-- Beta Warning Banner -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <Icon name="fa6-solid:triangle-exclamation" class="text-yellow-600 dark:text-yellow-400 text-lg mt-0.5" aria-hidden="true" />
        <div>
          <h3 class="font-semibold text-yellow-900 dark:text-yellow-200 text-sm mb-1">
            {{ $t('subs.beta_warning.title') }}
          </h3>
          <p class="text-yellow-800 dark:text-yellow-300 text-xs">
            {{ $t('subs.beta_warning.description') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading state while checking requirements -->
    <div v-if="isCheckingRequirements" class="py-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"/>
      <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('common.loading') }}</p>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <div class="card-bg rounded-lg shadow-sm border settings-border">
        <div class="px-6 py-4 border-b settings-border">
          <h1 class="text-xl font-bold inline-flex items-center">
            <Icon name="fa6-solid:plus" class="mr-2" aria-hidden="true" />
            {{ $t('subs.create_sub') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ $t('subs.create_description') }}
          </p>
        </div>

        <!-- Requirements Warning (only shown when needed) -->
        <div
          v-if="authStore.isAuthenticated && !meetsRequirements"
          class="mx-6 mt-6 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 dark:border-yellow-600 rounded p-4"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <Icon name="fa6-solid:circle-exclamation" class="text-yellow-500 dark:text-yellow-400 text-lg" aria-hidden="true" />
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                {{ $t('subs.requirements_not_met') }}
              </h3>
              <p class="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                {{ $t('subs.requirements_description') }}
              </p>
              <ul class="space-y-2">
                <li class="flex items-start">
                  <Icon
                    :name="hasEnoughKarma ? 'fa6-solid:circle-check' : 'fa6-solid:circle-xmark'"
                    :class="hasEnoughKarma ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                    class="mr-2 mt-0.5"
                    aria-hidden="true"
                  />
                  <span class="text-xs text-yellow-800 dark:text-yellow-200">
                    {{ karmaRequirementText }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form
          class="p-6 space-y-6"
          :class="{ 'opacity-50 pointer-events-none': authStore.isAuthenticated && !meetsRequirements }"
          @submit.prevent="handleSubmit"
        >
          <!-- Basic Information -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Icon name="fa6-solid:circle-info" class="mr-2 text-primary" aria-hidden="true" />
              {{ $t('subs.basic_info') }}
            </h2>

              <div>
                <label for="name" class="block text-sm font-medium mb-1">
                  {{ $t('subs.sub_name') }} *
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 dark:text-gray-400">s/</span>
                  </div>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                    pattern="[a-zA-Z0-9_\-]+"
                    :class="[
                      'w-full pl-8 pr-3 py-2 rounded-md border settings-input',
                      nameValidationError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'focus:ring-2 focus:ring-primary'
                    ]"
                    :placeholder="$t('subs.name_placeholder')"
                  >
                </div>
                <p v-if="nameValidationError" class="mt-1 text-xs text-red-600 dark:text-red-400 inline-flex items-center"><Icon name="fa6-solid:circle-exclamation" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ nameValidationError }}</span>
                </p>
                <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ $t('subs.name_requirements') }}
                </p>
              </div>

              <div>
                <label for="title" class="block text-sm font-medium mb-1">
                  {{ $t('subs.title') }} *
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  maxlength="100"
                  class="w-full px-3 py-2 border rounded-md settings-input"
                  :placeholder="$t('subs.title_placeholder')"
                >
              </div>

              <div>
                <label for="description" class="block text-sm font-medium mb-1">
                  {{ $t('subs.description') }} *
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  required
                  rows="3"
                  maxlength="500"
                  class="w-full px-3 py-2 border rounded-md settings-input"
                  :placeholder="$t('subs.description_placeholder')"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ form.description.length }}/500
                </p>
              </div>
            </div>

            <!-- Shared Form Fields (Icon, Settings, Content Types, Rules) -->
            <SubFormFields
              v-model="form"
              :sub-name="form.name"
              :show-section-headers="true"
              :show-nsfw-description="true"
              :show-content-types-description="true"
              :show-rules-description="false"
              :use-is-public="true"
            />

          <!-- Error Display -->
          <div
            v-if="error"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <p class="text-red-600 dark:text-red-400 text-sm">{{ error }}</p>
          </div>

          <!-- Authentication Message for Anonymous Users -->
          <div
            v-if="!authStore.isAuthenticated"
            class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
          >
            <div class="flex items-center">
              <Icon name="fa6-solid:circle-info" class="text-blue-500 mr-2" aria-hidden="true" />
              <p class="text-blue-600 dark:text-blue-400 text-sm">
                {{ $t('subs.create_login_required') }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 border-t settings-border flex justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              @click="$router.go(-1)"
            >
              {{ $t('common.cancel') }}
            </button>

            <button
              type="submit"
              :disabled="loading || !isFormValid || !authStore.isAuthenticated || !meetsRequirements"
              class="px-6 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              <Icon v-if="loading" name="fa6-solid:spinner" class="mr-2 flex-shrink-0 animate-spin" aria-hidden="true" />
              <span>{{ $t('subs.create_sub') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useNuxtApp } from '#app'
  import { useAuthStore } from '~/stores/auth'
  import { useSubsStore } from '~/stores/subs'

  const { t } = useI18n()
  const { $navigateWithLocale } = useNuxtApp()
  const authStore = useAuthStore()
  const subsStore = useSubsStore()

  // Meta
  definePageMeta({
    middleware: 'auth',
    title: 'Create Sub',
  })

  // State
  const loading = computed(() => subsStore.loading)
  const error = computed(() => subsStore.error)

  const form = ref({
    name: '',
    title: '',
    description: '',
    icon: null,
    is_public: true,
    require_approval: false,
    allow_nsfw: true,
    allowed_content_types: ['text', 'link', 'image', 'video', 'audio', 'poll'],
    rules: [{ title: '', description: '' }],
  })

  // Requirements (must match backend StoreSubRequest.php)
  const MIN_KARMA = 1000

  const user = computed(() => authStore.user)
  const isCheckingRequirements = computed(() => authStore.isAuthenticated && !user.value)

  const userKarma = computed(() => user.value?.karma_points || 0)
  const canCreateSubs = computed(() => user.value?.can_create_subs || false)

  const hasEnoughKarma = computed(() => userKarma.value >= MIN_KARMA)
  const meetsRequirements = computed(() => canCreateSubs.value || hasEnoughKarma.value)

  const karmaRequirementText = computed(() => {
    if (hasEnoughKarma.value) {
      return t('subs.requirement_karma_met')
    }
    return t('subs.requirement_karma')
  })

  // Validation
  const nameValidationError = computed(() => {
    if (!form.value.name) return null

    const name = form.value.name.trim()

    if (name.length < 3) {
      return t('subs.name_too_short')
    }

    if (name.length > 25) {
      return t('subs.name_too_long')
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return t('subs.name_invalid_chars')
    }

    return null
  })

  // Computed
  const isFormValid = computed(() => {
    return (
      form.value.name.trim() &&
      form.value.title.trim() &&
      form.value.description.trim() &&
      form.value.allowed_content_types.length > 0 &&
      /^[a-zA-Z0-9_-]+$/.test(form.value.name) &&
      !nameValidationError.value
    )
  })

  // Methods
  async function handleSubmit() {
    if (!isFormValid.value) return

    // Clear any previous errors
    subsStore.clearError()

    try {
      // Filter out empty rules
      const validRules = form.value.rules.filter(
        (rule) => rule.title.trim() || rule.description.trim()
      )

      const subData = {
        name: form.value.name.toLowerCase().trim(),
        display_name: form.value.title.trim(),
        description: form.value.description.trim(),
        icon: form.value.icon,
        is_private: !form.value.is_public,
        is_adult: form.value.allow_nsfw,
        visibility: form.value.require_approval ? 'private' : 'visible',
        rules: validRules.length > 0 ? JSON.stringify(validRules) : null,
      }

      const createdSub = await subsStore.createSub(subData)

      // Navigate to the new sub
      const subName = createdSub?.name || subData.name
      $navigateWithLocale('/s/' + subName)
    } catch (err) {
      console.error('Error creating sub:', err)
      // Error is already handled by the store
    }
  }

  // Note: We allow access to this page for all users, but disable form submission for unauthenticated users
</script>

<style scoped>
.card-bg {
  background-color: var(--color-bg-card);
}

.settings-border {
  border-color: var(--color-border-default);
}

.settings-input {
  background-color: var(--color-bg-input);
  border-color: var(--color-border-default);
  color: var(--color-text-primary);
}

.settings-input:focus {
  border-color: var(--color-primary);
  outline: none;
}
</style>

