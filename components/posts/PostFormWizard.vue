<template>
  <div ref="postForm" class="p-3 sm:p-6" :data-hydrated="isHydrated">
    <!-- Success message -->
    <div
      v-if="successMessage"
      class="mb-6 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-lg border border-green-200 dark:border-green-800"
    >
      <div class="flex items-center">
        <Icon name="fa6-solid:circle-check" class="text-green-500 mr-3" aria-hidden="true" />
        <p class="font-medium">{{ successMessage }}</p>
      </div>
    </div>

    <!-- Notifications now handled globally by NotificationContainer -->

    <!-- General error message -->
    <div
      v-if="errorMessage"
      class="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg border border-red-200 dark:border-red-800"
      data-testid="error-message"
    >
      <div class="flex items-center">
        <Icon name="fa6-solid:circle-exclamation" class="text-red-500 mr-3" aria-hidden="true" />
        <p class="font-medium">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Wizard content (hidden if successful) -->
    <div v-if="!successMessage">
      <!-- Progress indicator -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <span
            class="text-sm font-medium text-gray-700 dark:text-gray-300"
            data-testid="step-indicator"
          >
            {{ t('submit.wizard.step') }} {{ currentStep }} {{ t('submit.wizard.of') }}
            {{ totalSteps }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ Math.round(getProgressPercentage()) }}%
          </span>
        </div>
        <div class="w-full wizard-progress-bg rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            data-testid="progress-bar"
            :style="{ width: getProgressPercentage() + '%' }"
          />
        </div>
      </div>

      <!-- Step 1: Content type -->
      <div v-if="currentStep === 1" class="space-y-6">
        <div class="text-center">
          <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.content_type_title') }}</h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ t('submit.wizard.content_type_subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="type in contentTypes"
            :key="type.value"
            :data-testid="`content-type-${type.value}`"
            class="content-type-option p-6 border-2 rounded-lg transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:scale-105 text-center flex flex-col items-center"
            :class="
              form.content_type === type.value
                ? 'border-primary bg-primary/10 scale-105 shadow-lg'
                : 'wizard-type-border-inactive'
            "
            @click="selectContentType(type.value)"
          >
            <div class="mb-3">
              <Icon :name="type.icon" :class="type.color" class="text-3xl" aria-hidden="true" />
            </div>
            <h3 class="font-medium mb-1">{{ type.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ type.description }}</p>
          </button>
        </div>
      </div>

      <!-- Step 2: For links/audio/video/image = URL, For others = Title and description -->
      <div v-if="currentStep === 2" class="space-y-6">
        <!-- LINKS, VIDEO, AUDIO, IMAGE: Step 2 = URL -->
        <template v-if="['link', 'video', 'audio', 'image'].includes(form.content_type)">
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">{{ getStep2UrlTitle() }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ getStep2UrlSubtitle() }}</p>
          </div>

          <div class="max-w-2xl mx-auto space-y-4">
            <!-- Image uploader for image-type posts -->
            <div v-if="form.content_type === 'image'">
              <label class="block text-sm font-medium mb-2">
                {{ t('submit.form.image_url') }} *
              </label>
              <ImageUploader
                :current-image="form.url"
                @image-uploaded="handleImageUploaded"
                @image-deleted="handleImageDeleted"
              />
              <p v-if="errors.url" class="mt-2 text-sm text-red-500 flex items-center" data-testid="url-error">
                <Icon name="fa6-solid:circle-exclamation" class="mr-1 flex-shrink-0" aria-hidden="true" />
                <span>{{ errors.url }}</span>
              </p>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Icon name="fa6-solid:shield-halved" class="mr-1 flex-shrink-0" aria-hidden="true" />
                <span>La imagen se almacenará en nuestros servidores de forma segura</span>
              </p>
            </div>

            <!-- URL input for video/audio -->
            <div v-else-if="['video', 'audio'].includes(form.content_type)">
              <label for="url" class="block text-sm font-medium mb-2">
                {{ t('submit.form.url') }} *
              </label>

              <!-- Input with integrated button for audio -->
              <div v-if="form.content_type === 'audio'" class="relative">
                <input
                  id="url"
                  v-model="form.url"
                  type="url"
                  data-testid="url-input"
                  class="w-full text-lg rounded-lg border px-4 py-3 pr-24 sm:pr-48 focus:outline-none focus:ring-2 focus:border-transparent"
                  :class="{
                    'border-red-500 focus:ring-red-500': errors.url,
                    'wizard-input-border focus:ring-primary': !errors.url,
                  }"
                  :placeholder="getUrlPlaceholder()"
                  @blur="validateUrl"
                >
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1 sm:gap-2 shadow-sm"
                  @click="showAudioHelp = true"
                >
                  <Icon name="fa6-solid:magnifying-glass" class="flex-shrink-0" aria-hidden="true" />
                  <span class="hidden sm:inline">{{ t('audio_help.search_platforms_button') }}</span>
                  <span class="sm:hidden">Buscar</span>
                </button>
              </div>

              <!-- Normal input for video -->
              <input
                v-else
                id="url"
                v-model="form.url"
                type="url"
                data-testid="url-input"
                class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.url,
                  'wizard-input-border focus:ring-primary': !errors.url,
                }"
                :placeholder="getUrlPlaceholder()"
                @blur="validateUrl"
              >

              <p v-if="errors.url" class="mt-2 text-sm text-red-500" data-testid="url-error">
                {{ errors.url }}
              </p>
            </div>

            <!-- URL input for links -->
            <div v-else>
              <label for="url" class="block text-sm font-medium mb-2">
                {{ t('submit.form.url') }} *
              </label>
              <input
                id="url"
                v-model="form.url"
                type="url"
                data-testid="url-input"
                class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.url,
                  'wizard-input-border focus:ring-primary': !errors.url,
                }"
                placeholder="https://ejemplo.com/articulo"
                @paste="handleLinkUrlPaste"
              >
              <p v-if="errors.url" class="mt-2 text-sm text-red-500" data-testid="url-error">
                {{ errors.url }}
              </p>
            </div>
          </div>
        </template>

        <!-- TEXT, POLL: Step 2 = Title and description -->
        <template v-else>
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.title_step') }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ t('submit.wizard.title_subtitle') }}</p>
          </div>

          <div class="w-full space-y-4">
            <!-- Title -->
            <div>
              <label for="title" class="block text-sm font-medium mb-2">
                {{ t('submit.form.title') }} *
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                data-testid="title-input"
                class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.title,
                  'wizard-input-border focus:ring-primary': !errors.title,
                }"
                :placeholder="t('submit.wizard.title_placeholder')"
                maxlength="255"
                @input="validateTitle"
                @blur="validateTitle"
              >
              <div class="flex justify-between mt-2">
                <p v-if="errors.title" class="text-sm text-red-500" data-testid="title-error">
                  {{ errors.title }}
                </p>
                <span
                  class="text-sm text-gray-500 dark:text-gray-400 ml-auto"
                  data-testid="character-count"
                >
                  {{ form.title.length }}/255
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Step 3: For links/audio/video/image = Title/Description, For text/poll = Content -->
      <div v-if="currentStep === 3" class="space-y-6">
        <!-- LINKS, VIDEO, AUDIO, IMAGE: Step 3 = Title and Description -->
        <template v-if="['link', 'video', 'audio', 'image'].includes(form.content_type)">
          <!-- Loading while fetching metadata -->
          <div v-if="isLoadingMetadata" class="text-center py-12">
            <Icon name="fa6-solid:spinner" class="animate-spin text-4xl text-primary mb-4" aria-hidden="true" />
            <p class="text-gray-600 dark:text-gray-400">{{ t('submit.wizard.loading_metadata') }}</p>
          </div>

          <template v-else>
            <div class="text-center">
              <h2 class="text-xl font-semibold mb-2">{{ t('submit.wizard.link_details_step') }}</h2>
              <p class="text-gray-600 dark:text-gray-400">{{ t('submit.wizard.link_details_subtitle') }}</p>
            </div>

            <div class="max-w-2xl mx-auto space-y-4">
              <!-- Pre-filled data indicator -->
              <div v-if="metadataApplied" class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p class="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                  <Icon name="fa6-solid:wand-magic-sparkles" class="mr-2 flex-shrink-0" aria-hidden="true" />
                  {{ t('submit.wizard.metadata_prefilled') }}
                </p>
              </div>

              <!-- Metadata error (non-blocking) -->
              <div v-else-if="metadataError" class="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p class="text-xs text-yellow-700 dark:text-yellow-300 flex items-center">
                  <Icon name="fa6-solid:triangle-exclamation" class="mr-2 flex-shrink-0" aria-hidden="true" />
                  {{ t('submit.wizard.metadata_error_continue') }}
                </p>
              </div>

              <!-- Title -->
            <div>
              <label for="link-title" class="block text-sm font-medium mb-2">
                {{ t('submit.form.title') }} *
              </label>
              <input
                id="link-title"
                v-model="form.title"
                type="text"
                data-testid="title-input"
                class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.title,
                  'wizard-input-border focus:ring-primary': !errors.title,
                }"
                :placeholder="t('submit.wizard.title_placeholder')"
                maxlength="255"
                @input="validateTitle"
                @blur="validateTitle"
              >
              <div class="flex justify-between mt-2">
                <p v-if="errors.title" class="text-sm text-red-500" data-testid="title-error">
                  {{ errors.title }}
                </p>
                <span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {{ form.title.length }}/255
                </span>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label for="link-description" class="block text-sm font-medium mb-2">
                {{ t('submit.form.description') }} *
              </label>
              <DescriptionEditor
                v-model="form.content"
                :placeholder="t('submit.form.description_help')"
                :error="errors.content"
                @blur="validateContent"
              />
              <p v-if="errors.content" class="mt-2 text-sm text-red-500">{{ errors.content }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ t('submit.form.description_required_for_links') }}
              </p>
            </div>
            </div>
          </template>
        </template>

        <!-- TEXT, POLL: Step 3 = Content -->
        <template v-else>
          <div class="text-center">
            <h2 class="text-xl font-semibold mb-2">{{ getStep3Title() }}</h2>
            <p class="text-gray-600 dark:text-gray-400">{{ getStep3Subtitle() }}</p>
          </div>

          <div class="w-full">
            <!-- Text content with markdown editor -->
          <div v-if="form.content_type === 'text'" class="space-y-4">
            <!-- Title for articles -->
            <div>
              <label for="article-title" class="block text-sm font-medium mb-2">
                {{ t('submit.form.title') }} *
              </label>
              <input
                id="article-title"
                v-model="form.title"
                type="text"
                class="w-full text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                :class="{
                  'border-red-500 focus:ring-red-500': errors.title,
                  'wizard-input-border focus:ring-primary': !errors.title,
                }"
                :placeholder="t('submit.wizard.title_placeholder')"
                maxlength="255"
                @blur="validateTitle"
              >
              <div class="flex justify-between mt-2">
                <p v-if="errors.title" class="text-sm text-red-500">{{ errors.title }}</p>
                <span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {{ form.title.length }}/255
                </span>
              </div>
            </div>

            <!-- Article content -->
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <label for="content" class="block text-sm font-medium">
                  {{ t('submit.form.content') }} *
                </label>
                <!-- Prominent action buttons -->
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    :class="articlePreviewActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600'"
                    @click="toggleArticlePreview"
                  >
                    <Icon :name="articlePreviewActive ? 'fa6-solid:pen-to-square' : 'fa6-solid:eye'" class="text-sm" aria-hidden="true" />
                    <span class="hidden sm:inline">{{ articlePreviewActive ? t('submit.wizard.edit') : t('submit.wizard.preview') }}</span>
                  </button>
                  <button
                    type="button"
                    class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                    @click="toggleArticleFullscreen"
                  >
                    <Icon name="fa6-solid:expand" class="text-sm" aria-hidden="true" />
                    <span class="hidden sm:inline">{{ t('submit.wizard.fullscreen') }}</span>
                  </button>
                </div>
              </div>
              <MarkdownEditor
                ref="articleEditor"
                v-model="form.content"
                :placeholder="t('submit.wizard.content_placeholder')"
                data-testid="content-textarea"
              />
              <p v-if="errors.content" class="mt-2 text-sm text-red-500">{{ errors.content }}</p>
            </div>
          </div>

          <!-- Poll options -->
          <div v-if="form.content_type === 'poll'" class="space-y-4">
            <!-- Warning when poll has votes -->
            <div
              v-if="pollHasVotes && isEditMode"
              class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800"
            >
              <div class="flex items-start">
                <Icon name="fa6-solid:triangle-exclamation" class="text-yellow-500 mt-1 mr-3" aria-hidden="true" />
                <div>
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    {{ t('submit.form.poll_has_votes_warning') }}
                  </p>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300">
                    {{ t('submit.form.poll_has_votes_explanation') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Optional poll description -->
            <div>
              <label for="poll_description" class="block text-sm font-medium mb-2">
                {{ t('submit.form.poll_description') }}
              </label>
              <textarea
                id="poll_description"
                v-model="form.content"
                rows="3"
                :disabled="pollHasVotes && isEditMode"
                class="w-full rounded-lg wizard-form-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Descripción opcional para tu encuesta"
              />
            </div>

            <!-- Poll options -->
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('submit.form.poll_options') }} *
              </label>
              <div class="space-y-3" data-testid="poll-options">
                <div
                  v-for="(option, index) in form.poll_options"
                  :key="index"
                  class="flex items-center space-x-2"
                >
                  <input
                    v-model="form.poll_options[index]"
                    type="text"
                    :disabled="pollHasVotes && isEditMode"
                    class="flex-1 rounded-lg wizard-form-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    :placeholder="`${t('submit.form.option')} ${index + 1}`"
                  >
                  <button
                    v-if="form.poll_options.length > 2 && !(pollHasVotes && isEditMode)"
                    type="button"
                    class="text-red-500 hover:text-red-700"
                    @click="removePollOption(index)"
                  >
                    <Icon name="fa6-solid:trash" aria-hidden="true" />
                  </button>
                </div>
                <button
                  v-if="!(pollHasVotes && isEditMode)"
                  type="button"
                  class="text-primary hover:text-primary-dark text-sm flex items-center"
                  @click="addPollOption"
                ><Icon name="fa6-solid:plus" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.add_option') }}</span>
                </button>
              </div>
            </div>

            <!-- Expiration configuration -->
            <div>
              <label for="poll_expires" class="block text-sm font-medium mb-2">
                {{ t('submit.form.poll_expires_at') }}
              </label>
              <select
                id="poll_expires"
                v-model="pollExpirationOption"
                class="w-full rounded-lg wizard-form-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="never">{{ t('submit.form.poll_never_expires') }}</option>
                <option value="1d">{{ t('submit.form.poll_expires_1d') }}</option>
                <option value="3d">{{ t('submit.form.poll_expires_3d') }}</option>
                <option value="1w">{{ t('submit.form.poll_expires_1w') }}</option>
                <option value="2w">{{ t('submit.form.poll_expires_2w') }}</option>
                <option value="1m">{{ t('submit.form.poll_expires_1m') }}</option>
              </select>
              <p class="mt-1 text-xs text-gray-500">{{ t('submit.form.poll_expires_help') }}</p>
            </div>

            <!-- Allow multiple options -->
            <div class="flex items-start space-x-3">
              <input
                id="allow_multiple"
                v-model="form.allow_multiple_options"
                type="checkbox"
                class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
              >
              <div>
                <label for="allow_multiple" class="text-sm font-medium">
                  {{ t('submit.form.poll_allow_multiple') }}
                </label>
                <p class="text-xs text-gray-500 mt-1">
                  {{ t('submit.form.poll_allow_multiple_help') }}
                </p>
              </div>
            </div>
          </div>
          </div>
        </template>
      </div>

      <!-- Step 4: Optional details -->
      <div v-if="currentStep === 4" class="space-y-6">
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
            <PostLanguageSelector v-model="form.language_code" />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ t('submit.form.language_help') }}</p>
            <p v-if="!form.language_code" class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <Icon name="fa6-solid:triangle-exclamation" class="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{{ t('submit.form.language_required_notice') }}</span>
            </p>
          </div>

          <!-- Subcommunity selection (only if user is authenticated) -->
          <div v-if="authStore.isAuthenticated && !authStore.isGuest">
            <label class="block text-sm font-medium mb-2">
              {{ t('subs.post_in_sub') }}
            </label>
            <PostSubSelector v-model="form.sub_id" :my-subs="mySubs" :current-sub="currentPostSub" />
          </div>

          <!-- Checkbox for anonymous posting (only for registered users) -->
          <div v-if="!authStore.isGuest" class="flex items-start space-x-3">
            <input
              id="guest"
              v-model="form.is_anonymous"
              type="checkbox"
              data-testid="guest-checkbox"
              class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
            >
            <div>
              <label for="guest" class="text-sm font-medium">
                {{ t('submit.form.post_anonymously') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('submit.wizard.anonymous_help') }}
              </p>
              <p v-if="form.is_anonymous" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
                <Icon name="fa6-solid:circle-info" class="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{{ t('submit.wizard.anonymous_moderator_note') }}</span>
              </p>
            </div>
          </div>

          <!-- Checkbox for NSFW content -->
          <div class="flex items-start space-x-3">
            <input
              id="is_nsfw"
              v-model="form.is_nsfw"
              type="checkbox"
              data-testid="nsfw-checkbox"
              class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-500"
            >
            <div>
              <label for="is_nsfw" class="text-sm font-medium">
                {{ t('submit.form.is_nsfw', 'Marcar como contenido NSFW/adultos (+18)') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('submit.form.nsfw_help', 'El contenido NSFW incluye desnudos, contenido sexual o violencia gráfica') }}
              </p>
            </div>
          </div>

          <!-- Checkbox for ActivityPub federation (only if user has federation enabled) -->
          <div v-if="isFederationEnabled && !authStore.isGuest" class="flex items-start space-x-3">
            <input
              id="should_federate"
              v-model="shouldFederate"
              type="checkbox"
              data-testid="federate-checkbox"
              class="w-6 h-6 mt-1 rounded wizard-checkbox-border text-primary dark:text-primary focus:ring-primary dark:focus:ring-primary"
            >
            <div>
              <label for="should_federate" class="text-sm font-medium inline-flex items-center gap-2">
                <Icon name="fa6-solid:globe" class="text-primary" aria-hidden="true" />
                {{ t('submit.form.federate_post') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('submit.form.federate_post_help') }}
              </p>
            </div>
          </div>

          <!-- Thumbnail Uploader (hidden for videos) -->
          <div v-if="form.content_type !== 'video'">
            <label class="block text-sm font-medium mb-2">
              {{ t('submit.form.image') }}
            </label>
            <ClientOnly>
              <ThumbnailUploader
                :current-thumbnail="form.thumbnail_url"
                :post-id="effectivePostId"
                @thumbnail-updated="handleThumbnailUpdated"
                @thumbnail-deleted="handleThumbnailDeleted"
              />
            </ClientOnly>
          </div>

          <!-- Relate to other content (only if draft was already saved) -->
          <div v-if="effectivePostId" class="wizard-relations-box rounded-lg p-4">
            <div class="mb-3">
              <div class="mb-2">
                <h4 class="text-sm font-medium text-text dark:text-text-dark flex items-center"><Icon name="fa6-solid:link" class="mr-2 text-gray-600 dark:text-gray-400 flex-shrink-0" aria-hidden="true" /> <span>{{ t('submit.form.related_content') }}</span>
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
                  @click="openAddRelationshipModal('own')"
                >
                  <Icon name="fa6-solid:circle-user" class="text-xs" aria-hidden="true" />
                  <span>{{ t('submit.form.add_own_relation') }}</span>
                </button>
                <button
                  type="button"
                  class="flex-1 px-3 py-2 text-sm wizard-relation-btn text-text dark:text-text-dark rounded-lg transition-colors flex items-center justify-center gap-2"
                  @click="openAddRelationshipModal('external')"
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
                  @click.stop="removeRelationship(rel.id)"
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

      <!-- Indicador de campos requeridos (sutil al final) -->
      <div v-if="currentStep >= 2 && currentStep <= 3" class="mt-4 text-center">
        <RequiredFieldIndicator />
      </div>

      <!-- Navigation -->
      <div class="flex justify-between items-center gap-3 mt-8 pt-6 wizard-nav-border-top">
        <button
          v-if="currentStep > 1"
          type="button"
          data-testid="previous-button"
          class="px-4 sm:px-6 py-2 wizard-nav-btn rounded-lg transition-colors inline-flex items-center"
          @click="previousStep"
        >
          <Icon name="fa6-solid:arrow-left" aria-hidden="true" />
          <span class="hidden sm:inline ml-2">{{ t('submit.wizard.previous') }}</span>
        </button>

        <div class="flex items-center gap-2 sm:gap-3">
          <button
            v-if="currentStep < totalSteps"
            :disabled="!canProceed"
            type="button"
            data-testid="next-button"
            class="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
            @click="nextStep"
          >
            <span>{{ t('submit.wizard.next') }}</span>
            <Icon name="fa6-solid:arrow-right" class="ml-2" aria-hidden="true" />
          </button>

          <button
            v-if="currentStep === totalSteps"
            :disabled="isSubmitting"
            type="button"
            data-testid="draft-button"
            class="px-3 sm:px-6 py-2 wizard-draft-btn rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex items-center"
            @click="submitPost('draft')"
          >
            <span v-if="isSubmitting && savingAsDraft" class="mr-2 flex items-center">
              <Icon name="fa6-solid:spinner" class="flex-shrink-0 animate-spin" aria-hidden="true" />
            </span>
            <Icon name="fa6-solid:floppy-disk" class="mr-2 flex-shrink-0" aria-hidden="true" />
            <span class="hidden sm:inline">{{ t('posts.save_as_draft') }}</span>
            <span class="sm:hidden">Borrador</span>
          </button>

          <button
            v-if="currentStep === totalSteps"
            :disabled="isSubmitting || !isFormValid"
            type="button"
            data-testid="publish-button"
            class="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            @click="submitPost('published')"
          >
            <span v-if="isSubmitting && !savingAsDraft" class="mr-2 flex items-center" data-testid="loading-spinner">
              <Icon name="fa6-solid:spinner" class="animate-spin" aria-hidden="true" />
            </span>
            {{ t('submit.wizard.publish') }}
          </button>
        </div>
      </div>
    </div>
    <!-- Fin del contenido del wizard -->

    <!-- Modal de ayuda de plataformas de audio -->
    <AudioPlatformsModal :is-open="showAudioHelp" @close="showAudioHelp = false" />

    <!-- Add relationships modal -->
    <AddRelationshipModal
      v-if="showAddRelationship && effectivePostId"
      :post-id="effectivePostId"
      :current-post-title="form.title"
      :post-author-id="authStore.user?.id"
      :initial-category="selectedRelationCategory"
      @close="closeAddRelationshipModal"
      @created="handleRelationshipCreated"
    />
  </div>
</template>

<script setup>
  import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue'
  import { useI18n } from '#i18n'
  import { usePostsStore } from '~/stores/posts'
  import { useAuthStore } from '~/stores/auth'
  import { useSubsStore } from '~/stores/subs'
  import { useNuxtApp } from '#app'
  import { useRoute } from 'vue-router'
  import { useNotification } from '~/composables/useNotification'
  import { useUrlMetadata } from '~/composables/useUrlMetadata'
  import { useActivityPub } from '~/composables/useActivityPub'
  import MarkdownEditor from '~/components/posts/MarkdownEditor.vue'
  import DescriptionEditor from '~/components/posts/DescriptionEditor.vue'
  import ThumbnailUploader from '~/components/posts/ThumbnailUploader.vue'
  import ImageUploader from '~/components/posts/ImageUploader.vue'
  import RequiredFieldIndicator from '~/components/common/RequiredFieldIndicator.vue'
  import AudioPlatformsModal from '~/components/help/AudioPlatformsModal.vue'
  import AddRelationshipModal from '~/components/posts/AddRelationshipModal.vue'
  import PostLanguageSelector from '~/components/posts/PostLanguageSelector.vue'
  import PostSubSelector from '~/components/posts/PostSubSelector.vue'
  import postService from '~/services/postService'

  const { t } = useI18n()
  const postsStore = usePostsStore()
  const authStore = useAuthStore()
  const subsStore = useSubsStore()
  const { $api } = useNuxtApp()
  const { success, error: showError, warning, info } = useNotification()

  // URL metadata extraction for links
  const {
    isLoading: isLoadingMetadata,
    error: metadataError,
    fetchMetadata,
    clearMetadata
  } = useUrlMetadata()
  const metadataApplied = ref(false) // Track if metadata was applied to form
  const suggestedThumbnailUrl = ref(null) // URL de imagen sugerida (no auto-aplicada)

  // ActivityPub federation
  const {
    isFederationEnabled,
    defaultFederatePosts,
    fetchUserSettings: fetchFederationSettings,
  } = useActivityPub()
  const shouldFederate = ref(false) // Local state for this post's federation setting

  // Get user's subscribed subs
  const mySubs = computed(() => subsStore.getMySubs || [])

  const props = defineProps({
    initialData: {
      type: Object,
      default: () => ({}),
    },
    externalSource: {
      type: String,
      default: null,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
    postId: {
      type: [Number, String],
      default: null,
    },
  })

  const emit = defineEmits(['submit', 'cancel', 'update'])

  // Get route to read query parameters
  const route = useRoute()

  // Wizard state
  const currentStep = ref(1)
  const totalSteps = 4
  const isSubmitting = ref(false)
  const savingAsDraft = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  const errors = reactive({
    title: '',
    url: '',
    content: '',
    tags: '',
    poll_options: '',
  })

  // Form data
  const form = reactive({
    title: '',
    content_type: '',
    url: '',
    content: '',
    is_anonymous: false,
    is_nsfw: false,
    poll_options: ['', ''],
    language_code: '',
    is_original: false,
    thumbnail_url: '',
    expires_at: null,
    allow_multiple_options: false,
    tags: [],
    source: props.externalSource || '',
    source_name: props.externalSource || '',
    source_url: '',
    sub_id: null, // null means "General" (no sub)
  })

  const showAIAssistant = ref(false)
  const aiAssistantMode = ref('title')
  const pollExpirationOption = ref('1w')
  const isEditMode = computed(() => props.editMode)
  const postForm = ref(null)
  const isHydrated = ref(false)
  const savedDraftId = ref(null)
  const showAudioHelp = ref(false)
  const showAddRelationship = ref(false)
  const selectedRelationCategory = ref(null)
  const postRelationships = ref([])
  const pollHasVotes = ref(false)
  const currentPostSub = ref(null)
  const articleEditor = ref(null)
  const articlePreviewActive = ref(false)

  // Computed for the effective postId passed to ThumbnailUploader
  const effectivePostId = computed(() => {
    return savedDraftId.value || props.postId
  })

  // Notification system (migrated to useNotification)

  // Content types
  const contentTypes = computed(() => [
    {
      value: 'link',
      title: t('submit.form.type_link'),
      description: t('submit.wizard.link_description'),
      icon: 'fa6-solid:link',
      color: 'text-blue-500',
    },
    {
      value: 'text',
      title: t('submit.form.type_text'),
      description: t('submit.wizard.text_description'),
      icon: 'fa6-solid:file-lines',
      color: 'text-green-500',
    },
    {
      value: 'video',
      title: t('submit.form.type_video'),
      description: t('submit.wizard.video_description'),
      icon: 'fa6-solid:video',
      color: 'text-red-500',
    },
    {
      value: 'audio',
      title: t('submit.form.type_audio'),
      description: t('submit.wizard.audio_description'),
      icon: 'fa6-solid:headphones',
      color: 'text-purple-500',
    },
    {
      value: 'image',
      title: t('submit.form.type_image'),
      description: t('submit.wizard.image_description'),
      icon: 'fa6-solid:image',
      color: 'text-pink-500',
    },
    {
      value: 'poll',
      title: t('submit.form.type_poll'),
      description: t('submit.wizard.poll_description'),
      icon: 'fa6-solid:square-poll-vertical',
      color: 'text-primary',
    },
  ])

  // Improved validations with specific error detection
  // For links: Step 2 = URL, Step 3 = Title/Description
  // For others: Step 2 = Title/Description, Step 3 = Content
  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1:
        return form.content_type !== ''
      case 2:
        // For link, video, audio, image: validate URL in step 2
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          return form.url.trim() !== '' && isValidUrl(form.url.trim())
        }
        // For text and poll: validate title in step 2
        if (!form.title.trim() || form.title.trim().length < 5) return false
        return true
      case 3:
        // For link, video, audio, image: validate title and description in step 3
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          if (!form.title.trim() || form.title.trim().length < 5) return false
          return form.content.trim().length > 0
        }
        // For text: validate content
        if (form.content_type === 'text') {
          return form.content.trim().length >= 10
        }
        // For poll: validate options
        if (form.content_type === 'poll') {
          return form.poll_options.filter((o) => o.trim()).length >= 2
        }
        return false
      case 4:
        return true
      default:
        return false
    }
  })

  const isFormValid = computed(() => {
    return form.title.trim().length >= 5 && canProceed.value && form.language_code
  })

  // Function to detect which step has a specific error
  function detectErrorStep() {
    // Step 1: Content type
    if (!form.content_type) {
      return 1
    }

    // Step 2: URL for link/video/audio/image, title for text/poll
    if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
      if (!form.url.trim() || !isValidUrl(form.url.trim())) {
        return 2
      }
    } else {
      if (!form.title.trim() || form.title.trim().length < 5) {
        return 2
      }
    }

    // Step 3: Title and description for link/video/audio/image, content for text/poll
    if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
      if (!form.title.trim() || form.title.trim().length < 5) {
        return 3
      }
      if (!form.content.trim() || form.content.trim().length < 10) {
        return 3
      }
    }
    if (form.content_type === 'text' && form.content.trim().length < 10) {
      return 3
    }
    if (form.content_type === 'poll' && form.poll_options.filter((o) => o.trim()).length < 2) {
      return 3
    }

    // Step 4: Language
    if (!form.language_code) {
      return 4
    }

    // If we get here, there are no obvious errors
    return null
  }

  // Function to get specific error message by step
  function getStepErrorMessage(step) {
    switch (step) {
      case 1:
        return t('submit.validation.content_type_required')
      case 2:
        // For link/video/audio/image: URL
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          if (!form.url.trim()) {
            return t('submit.validation.url_required')
          }
          if (!isValidUrl(form.url.trim())) {
            return t('submit.validation.invalid_url')
          }
        }
        // For text/poll: title
        if (!form.title.trim() || form.title.trim().length < 5) {
          return t('submit.validation.title_min_length')
        }
        return t('submit.validation.complete_required_fields')
      case 3:
        // For link/video/audio/image: title and description
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          if (!form.title.trim() || form.title.trim().length < 5) {
            return t('submit.validation.title_min_length')
          }
          if (!form.content.trim() || form.content.trim().length < 10) {
            return t('submit.validation.description_min_length_content_type')
          }
        }
        if (form.content_type === 'text' && form.content.trim().length < 10) {
          return t('submit.validation.content_min_length')
        }
        if (form.content_type === 'poll' && form.poll_options.filter((o) => o.trim()).length < 2) {
          return t('submit.validation.poll_min_options')
        }
        return t('submit.validation.complete_content')
      case 4:
        if (!form.language_code) {
          return t('submit.form.language_required_notice')
        }
        return t('submit.validation.complete_required_fields')
      default:
        return t('submit.validation.form_errors')
    }
  }

  // Function to calculate more intuitive progress
  function getProgressPercentage() {
    switch (currentStep.value) {
      case 1:
        // Step 1: 0% at start, 25% when type is selected
        return form.content_type !== '' ? 25 : 0
      case 2:
        // Step 2: 25% at start, 50% when URL or title is complete
        return canProceed.value ? 50 : 25
      case 3:
        // Step 3: 50% at start, 75% when content is complete
        return canProceed.value ? 75 : 50
      case 4:
        // Step 4: 75% at start, 100% when ready to submit
        return isFormValid.value ? 100 : 75
      default:
        return 0
    }
  }

  // Methods
  function selectContentType(type) {
    form.content_type = type
    if (type === 'poll' && form.poll_options.length < 2) {
      form.poll_options = ['', '']
    }

    // Auto-advance to next step after a small delay
    setTimeout(() => {
      if (currentStep.value === 1 && canProceed.value) {
        nextStep()
      }
    }, 300) // Small delay so user can see the selection
  }

  async function nextStep() {
    // Validate current step before advancing
    if (!validateCurrentStep()) {
      // If there are errors, show notification and don't advance
      const errorMsg = getStepErrorMessage(currentStep.value)
      warning(errorMsg, { priority: 'normal', timeout: 5000 })

      // Focus on first field with error
      setTimeout(() => {
        scrollToFirstError()
      }, 300)

      return
    }

    // For links: fetch metadata when going from step 2 to step 3
    if (form.content_type === 'link' && currentStep.value === 2) {
      await fetchAndApplyMetadata()
    }

    // If moving from step 3 to 4, auto-save as draft
    if (currentStep.value === 3 && !isEditMode.value && !savedDraftId.value) {
      try {
        // Save post as draft (submitPost handles isSubmitting internally)
        const draftPost = await submitPost('draft', true) // true = don't reset form

        if (draftPost && draftPost.id) {
          savedDraftId.value = draftPost.id
          // Show subtle confirmation notification
          success(t('posts.draft_saved_auto'), { priority: 'low', timeout: 4000 })

          // Auto-download suggested thumbnail if exists
          if (suggestedThumbnailUrl.value) {
            downloadSuggestedThumbnail()
          }
        }
      } catch (err) {
        console.error('Error auto-saving draft:', err)
        showError(t('posts.draft_save_error'), { priority: 'high', timeout: 5000 })
        return // Don't advance if save failed
      }
    }

    if (canProceed.value && currentStep.value < totalSteps) {
      currentStep.value++
    }
  }

  function previousStep() {
    if (currentStep.value > 1) {
      // Reset metadata when going back to URL step for links
      if (form.content_type === 'link' && currentStep.value === 3) {
        clearMetadata()
        metadataApplied.value = false
        suggestedThumbnailUrl.value = null
      }
      currentStep.value--
    }
  }

  function validateTitle() {
    errors.title = ''
    if (form.title.trim().length < 5) {
      errors.title = t('submit.validation.title_min_length')
    }
  }

  function validateUrl() {
    errors.url = ''

    if (form.url && !form.url.match(/^https?:\/\/.*$/)) {
      form.url = 'https://' + form.url
    }

    if (form.url) {
      autoDetectContentType(form.url)
      form.media_provider = detectMediaProvider(form.url)
    }

    if (form.url && !isValidUrl(form.url)) {
      errors.url = t('submit.validation.invalid_url')
    }
  }

  function toggleArticlePreview() {
    if (articleEditor.value) {
      articleEditor.value.togglePreview()
      articlePreviewActive.value = !articlePreviewActive.value
    }
  }

  function toggleArticleFullscreen() {
    if (articleEditor.value) {
      articleEditor.value.toggleFullscreen()
    }
  }

  async function handleLinkUrlPaste() {
    // Wait for value to update after paste
    await nextTick()

    // Normalize URL
    if (form.url && !form.url.match(/^https?:\/\/.*$/)) {
      form.url = 'https://' + form.url
    }

    validateUrl()
  }

  async function fetchAndApplyMetadata() {
    // Only extract metadata if not already applied for this URL
    const result = await fetchMetadata(form.url)

    if (result) {
      // Apply metadata to form only if fields are empty
      if (result.title && !form.title.trim()) {
        form.title = result.title
      }
      if (result.description && !form.content.trim()) {
        form.content = result.description
      }
      // Save image for download after creating draft
      if (result.image) {
        suggestedThumbnailUrl.value = result.image
      }

      metadataApplied.value = true
    }
  }

  // Download suggested thumbnail to server
  async function downloadSuggestedThumbnail() {
    if (!suggestedThumbnailUrl.value || !effectivePostId.value) return

    try {
      const response = await $api.images.uploadPostThumbnailFromUrl(
        effectivePostId.value,
        suggestedThumbnailUrl.value,
        { silent: true }
      )
      if (response.data?.image?.urls) {
        form.thumbnail_url = response.data.image.urls.medium
      }
    } catch {
      // Silent fail - image format not supported or download failed
      // User can still upload manually in step 4
    } finally {
      suggestedThumbnailUrl.value = null
    }
  }

  // Function to validate content based on type
  function validateContent() {
    errors.content = ''

    // For text type, only validate content in step 3
    if (
      form.content_type === 'text' &&
      currentStep.value === 3 &&
      form.content.trim().length < 10
    ) {
      errors.content = t('submit.validation.content_min_length')
    }

    // For links, validate description in step 3 (new flow)
    if (form.content_type === 'link' && currentStep.value === 3) {
      if (!form.content.trim()) {
        errors.content = t('submit.validation.description_required')
      } else if (form.content.trim().length < 10) {
        errors.content = t('submit.validation.description_min_length')
      }
    }

    // For video/audio/image, validate description in step 2
    if (['video', 'audio', 'image'].includes(form.content_type) && currentStep.value === 2) {
      if (!form.content.trim()) {
        errors.content = t('submit.validation.description_required')
      } else if (form.content.trim().length < 10) {
        errors.content = t('submit.validation.description_min_length')
      }
    }
  }

  // Function to validate poll options
  function validatePollOptions() {
    errors.poll_options = ''

    const validOptions = form.poll_options.filter((o) => o.trim()).length
    if (form.content_type === 'poll' && validOptions < 2) {
      errors.poll_options = t('submit.validation.poll_min_options')
    }
  }

  // Function to auto-navigate to step with error
  function navigateToErrorStep() {
    const errorStep = detectErrorStep()

    if (errorStep !== null && errorStep !== currentStep.value) {
      currentStep.value = errorStep

      // Show specific error message
      const errorMsg = getStepErrorMessage(errorStep)
      warning(errorMsg, { priority: 'normal' })

      // Scroll to first field with error after small delay
      setTimeout(() => {
        scrollToFirstError()
      }, 300)

      return true // Indicates we navigated to an error
    }

    return false // No errors or already on correct step
  }

  // Improved function to validate entire form
  // For link/video/audio/image: Step 2 = URL, Step 3 = Title/Description
  // For text/poll: Step 2 = Title, Step 3 = Content
  function validateCurrentStep() {
    resetErrors()

    switch (currentStep.value) {
      case 1:
        // No specific validations for step 1
        break
      case 2:
        // For link/video/audio/image: validate URL in step 2
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          validateUrl()
        } else {
          // For text/poll: validate title
          validateTitle()
        }
        break
      case 3:
        // For link/video/audio/image: validate title and description in step 3
        if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
          validateTitle()
          validateContent()
        } else if (form.content_type === 'text') {
          validateContent()
        } else if (form.content_type === 'poll') {
          validatePollOptions()
        }
        break
      case 4:
        // Validaciones finales si es necesario
        break
    }

    return Object.values(errors).every((error) => error === '')
  }

  // Function to validate all form steps
  function validateAllSteps() {
    resetErrors()

    // Validate step 1: Content type
    if (!form.content_type) {
      return false
    }

    // For link/video/audio/image: validate URL first (step 2)
    if (['link', 'video', 'audio', 'image'].includes(form.content_type)) {
      if (!form.url.trim()) {
        errors.url = t('submit.validation.url_required')
        return false
      }
      if (!isValidUrl(form.url.trim())) {
        errors.url = t('submit.validation.url_invalid')
        return false
      }
    }

    // Validate title (step 2 for text/poll, step 3 for others)
    if (!form.title.trim() || form.title.trim().length < 5) {
      errors.title = t('submit.validation.title_min_length')
      return false
    }

    // For link/video/audio/image: validate description (step 3)
    if (['link', 'video', 'audio', 'image'].includes(form.content_type) && !form.content.trim()) {
      errors.content = t('submit.validation.description_required')
      return false
    }

    // For text: validate content (step 3)
    if (form.content_type === 'text') {
      if (form.content.trim().length < 10) {
        errors.content = t('submit.validation.content_min_length')
        return false
      }
    }

    // For poll: validate options (step 3)
    if (form.content_type === 'poll') {
      const validOptions = form.poll_options.filter((o) => o.trim()).length
      if (validOptions < 2) {
        errors.poll_options = t('submit.validation.poll_min_options')
        return false
      }
    }

    return true
  }

  function isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  function addPollOption() {
    if (form.poll_options.length < 10) {
      form.poll_options.push('')
    }
  }

  function removePollOption(index) {
    if (form.poll_options.length > 2) {
      form.poll_options.splice(index, 1)
    }
  }

  function getStep2UrlTitle() {
    switch (form.content_type) {
      case 'link':
        return t('submit.wizard.link_url_step')
      case 'video':
        return t('submit.wizard.video_step')
      case 'audio':
        return t('submit.wizard.audio_step')
      case 'image':
        return t('submit.wizard.image_step')
      default:
        return t('submit.wizard.content_step')
    }
  }

  function getStep2UrlSubtitle() {
    switch (form.content_type) {
      case 'link':
        return t('submit.wizard.link_url_subtitle')
      case 'video':
        return t('submit.wizard.video_subtitle')
      case 'audio':
        return t('submit.wizard.audio_subtitle')
      case 'image':
        return t('submit.wizard.image_subtitle')
      default:
        return ''
    }
  }

  function getStep3Title() {
    switch (form.content_type) {
      case 'link':
      case 'video':
      case 'audio':
      case 'image':
        return t('submit.wizard.title_step')
      case 'text':
        return t('submit.wizard.text_step')
      case 'poll':
        return t('submit.wizard.poll_step')
      default:
        return t('submit.wizard.content_step')
    }
  }

  function getStep3Subtitle() {
    switch (form.content_type) {
      case 'link':
      case 'video':
      case 'audio':
      case 'image':
        return t('submit.wizard.title_subtitle')
      case 'text':
        return t('submit.wizard.text_subtitle')
      case 'poll':
        return t('submit.wizard.poll_subtitle')
      default:
        return ''
    }
  }

  function getUrlPlaceholder() {
    switch (form.content_type) {
      case 'video':
        return 'https://youtube.com/watch?v=...'
      case 'audio':
        return 'https://soundcloud.com/...'
      case 'image':
        return 'https://i.imgur.com/ejemplo.jpg'
      default:
        return 'https://ejemplo.com'
    }
  }

  function showAINotAvailable() {
    // Show notification that AI Assistant is not available
    info(t('submit.ai_assistant_not_available'), { priority: 'normal' })
  }

  function toggleAIAssistant(mode) {
    aiAssistantMode.value = mode
    showAIAssistant.value = !showAIAssistant.value
  }

  function updateTags(newTags) {
    form.tags = Array.isArray(newTags) ? newTags : []
  }

  // Calculate poll expiration date
  function calculatePollExpiration() {
    if (pollExpirationOption.value === 'never') {
      return null
    }

    const now = new Date()

    switch (pollExpirationOption.value) {
      case '1d':
        return new Date(now.setDate(now.getDate() + 1))
      case '3d':
        return new Date(now.setDate(now.getDate() + 3))
      case '1w':
        return new Date(now.setDate(now.getDate() + 7))
      case '2w':
        return new Date(now.setDate(now.getDate() + 14))
      case '1m':
        return new Date(now.setMonth(now.getMonth() + 1))
      default:
        return null
    }
  }

  function setContentType(type) {
    form.content_type = type

    if (type === 'text' || type === 'poll') {
      form.url = ''
    }

    if (form.url && (type === 'video' || type === 'audio')) {
      form.media_provider = detectMediaProvider(form.url)
    }

    if (type === 'poll' && form.poll_options.length === 0) {
      form.poll_options = ['', ''] // Initialize with two empty options
    }
  }

  function autoDetectContentType(url) {
    if (!url) return

    const videoRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|facebook\.com\/watch|dailymotion\.com|twitter\.com|x\.com)\/.*$/i
    const audioRegex =
      /^(https?:\/\/)?(www\.)?(soundcloud\.com|spotify\.com\/(track|album|show|episode|podcast)|podcasts\.apple\.com|player\.simplecast\.com)\/.*$/i

    if (videoRegex.test(url)) {
      form.content_type = 'video'
    } else if (audioRegex.test(url)) {
      form.content_type = 'audio'
    } else if (['video', 'audio'].includes(form.content_type)) {
      form.content_type = 'link'
    }
  }

  function scrollToFirstError() {
    if (!postForm.value) return

    const firstErrorField = postForm.value.querySelector('.border-red-500')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
  }

  async function loadPostData() {
    if (props.editMode && props.postId) {
      isSubmitting.value = true
      try {
        const post = await postsStore.fetchPost(props.postId)

        // Check if trying to edit a poll - temporarily disabled
        if (post.content_type === 'poll') {
          showError(t('posts.poll_edit_disabled'))
          emit('cancel')
          return
        }

        form.title = post.title || ''
        form.url = post.url || ''
        form.content = post.content || post.body || ''
        form.thumbnail_url = post.thumbnail_url || ''
        form.content_type = post.content_type || ''
        form.media_provider = post.media_provider || ''
        form.is_original = post.is_original || false
        form.tags = post.tags || []
        form.is_anonymous = post.is_anonymous || false
        form.language_code = post.language_code || 'es'
        form.sub_id = post.sub?.id || null
        currentPostSub.value = post.sub || null

        // Load poll data if it's a poll (this won't execute due to check above)
        if (post.content_type === 'poll' && post.poll) {
          form.poll_options = post.poll.options.map(opt => opt.text) || ['', '']
          form.allow_multiple_options = post.poll.allow_multiple_options || false
          pollHasVotes.value = post.poll.total_votes > 0

          // Set expires_at if poll has expiration
          if (post.poll.expires_at) {
            form.expires_at = new Date(post.poll.expires_at)
          }
        }
      } catch (error) {
        errorMessage.value = t('posts.load_error')
        console.error('Error al cargar post:', error)
      } finally {
        isSubmitting.value = false
      }
    }
  }

  function detectMediaProvider(url) {
    if (!url) return ''

    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('vimeo.com')) return 'vimeo'
    if (url.includes('soundcloud.com')) return 'soundcloud'
    if (url.includes('spotify.com')) return 'spotify'
    return ''
  }

  function resetErrors() {
    Object.keys(errors).forEach((key) => {
      errors[key] = ''
    })
  }

  function handleThumbnailUpdated(urls) {
    // Update form with medium size URL (for backward compatibility)
    form.thumbnail_url = urls.medium
  }

  function handleThumbnailDeleted() {
    form.thumbnail_url = ''
  }

  function handleImageUploaded(imageData) {
    // For image posts, use the large size URL as the main URL
    form.url = imageData.large
    errors.url = ''
  }

  function handleImageDeleted() {
    form.url = ''
  }

  async function submitPost(status = 'published', keepForm = false) {
    if (isSubmitting.value) return

    savingAsDraft.value = status === 'draft'

    // If saving as draft, only validate minimum fields
    if (status === 'draft') {
      // For drafts we only require title
      if (!form.title.trim()) {
        errors.title = t('submit.validation.title_required')
        currentStep.value = 1
        warning(t('submit.validation.title_required'), { priority: 'normal' })
        return
      }
    } else {
      // For publishing, validate entire form
      const hasValidationErrors = !validateAllSteps()

      if (hasValidationErrors) {
        // Auto-navigate to step with error
        const navigatedToError = navigateToErrorStep()

        if (!navigatedToError) {
          // If didn't navigate to a specific step, go to start to review everything
          currentStep.value = 1
          warning(t('submit.validation.review_all_fields'), { priority: 'normal' })
        }

        return
      }

      if (!isFormValid.value) {
        navigateToErrorStep()
        return
      }
    }

    isSubmitting.value = true
    resetErrors()
    errorMessage.value = ''

    try {
      // Manejar fuentes externas
      if (props.externalSource && !form.source) {
        form.source = props.externalSource
        form.source_name = props.externalSource
        form.is_original = false
      }

      // Preparar datos del post
      const postData = {
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        url: form.url.trim(),
        content_type: form.content_type,
        is_anonymous: form.is_anonymous,
        is_nsfw: form.is_nsfw,
        language_code: form.language_code,
        is_original: form.is_original,
        thumbnail_url: form.thumbnail_url,
        media_provider: detectMediaProvider(form.url),
        tag_ids: form.tags ? form.tags.map((tag) => tag.id || tag) : [],
        poll_options:
          form.content_type === 'poll' ? form.poll_options.filter((o) => o.trim()) : undefined,
        expires_at: form.content_type === 'poll' ? calculatePollExpiration() : null,
        allow_multiple_options: form.allow_multiple_options,
        sub_id: form.sub_id, // null means "General", otherwise the selected sub ID
        status: status,
        should_federate: shouldFederate.value === true ? true : undefined,
      }


      // Remove empty/undefined fields and unnecessary fields
      Object.keys(postData).forEach((key) => {
        if (postData[key] === '' || postData[key] === undefined) {
          delete postData[key]
        }
      })

      // Remove source fields if not importing
      if (!props.externalSource) {
        delete postData.source
        delete postData.source_name
        delete postData.source_url
      }

      let response

      if (isEditMode.value) {
        response = await postService.updatePost($api, props.postId, postData)
        successMessage.value = t('posts.update_success')
        emit('update', response)
      } else if (savedDraftId.value) {
        response = await postService.updatePost($api, savedDraftId.value, postData)

        if (!keepForm) {
          successMessage.value = status === 'draft' ? t('posts.draft_saved') : t('submit.success')
          emit('submit', response)
        }
      } else {
        const isImport = !!form.source
        response = isImport
          ? await postsStore.importPost(postData)
          : await postsStore.createPost(postData)

        if (!keepForm) {
          successMessage.value = status === 'draft' ? t('posts.draft_saved') : t('submit.success')
          emit('submit', response)
        }

        // Reset form after successful submission (only if not auto-save)
        if (!keepForm) {
          Object.assign(form, {
            title: '',
            content_type: '',
            url: '',
            content: '',
            is_anonymous: false,
            poll_options: ['', ''],
            language_code: 'es',
            is_original: false,
            thumbnail_url: '',
            expires_at: null,
            allow_multiple_options: false,
            tags: [],
            source: props.externalSource || '',
            source_name: props.externalSource || '',
            source_url: '',
          })
          currentStep.value = 1
        }
      }

      return response
    } catch (error) {
      console.error('Error submitting post:', error)

      // Handle validation errors
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors
        Object.keys(backendErrors).forEach((key) => {
          if (errors[key] !== undefined) {
            errors[key] = Array.isArray(backendErrors[key])
              ? backendErrors[key][0]
              : backendErrors[key]
          }
        })

        // Try to navigate to the step with the error
        const navigatedToError = navigateToErrorStep()

        if (!navigatedToError) {
          // If we can't navigate to a specific step, show error on current step
          errorMessage.value = error.response?.data?.message || t('submit.validation.error')
        }
      } else {
        errorMessage.value = error.response?.data?.message || error.message || t('submit.error')
      }

      if (!isFormValid.value) {
        setTimeout(scrollToFirstError, 100)
      }
    } finally {
      isSubmitting.value = false
      savingAsDraft.value = false
    }
  }

  // Watchers and lifecycle
  watch(
    () => props.initialData,
    (newVal) => {
      if (newVal) {
        form.title = newVal.title || ''
        form.url = newVal.url || ''
        form.content = newVal.content || newVal.body || ''
        form.thumbnail_url = newVal.thumbnail_url || ''
        form.source = newVal.source || props.externalSource || ''
        form.source_name = newVal.source_name || props.externalSource || ''
        form.source_url = newVal.source_url || newVal.url || ''
        form.content_type = newVal.content_type || ''
        form.media_provider = newVal.media_provider || ''
        form.tags = newVal.tags || []
        form.is_original = newVal.is_original || false
        form.is_anonymous = newVal.is_anonymous || false
        form.language_code = newVal.language_code || 'es'

        if (props.externalSource) {
          form.is_original = false
        }
      }
    },
    { immediate: true }
  )

  // Cargar relaciones cuando hay un post ID
  async function loadRelationships() {
    if (!effectivePostId.value) return

    try {
      const response = await $api.posts.getRelationships(effectivePostId.value)
      const data = response.data?.data || {}

      // Handle new grouped structure
      if (data.own !== undefined && data.external !== undefined) {
        // Flatten both arrays into single array for display
        postRelationships.value = [...(data.own || []), ...(data.external || [])]
      } else {
        // Fallback for old structure (backwards compatibility)
        postRelationships.value = Array.isArray(data) ? data : []
      }
    } catch (err) {
      console.error('Error loading relationships:', err)
    }
  }

  // Open add relationship modal with specific category
  function openAddRelationshipModal(category) {
    selectedRelationCategory.value = category
    showAddRelationship.value = true
  }

  // Close add relationship modal
  function closeAddRelationshipModal() {
    showAddRelationship.value = false
    selectedRelationCategory.value = null
  }

  // Handle relationship creation
  function handleRelationshipCreated() {
    closeAddRelationshipModal()
    loadRelationships()
  }

  // Remove relationship
  async function removeRelationship(relationshipId) {
    if (!effectivePostId.value) return

    try {
      await $api.posts.deleteRelationship(effectivePostId.value, relationshipId)
      postRelationships.value = postRelationships.value.filter(r => r.id !== relationshipId)
    } catch (err) {
      console.error('Error deleting relationship:', err)
    }
  }

  // Watch to load relationships when draft is created
  watch(effectivePostId, (newVal) => {
    if (newVal) {
      loadRelationships()
    }
  })

  onMounted(async () => {
    // Mark component as hydrated for E2E tests
    isHydrated.value = true

    // Fetch user's subscribed subs if authenticated
    if (authStore.isAuthenticated && !authStore.isGuest) {
      try {
        await subsStore.fetchSubs({ my_subs: true })
      } catch (error) {
        console.error('Error fetching subs:', error)
      }

      // Fetch federation settings and set default
      try {
        await fetchFederationSettings()
        shouldFederate.value = defaultFederatePosts.value
      } catch (error) {
        console.error('Error fetching federation settings:', error)
      }
    }

    // Check if there's a sub query parameter and preselect it
    if (route.query.sub) {
      // Check if it's a numeric ID or a name
      const subParam = route.query.sub
      const subId = parseInt(subParam)

      if (!isNaN(subId)) {
        // It's an ID, use it directly
        form.sub_id = subId
      } else {
        // It's a name, find the sub by name
        // Wait a bit for mySubs to be populated after fetchSubs
        await nextTick()
        const sub = mySubs.value.find(s => s.name === subParam)
        if (sub) {
          form.sub_id = sub.id
        } else {
          // If not found in user's subs, try to fetch the sub by name from the API
          try {
            const fetchedSub = await subsStore.fetchSub(subParam)
            if (fetchedSub) {
              form.sub_id = fetchedSub.id
            }
          } catch (error) {
            console.warn('Sub not found:', subParam, error)
          }
        }
      }
    }

    if (props.editMode && props.postId) {
      await loadPostData()
    }
    // Cargar relaciones si ya hay un post ID
    if (effectivePostId.value) {
      loadRelationships()
    }
  })
</script>

<style scoped>
  .wizard-input-border {
    border-color: var(--color-border-default);
  }

  .wizard-form-input {
    background-color: var(--color-bg-input);
    border: 1px solid var(--color-border-default);
  }

  .wizard-checkbox-border {
    border-color: var(--color-border-default);
  }

  .wizard-relations-box {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .wizard-relation-btn {
    border: 2px solid var(--color-border-default);
  }

  .wizard-relation-btn:hover {
    border-color: var(--color-border-strong);
  }

  .wizard-relation-item {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .wizard-nav-btn {
    border: 1px solid var(--color-border-default);
  }

  .wizard-nav-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .wizard-draft-btn {
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .wizard-draft-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .wizard-progress-bg {
    background-color: var(--color-border-default);
  }

  .wizard-type-border-inactive {
    border-color: var(--color-border-default);
  }

  .wizard-nav-border-top {
    border-top: 1px solid var(--color-border-default);
  }

  .wizard-metadata-preview {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
