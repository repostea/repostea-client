<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.details_step') }}</h2>
      <p class="text-gray-600 dark:text-gray-400">{{ t('submit.wizard.details_subtitle') }}</p>
    </div>

    <div class="max-w-2xl mx-auto space-y-4">
      <!-- Language selection -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('submit.form.language') }}
          <span class="text-red-500">*</span>
        </label>
        <PostLanguageSelector
          :model-value="languageCode"
          @update:model-value="$emit('update:languageCode', $event)"
        />
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {{ t('submit.form.language_help') }}
        </p>
        <p
          v-if="!languageCode"
          class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1"
        >
          <Icon
            name="fa6-solid:triangle-exclamation"
            class="mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{{ t('submit.form.language_required_notice') }}</span>
        </p>
      </div>

      <!-- Subcommunity selection (only if user is authenticated) -->
      <div v-if="isAuthenticated && !isGuest">
        <label class="block text-sm font-medium mb-2">
          {{ t('subs.post_in_sub') }}
        </label>
        <PostSubSelector
          :model-value="subId"
          :my-subs="mySubs"
          :current-sub="currentPostSub"
          @update:model-value="$emit('update:subId', $event)"
        />
      </div>

      <!-- Checkbox for anonymous posting (only for registered users) -->
      <div v-if="!isGuest" class="flex items-start space-x-3">
        <input
          id="guest"
          :checked="isAnonymous"
          type="checkbox"
          data-testid="guest-checkbox"
          class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
          @change="$emit('update:isAnonymous', $event.target.checked)"
        >
        <div>
          <label for="guest" class="text-sm font-medium">
            {{ t('submit.form.post_anonymously') }}
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('submit.wizard.anonymous_help') }}
          </p>
          <p
            v-if="isAnonymous"
            class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1"
          >
            <Icon
              name="fa6-solid:circle-info"
              class="mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{{ t('submit.wizard.anonymous_moderator_note') }}</span>
          </p>
        </div>
      </div>

      <!-- Checkbox for NSFW content -->
      <div class="flex items-start space-x-3">
        <input
          id="is_nsfw"
          :checked="isNsfw"
          type="checkbox"
          data-testid="nsfw-checkbox"
          class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-500"
          @change="$emit('update:isNsfw', $event.target.checked)"
        >
        <div>
          <label for="is_nsfw" class="text-sm font-medium">
            {{ t('submit.form.is_nsfw', 'Mark as NSFW/adult content (+18)') }}
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('submit.form.nsfw_help', 'NSFW content includes nudity, sexual content or graphic violence') }}
          </p>
        </div>
      </div>

      <!-- Checkbox for ActivityPub federation (only if user has federation enabled) -->
      <div v-if="isFederationEnabled && !isGuest" class="flex items-start space-x-3">
        <input
          id="should_federate"
          :checked="shouldFederate"
          type="checkbox"
          data-testid="federate-checkbox"
          class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
          @change="$emit('update:shouldFederate', $event.target.checked)"
        >
        <div>
          <label
            for="should_federate"
            class="text-sm font-medium inline-flex items-center gap-2"
          >
            <Icon name="fa6-solid:globe" class="text-primary" aria-hidden="true" />
            {{ t('submit.form.federate_post') }}
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('submit.form.federate_post_help') }}
          </p>
        </div>
      </div>

      <!-- Thumbnail Uploader (hidden for videos) -->
      <div v-if="contentType !== 'video'">
        <label class="block text-sm font-medium mb-2">
          {{ t('submit.form.image') }}
        </label>
        <ClientOnly>
          <ThumbnailUploader
            :current-thumbnail="thumbnailUrl"
            :post-id="effectivePostId"
            @thumbnail-updated="$emit('thumbnail-updated', $event)"
            @thumbnail-deleted="$emit('thumbnail-deleted')"
          />
        </ClientOnly>
      </div>

      <!-- Relate to other content (only if draft was already saved) -->
      <div v-if="effectivePostId" class="wizard-relations-box rounded-lg p-4">
        <div class="mb-3">
          <div class="mb-2">
            <h4 class="text-sm font-medium text-text dark:text-text-dark flex items-center">
              <Icon
                name="fa6-solid:link"
                class="mr-2 text-gray-600 dark:text-gray-400 flex-shrink-0"
                aria-hidden="true"
              />
              <span>{{ t('submit.form.related_content') }}</span>
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('submit.form.related_content_help') }}
            </p>
          </div>

          <!-- Two separate buttons for each relationship type -->
          <div class="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              class="flex-1 px-3 py-2 text-sm wizard-relation-btn text-text dark:text-text-dark rounded-lg transition-colors flex items-center justify-center gap-2"
              @click="$emit('add-relationship', 'own')"
            >
              <Icon name="fa6-solid:circle-user" class="text-xs" aria-hidden="true" />
              <span>{{ t('submit.form.add_own_relation') }}</span>
            </button>
            <button
              type="button"
              class="flex-1 px-3 py-2 text-sm wizard-relation-btn text-text dark:text-text-dark rounded-lg transition-colors flex items-center justify-center gap-2"
              @click="$emit('add-relationship', 'external')"
            >
              <Icon name="fa6-solid:link" class="text-xs" aria-hidden="true" />
              <span>{{ t('submit.form.add_external_relation') }}</span>
            </button>
          </div>
        </div>

        <!-- List of added relationships -->
        <div v-if="postRelationships.length > 0" class="space-y-2">
          <div
            v-for="rel in postRelationships"
            :key="rel.id"
            class="flex items-center justify-between p-2 wizard-relation-item rounded"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-text dark:text-text-dark truncate">
                {{ rel.post.title }}
              </div>
              <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {{ t('posts.relationships.types.' + rel.type) }}
              </div>
            </div>
            <button
              type="button"
              class="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1"
              :title="t('common.delete')"
              :aria-label="t('common.delete')"
              @click.stop="$emit('remove-relationship', rel.id)"
            >
              <Icon name="fa6-solid:xmark" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div v-else class="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          {{ t('posts.relationships.none') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'

  const { t } = useI18n()

  defineProps({
    languageCode: {
      type: String,
      default: '',
    },
    subId: {
      type: [Number, String],
      default: null,
    },
    mySubs: {
      type: Array,
      default: () => [],
    },
    currentPostSub: {
      type: Object,
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isNsfw: {
      type: Boolean,
      default: false,
    },
    shouldFederate: {
      type: Boolean,
      default: true,
    },
    isFederationEnabled: {
      type: Boolean,
      default: false,
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    contentType: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    effectivePostId: {
      type: [Number, String],
      default: null,
    },
    postRelationships: {
      type: Array,
      default: () => [],
    },
  })

  defineEmits([
    'update:languageCode',
    'update:subId',
    'update:isAnonymous',
    'update:isNsfw',
    'update:shouldFederate',
    'thumbnail-updated',
    'thumbnail-deleted',
    'add-relationship',
    'remove-relationship',
  ])
</script>
