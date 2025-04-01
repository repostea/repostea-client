<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-3xl mx-auto">
      <div
        class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-6"
      >
        <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
          <h4 class="font-medium text-lg flex items-center">
            <i class="fas fa-plus-circle mr-2"></i>{{ $t('links.submit.title') }}
          </h4>
        </div>
        <div class="p-6">
          <div
            v-if="Object.keys(errors).length > 0"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4"
          >
            <ul class="list-disc pl-5">
              <li v-for="(error, index) in flattenErrors" :key="index" class="text-sm">
                {{ error }}
              </li>
            </ul>
          </div>

          <form @submit.prevent="submitLink">
            <div class="mb-4">
              <label for="title" class="block text-sm font-medium mb-1">
                {{ $t('links.submit.form.title') }}
                <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.title,
                }"
                id="title"
                v-model="formData.title"
                maxlength="140"
                required
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{
                  $t('links.submit.form.title_help', {
                    max: 140,
                  })
                }}
              </p>
            </div>

            <div class="mb-4">
              <label for="url" class="block text-sm font-medium mb-1">
                {{ $t('links.submit.form.url') }}
              </label>
              <input
                type="url"
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.url,
                }"
                id="url"
                v-model="formData.url"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t('links.submit.form.url_help') }}
              </p>
            </div>

            <div class="mb-4">
              <label for="description" class="block text-sm font-medium mb-1">
                {{ $t('links.submit.form.description') }}
                <span class="text-red-500">*</span>
              </label>
              <textarea
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.description,
                }"
                id="description"
                v-model="formData.description"
                rows="3"
                maxlength="600"
                required
              ></textarea>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{
                  $t('links.submit.form.description_help', {
                    max: 600,
                  })
                }}
              </p>
            </div>

            <div class="mb-4">
              <label for="content" class="block text-sm font-medium mb-1">
                {{ $t('links.submit.form.content') }}
              </label>
              <textarea
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.content,
                }"
                id="content"
                v-model="formData.content"
                rows="6"
              ></textarea>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t('links.submit.form.content_help') }}
              </p>
            </div>

            <div class="mb-4">
              <label for="tags" class="block text-sm font-medium mb-1">
                {{ $t('links.submit.form.tags') }}
                <span class="text-red-500">*</span>
              </label>
              <select
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.tags,
                }"
                id="tags"
                v-model="formData.tags"
                multiple
                required
              >
                <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                  {{ tag.name }}
                </option>
              </select>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t('links.submit.form.select_tags') }}
              </p>
            </div>

            <div class="mb-4">
              <label for="image" class="block text-sm font-medium mb-1">
                {{ $t('links.submit.form.image') }}
              </label>
              <input
                type="file"
                class="w-full rounded-md border border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.image,
                }"
                id="image"
                @change="handleFileUpload"
                accept="image/*"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t('links.submit.form.image_help') }}
              </p>
            </div>

            <div class="mb-6">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  :class="{ 'border-red-500': errors.nsfw }"
                  id="nsfw"
                  v-model="formData.nsfw"
                />
                <label for="nsfw" class="ml-2 block text-sm">
                  {{ $t('links.submit.form.nsfw') }}
                </label>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                {{ $t('links.submit.form.nsfw_help') }}
              </p>
            </div>

            <div
              class="border-t border-gray-200 dark:border-neutral-700 pt-6 flex justify-end space-x-3"
            >
              <NuxtLink
                to="/"
                class="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {{ $t('links.submit.form.cancel') }}
              </NuxtLink>
              <button
                type="submit"
                class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium transition-colors"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                ></span>
                {{ $t('links.submit.form.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700"
      >
        <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
          <h5 class="font-medium flex items-center">
            <i class="fas fa-info-circle mr-2"></i>{{ $t('links.submit.tips_title') }}
          </h5>
        </div>
        <div class="p-6">
          <ul class="list-disc pl-5 space-y-1">
            <li>{{ $t('links.submit.tips.descriptive_title') }}</li>
            <li>{{ $t('links.submit.tips.no_caps') }}</li>
            <li>{{ $t('links.submit.tips.clear_description') }}</li>
            <li>{{ $t('links.submit.tips.relevant_tags') }}</li>
            <li>{{ $t('links.submit.tips.own_content') }}</li>
            <li>{{ $t('links.submit.tips.mark_nsfw') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const loading = ref(false)
  const errors = ref({})
  const tags = ref([])
  const { $api } = useNuxtApp()

  const formData = reactive({
    title: '',
    url: '',
    content: '',
    description: '',
    tags: [],
    nsfw: false,
    image: null,
  })

  const flattenErrors = computed(() => {
    const flattened = []
    for (const field in errors.value) {
      if (Array.isArray(errors.value[field])) {
        errors.value[field].forEach((message) => flattened.push(message))
      }
    }
    return flattened
  })

  onMounted(async () => {
    try {
      const response = await $api.tags.getTags()
      tags.value = response.data.data
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  })

  function handleFileUpload(event) {
    formData.image = event.target.files[0] || null
  }

  async function submitLink() {
    loading.value = true
    errors.value = {}

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)

      if (formData.url) formDataToSend.append('url', formData.url)
      if (formData.content) formDataToSend.append('content', formData.content)
      if (formData.image) formDataToSend.append('image', formData.image)

      formDataToSend.append('nsfw', formData.nsfw ? '1' : '0')

      formData.tags.forEach((tagId) => {
        formDataToSend.append('tags[]', tagId)
      })

      const response = await $api.links.createLink(formDataToSend)

      const { success } = useToast()
      success(response.data.message)
      router.push(`/links/${response.data.data.id}`)
    } catch (error) {
      if (error.response?.status === 422) {
        errors.value = error.response.data.errors || {}
      } else {
        const { error: errorToast } = useToast()
        errorToast(error.response?.data?.message || 'Error submitting link')
      }
    } finally {
      loading.value = false
    }
  }
</script>
