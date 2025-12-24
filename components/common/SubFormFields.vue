<template>
  <div class="space-y-6">
    <!-- Icon Selection -->
    <div v-if="showIcon" class="space-y-4">
      <h2 v-if="showSectionHeaders" class="text-lg font-semibold flex items-center">
        <Icon name="fa6-solid:image" class="mr-2 text-primary" aria-hidden="true" />
        {{ $t('subs.icon') }}
      </h2>
      <label v-else class="block text-sm font-medium mb-3">{{ $t('subs.icon') }}</label>

      <!-- Icon Preview and Upload Options -->
      <div class="flex items-center gap-4">
        <SubIcon
          :sub="{ icon: modelValue.icon, name: subName }"
          size="xl"
          class="!w-16 !h-16 !text-xl !rounded-xl"
        />
        <div class="flex-1">
          <div class="flex flex-wrap gap-2">
            <!-- Upload Button -->
            <label class="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark cursor-pointer inline-flex items-center">
              <Icon name="fa6-solid:upload" class="mr-2" aria-hidden="true" />
              {{ $t('subs.upload_image') }}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="hidden"
                @change="handleImageUpload"
              >
            </label>
            <!-- Reset to initials -->
            <button
              v-if="modelValue.icon && modelValue.icon !== ''"
              type="button"
              class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              @click="resetToInitials"
            >
              {{ $t('subs.use_initials') }}
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {{ $t('subs.icon_requirements') }}
          </p>
        </div>
      </div>

      <!-- Uploading indicator -->
      <div v-if="uploadingIcon" class="mt-2 text-sm text-gray-500 flex items-center gap-2">
        <Icon name="fa6-solid:spinner" class="animate-spin" aria-hidden="true" />
        {{ $t('common.uploading') }}
      </div>
    </div>

    <!-- Privacy Settings -->
    <div v-if="showPrivacy" class="space-y-4" :class="{ 'pt-4 border-t sub-form-border': showIcon }">
      <h2 v-if="showSectionHeaders" class="text-lg font-semibold flex items-center">
        <Icon name="fa6-solid:shield-halved" class="mr-2 text-primary" aria-hidden="true" />
        {{ $t('subs.settings_privacy') }}
      </h2>
      <h2 v-else class="text-lg font-semibold">{{ $t('subs.settings') }}</h2>

      <div class="space-y-3">
        <!-- Is Private / Is Public -->
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            :checked="useIsPublic ? modelValue.is_public : !modelValue.is_private"
            type="checkbox"
            class="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            @change="togglePrivacy"
          >
          <div>
            <span class="font-medium text-sm">{{ $t('subs.public_sub') }}</span>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              {{ $t('subs.public_description') }}
            </p>
          </div>
        </label>

        <!-- Require Approval -->
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            v-model="modelValue.require_approval"
            type="checkbox"
            class="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          >
          <div>
            <span class="font-medium text-sm">{{ $t('subs.require_approval') }}</span>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              {{ $t('subs.approval_description') }}
            </p>
          </div>
        </label>

        <!-- Allow NSFW -->
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            v-model="modelValue.allow_nsfw"
            type="checkbox"
            class="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          >
          <div>
            <span class="font-medium text-sm">{{ $t('subs.allow_nsfw') }}</span>
            <p v-if="showNsfwDescription" class="text-xs text-gray-600 dark:text-gray-400">
              {{ $t('subs.allow_nsfw_description') }}
            </p>
          </div>
        </label>
      </div>
    </div>

    <!-- Content Types -->
    <div v-if="showContentTypes" class="space-y-4" :class="{ 'pt-4 border-t sub-form-border': showPrivacy || showIcon }">
      <h2 v-if="showSectionHeaders" class="text-lg font-semibold flex items-center">
        <Icon name="fa6-solid:file-lines" class="mr-2 text-primary" aria-hidden="true" />
        {{ $t('subs.settings_content_types') }}
      </h2>
      <h2 v-else class="text-lg font-semibold">{{ $t('subs.allowed_content') }}</h2>
      <p v-if="showContentTypesDescription" class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('subs.settings_content_types_description') }}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label
          v-for="type in contentTypes"
          :key="type.value"
          class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors"
          :class="modelValue.allowed_content_types.includes(type.value) ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'"
        >
          <input
            v-model="modelValue.allowed_content_types"
            type="checkbox"
            :value="type.value"
            class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          >
          <Icon :name="type.icon" class="text-gray-600 dark:text-gray-400" aria-hidden="true" />
          <span class="text-sm">{{ $t(type.label) }}</span>
        </label>
      </div>
    </div>

    <!-- Rules -->
    <div v-if="showRules" class="space-y-4" :class="{ 'pt-4 border-t sub-form-border': showContentTypes || showPrivacy || showIcon }">
      <h2 v-if="showSectionHeaders" class="text-lg font-semibold flex items-center">
        <Icon name="fa6-solid:scale-balanced" class="mr-2 text-primary" aria-hidden="true" />
        {{ $t('subs.rules') }}
      </h2>
      <h2 v-else class="text-lg font-semibold">{{ $t('subs.community_rules') }}</h2>
      <p v-if="showRulesDescription" class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('subs.rules_description') }}
      </p>

      <div class="space-y-3">
        <div
          v-for="(rule, index) in modelValue.rules"
          :key="index"
          class="p-3 border rounded-lg sub-form-border"
        >
          <div class="flex items-start gap-2">
            <span class="text-sm font-bold text-gray-500 mt-2">{{ index + 1 }}.</span>
            <div class="flex-1 space-y-2">
              <input
                v-model="rule.title"
                type="text"
                :placeholder="$t('subs.rule_title_placeholder')"
                :aria-label="$t('subs.rule_title_placeholder')"
                class="w-full px-3 py-1.5 text-sm border rounded sub-form-input"
                maxlength="100"
              >
              <textarea
                v-model="rule.description"
                :placeholder="$t('subs.rule_description_placeholder')"
                :aria-label="$t('subs.rule_description_placeholder')"
                rows="2"
                class="w-full px-3 py-1.5 text-sm border rounded sub-form-input"
                maxlength="500"
              />
            </div>
            <button
              type="button"
              class="p-1 text-red-500 hover:text-red-700"
              :aria-label="$t('common.remove')"
              @click="removeRule(index)"
            >
              <Icon name="fa6-solid:trash" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          v-if="modelValue.rules.length < 10"
          type="button"
          class="w-full py-2 border-2 border-dashed rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors inline-flex items-center justify-center"
          @click="addRule"
        >
          <Icon name="fa6-solid:plus" class="mr-1" aria-hidden="true" />
          {{ $t('subs.add_rule') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNuxtApp } from '#app'
import { useNotification } from '~/composables/useNotification'

const { t } = useI18n()
const { $api } = useNuxtApp()
const { success, error: showError } = useNotification()

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  // For upload - need sub ID (only for editing existing sub)
  subId: {
    type: [Number, String],
    default: null
  },
  // Sub name for showing initials when no icon
  subName: {
    type: String,
    default: ''
  },
  // Control which sections to show
  showIcon: {
    type: Boolean,
    default: true
  },
  showPrivacy: {
    type: Boolean,
    default: true
  },
  showContentTypes: {
    type: Boolean,
    default: true
  },
  showRules: {
    type: Boolean,
    default: true
  },
  // Style options
  showSectionHeaders: {
    type: Boolean,
    default: true
  },
  showNsfwDescription: {
    type: Boolean,
    default: true
  },
  showContentTypesDescription: {
    type: Boolean,
    default: true
  },
  showRulesDescription: {
    type: Boolean,
    default: true
  },
  // Whether to use is_public (create) or is_private (settings)
  useIsPublic: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'icon-uploaded'])

// Local state
const uploadingIcon = ref(false)

// Content types definition
const contentTypes = [
  { value: 'text', label: 'subs.content_type_text', icon: 'fa6-solid:align-left' },
  { value: 'link', label: 'subs.content_type_link', icon: 'fa6-solid:link' },
  { value: 'image', label: 'subs.content_type_image', icon: 'fa6-solid:image' },
  { value: 'video', label: 'subs.content_type_video', icon: 'fa6-solid:video' },
  { value: 'audio', label: 'subs.content_type_audio', icon: 'fa6-solid:headphones' },
  { value: 'poll', label: 'subs.content_type_poll', icon: 'fa6-solid:square-poll-vertical' }
]

// Methods
function resetToInitials() {
  props.modelValue.icon = null
  props.modelValue.icon_file = null
}

function togglePrivacy(event) {
  if (props.useIsPublic) {
    props.modelValue.is_public = event.target.checked
  } else {
    props.modelValue.is_private = !event.target.checked
  }
}

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showError(t('profile.invalid_image_type'))
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showError(t('profile.image_too_large'))
    return
  }

  // For creating new sub, convert to base64 and store temporarily
  if (!props.subId) {
    uploadingIcon.value = true
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        props.modelValue.icon = e.target.result
        props.modelValue.icon_file = file
        uploadingIcon.value = false
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error reading file:', err)
      showError(t('common.error'))
      uploadingIcon.value = false
    }
    event.target.value = ''
    return
  }

  // For editing existing sub, upload directly
  uploadingIcon.value = true
  try {
    const formData = new FormData()
    formData.append('icon', file)
    formData.append('sub_id', props.subId)

    const response = await $api.subs.uploadIcon(props.subId, formData)
    props.modelValue.icon = response.data.icon_url
    success(t('subs.icon_uploaded'))
    emit('icon-uploaded', response.data.icon_url)
  } catch (err) {
    console.error('Error uploading icon:', err)
    showError(err.response?.data?.message || t('common.error'))
  } finally {
    uploadingIcon.value = false
    event.target.value = ''
  }
}

function addRule() {
  if (props.modelValue.rules.length < 10) {
    props.modelValue.rules.push({ title: '', description: '' })
  }
}

function removeRule(index) {
  props.modelValue.rules.splice(index, 1)
}
</script>

<style scoped>
.sub-form-border {
  border-color: var(--color-border-default);
}

.sub-form-input {
  background-color: var(--color-bg-input);
  border-color: var(--color-border-default);
  color: var(--color-text-primary);
}

.sub-form-input:focus {
  border-color: var(--color-primary);
  outline: none;
}
</style>
