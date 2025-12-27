<template>
  <div class="container mx-auto px-1 md:px-4 py-2 md:py-4">
    <!-- Compact Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Icon name="fa6-solid:landmark" class="text-lg text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ t('agora.title') }}
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('agora.subtitle') }}
          </p>
        </div>
      </div>
      <!-- Connection status (only show when offline) -->
      <div class="flex items-center gap-2">
        <div v-if="errorType === 'connection_limit'" class="group relative">
          <span
            class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 cursor-help"
          >
            <span class="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            {{ $t('agora.server_busy') }}
          </span>
          <div
            class="absolute right-0 top-full mt-2 w-64 p-3 bg-amber-50 dark:bg-amber-900/90 border border-amber-300 dark:border-amber-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20"
          >
            <p class="text-xs text-amber-700 dark:text-amber-300">
              {{ t('agora.offline_explanation') }}
            </p>
            <button
              class="mt-2 w-full px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center justify-center gap-1"
              @click="reloadPage"
            >
              <Icon name="fa6-solid:rotate-right" class="text-xs" aria-hidden="true" />
              {{ t('agora.reload') }}
            </button>
          </div>
        </div>
        <div v-else-if="!isConnected" class="group relative">
          <span class="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 cursor-help">
            <span class="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Offline
          </span>
          <div
            class="absolute right-0 top-full mt-2 w-64 p-3 bg-red-50 dark:bg-red-900/90 border border-red-300 dark:border-red-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20"
          >
            <p class="text-xs text-red-700 dark:text-red-300">
              {{ t('agora.offline_explanation') }}
            </p>
            <button
              class="mt-2 w-full px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center justify-center gap-1"
              @click="reloadPage"
            >
              <Icon name="fa6-solid:rotate-right" class="text-xs" aria-hidden="true" />
              {{ t('agora.reload') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content -->
      <div class="lg:col-span-2">
        <!-- Write message section -->
        <ClientOnly>
          <!-- Collapsible compose bar -->
          <div v-if="authStore.user" class="mb-4">
            <!-- Collapsed state - looks like input field -->
            <div
              v-if="!showCompose"
              class="agora-compose-bar w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-text transition-all shadow-sm"
              @click="expandCompose"
            >
              <NuxtImg
                v-if="authStore.user.avatar"
                :src="authStore.user.avatar"
                :alt="authStore.user.username"
                width="32"
                height="32"
                loading="lazy"
                class="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full agora-avatar-placeholder flex items-center justify-center flex-shrink-0"
              >
                <Icon name="fa6-solid:user" class="text-gray-400 text-sm" aria-hidden="true" />
              </div>
              <!-- Fake input with integrated button on mobile -->
              <div
                class="agora-compose-input flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-between"
              >
                <span>{{ t('agora.write_placeholder') }}</span>
                <!-- Mobile: icon only inside input -->
                <button
                  type="button"
                  class="md:hidden text-primary hover:text-primary-dark transition-colors p-1"
                  :aria-label="t('agora.publish')"
                  @click.stop="expandCompose"
                >
                  <Icon name="fa6-solid:paper-plane" class="text-base" aria-hidden="true" />
                </button>
              </div>
              <!-- Desktop: full publish button -->
              <button
                type="button"
                class="hidden md:flex px-4 py-2 bg-primary btn-primary-text rounded-lg text-sm font-medium items-center gap-2 hover:bg-primary-dark transition-colors"
                @click.stop="expandCompose"
              >
                <Icon name="fa6-solid:paper-plane" class="text-xs" aria-hidden="true" />
                {{ t('agora.publish') }}
              </button>
            </div>

            <!-- Expanded compose form - Modal on mobile, inline on desktop -->
            <Teleport to="body" :disabled="!isMobileComposeModal">
              <div
                v-if="showCompose"
                :class="
                  isMobileComposeModal
                    ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center'
                    : ''
                "
              >
                <!-- Backdrop for mobile -->
                <div
                  v-if="isMobileComposeModal"
                  class="absolute inset-0 bg-black/50"
                  @click="showCompose = false"
                />

                <!-- Form container -->
                <div
                  :class="[
                    'agora-compose-form rounded-xl',
                    isMobileComposeModal
                      ? 'relative w-full max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-b-xl sm:max-w-lg sm:mx-4'
                      : '',
                  ]"
                >
                  <!-- Header with close button -->
                  <div class="agora-compose-header flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-2">
                      <NuxtImg
                        v-if="authStore.user.avatar"
                        :src="authStore.user.avatar"
                        :alt="authStore.user.username"
                        width="28"
                        height="28"
                        loading="lazy"
                        class="w-7 h-7 rounded-full"
                      />
                      <span class="text-sm font-medium agora-text-primary">
                        {{ isAnonymous ? t('agora.anonymous_user') : authStore.user.username }}
                      </span>
                    </div>
                    <button
                      class="p-1.5 agora-close-btn rounded-full"
                      :aria-label="t('common.close')"
                      @click="showCompose = false"
                    >
                      <Icon name="fa6-solid:xmark" aria-hidden="true" />
                    </button>
                  </div>

                  <!-- Editor -->
                  <div class="p-3">
                    <CommentEditor
                      ref="editorRef"
                      :placeholder="t('agora.write_placeholder')"
                      :submit-label="t('agora.publish')"
                      :rows="3"
                      :is-submitting="loading"
                      :post-id="0"
                      :hide-submit-button="true"
                      @submit="handleEditorSubmit"
                      @input="editorContent = $event"
                    />
                  </div>

                  <!-- Options section -->
                  <div class="agora-compose-footer px-3 pb-3 pt-3 space-y-3">
                    <!-- Expiry as natural sentence -->
                    <div>
                      <div class="flex flex-wrap items-center gap-1 text-sm agora-text-muted">
                        <Icon name="fa6-solid:hourglass-half" class="text-xs" aria-hidden="true" />
                        <span>{{ t('agora.expiry_label') }}</span>
                        <!-- Duration dropdown styled as link -->
                        <div class="relative inline-block">
                          <button
                            class="inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary-dark underline decoration-dotted underline-offset-2"
                            @click="showDurationDropdown = !showDurationDropdown"
                          >
                            {{ getExpiryLabel(expiresInHours) }}
                            <Icon name="fa6-solid:chevron-down" class="text-[10px]" />
                          </button>
                          <div
                            v-if="showDurationDropdown"
                            class="agora-dropdown absolute left-0 top-full mt-1 rounded-lg shadow-lg py-1 z-10 min-w-[120px]"
                          >
                            <button
                              v-for="option in expiryOptions"
                              :key="option.value"
                              class="agora-dropdown-item w-full text-left px-3 py-1.5 text-sm transition-colors"
                              :class="
                                expiresInHours === option.value ? 'text-primary font-medium' : ''
                              "
                              @click="selectExpiry(option.value)"
                            >
                              {{ option.label }}
                            </button>
                          </div>
                        </div>
                        <span>{{ t('agora.expiry_mode_label').toLowerCase() }}</span>
                        <!-- Mode dropdown styled as link -->
                        <div class="relative inline-block">
                          <button
                            class="inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary-dark underline decoration-dotted underline-offset-2"
                            @click="showModeDropdown = !showModeDropdown"
                          >
                            {{
                              expiryMode === 'from_last'
                                ? t('agora.expiry_mode_from_last').toLowerCase()
                                : t('agora.expiry_mode_from_first').toLowerCase()
                            }}
                            <Icon name="fa6-solid:chevron-down" class="text-[10px]" />
                          </button>
                          <div
                            v-if="showModeDropdown"
                            class="agora-dropdown absolute left-0 top-full mt-1 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
                          >
                            <button
                              class="agora-dropdown-item w-full text-left px-3 py-1.5 text-sm transition-colors"
                              :class="expiryMode === 'from_last' ? 'text-primary font-medium' : ''"
                              @click="selectMode('from_last')"
                            >
                              {{ t('agora.expiry_mode_from_last') }}
                            </button>
                            <button
                              class="agora-dropdown-item w-full text-left px-3 py-1.5 text-sm transition-colors"
                              :class="expiryMode === 'from_first' ? 'text-primary font-medium' : ''"
                              @click="selectMode('from_first')"
                            >
                              {{ t('agora.expiry_mode_from_first') }}
                            </button>
                          </div>
                        </div>
                      </div>
                      <!-- Help text -->
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-5">
                        {{ t('agora.expiry_help') }}
                      </p>
                    </div>

                    <!-- Anonymous checkbox and publish button -->
                    <div class="flex items-center justify-between">
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          v-model="isAnonymous"
                          type="checkbox"
                          class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        >
                        <span class="text-sm agora-text-secondary">
                          {{ t('agora.publish_anonymous') }}
                        </span>
                      </label>
                      <button
                        :disabled="!canSubmit || loading"
                        class="px-4 py-2 bg-primary btn-primary-text rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                        @click="submitFromButton"
                      >
                        <span
                          v-if="loading"
                          class="inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                        />
                        <Icon v-else name="fa6-solid:paper-plane" aria-hidden="true" />
                        {{ t('agora.publish') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Teleport>
          </div>

          <!-- CTA for non-logged users with social login options -->
          <div
            v-else
            class="mb-4 px-5 py-5 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 dark:from-primary/20 dark:via-purple-500/20 dark:to-primary/20 rounded-xl border-2 border-primary/30 dark:border-primary/40 shadow-sm"
          >
            <div class="flex items-center justify-center gap-2 mb-2">
              <Icon name="fa6-solid:comments" class="text-primary text-lg" aria-hidden="true" />
              <p class="text-center text-base font-semibold text-gray-800 dark:text-gray-200">
                {{ t('agora.cta_title') }}
              </p>
            </div>
            <p class="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">
              {{ t('agora.cta_subtitle') }}
            </p>

            <!-- Login buttons -->
            <div v-if="!showLoginForm" class="flex flex-wrap items-center justify-center gap-2">
              <NuxtLink
                :to="localePath('/auth/login') + '?returnUrl=' + encodeURIComponent(currentPath)"
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Icon name="fa6-solid:right-to-bracket" class="text-xs" aria-hidden="true" />
                {{ t('agora.cta_login') }}
              </NuxtLink>
              <span
                v-if="mastodonEnabled || mbinEnabled"
                class="text-gray-400 dark:text-gray-500 text-xs"
                >{{ t('common.or') }}</span
              >
              <button
                v-if="mastodonEnabled"
                type="button"
                class="mastodon-cta-btn inline-flex items-center gap-2 px-4 py-2 border border-[#6364FF] text-[#6364FF] rounded-lg text-sm font-medium transition-colors hover:bg-[#6364FF] hover:text-white"
                @click="toggleLoginForm('mastodon')"
              >
                <Icon name="simple-icons:mastodon" class="text-xs" aria-hidden="true" />
                Mastodon
              </button>
              <button
                v-if="mbinEnabled"
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 border border-[#00BC8C] text-[#00BC8C] rounded-lg text-sm font-medium transition-colors hover:bg-[#00BC8C] hover:text-white"
                @click="toggleLoginForm('mbin')"
              >
                <Icon name="simple-icons:lemmy" class="text-xs" aria-hidden="true" />
                {{ t('auth.mbin_label') }}
              </button>
            </div>

            <!-- Mastodon login form -->
            <div v-else-if="showLoginForm === 'mastodon'" class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Icon name="simple-icons:mastodon" class="text-[#6364FF]" aria-hidden="true" />
                  {{ t('auth.login_with_mastodon') }}
                </span>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  @click="showLoginForm = null"
                >
                  <Icon name="fa6-solid:xmark" aria-hidden="true" />
                </button>
              </div>

              <div class="flex gap-2">
                <input
                  v-model="mastodonInstance"
                  type="text"
                  :placeholder="t('auth.mastodon_instance_help')"
                  class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#6364FF] focus:border-transparent"
                  @keyup.enter="handleMastodonLogin"
                >
                <button
                  type="button"
                  :disabled="mastodonLoading || !mastodonInstance.trim()"
                  class="px-4 py-2 bg-[#6364FF] hover:bg-[#5354E0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  @click="handleMastodonLogin"
                >
                  <LoadingSpinner v-if="mastodonLoading" size="sm" color="white" display="inline" />
                  <Icon v-else name="fa6-solid:arrow-right" class="text-xs" aria-hidden="true" />
                </button>
              </div>

              <!-- Quick instance suggestions -->
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="instance in popularMastodonInstances"
                  :key="instance"
                  type="button"
                  class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-[#6364FF]/20 hover:text-[#6364FF] transition-colors"
                  @click="selectMastodonInstance(instance)"
                >
                  {{ instance }}
                </button>
              </div>

              <div v-if="mastodonError" class="text-xs text-red-600 dark:text-red-400">
                {{ mastodonError }}
              </div>
            </div>

            <!-- Mbin login form -->
            <div v-else-if="showLoginForm === 'mbin'" class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Icon name="simple-icons:lemmy" class="text-[#00BC8C]" aria-hidden="true" />
                  {{ t('auth.login_with_mbin') }}
                </span>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  @click="showLoginForm = null"
                >
                  <Icon name="fa6-solid:xmark" aria-hidden="true" />
                </button>
              </div>

              <div class="flex gap-2">
                <input
                  v-model="mbinInstance"
                  type="text"
                  :placeholder="t('auth.mbin_instance_help')"
                  class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#00BC8C] focus:border-transparent"
                  @keyup.enter="handleMbinLogin"
                >
                <button
                  type="button"
                  :disabled="mbinLoading || !mbinInstance.trim()"
                  class="px-4 py-2 bg-[#00BC8C] hover:bg-[#00A67C] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  @click="handleMbinLogin"
                >
                  <LoadingSpinner v-if="mbinLoading" size="sm" color="white" display="inline" />
                  <Icon v-else name="fa6-solid:arrow-right" class="text-xs" aria-hidden="true" />
                </button>
              </div>

              <!-- Quick instance suggestions -->
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="instance in popularMbinInstances"
                  :key="instance"
                  type="button"
                  class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-[#00BC8C]/20 hover:text-[#00BC8C] transition-colors"
                  @click="selectMbinInstance(instance)"
                >
                  {{ instance }}
                </button>
              </div>

              <div v-if="mbinError" class="text-xs text-red-600 dark:text-red-400">
                {{
                  mbinError === 'instance_forbidden'
                    ? t('auth.mbin_error_403')
                    : mbinError === 'connection_failed'
                      ? t('auth.mbin_error_instance')
                      : mbinError
                }}
              </div>
            </div>
          </div>
        </ClientOnly>

        <!-- View toggle - subtle tabs -->
        <div class="flex items-center justify-end gap-0.5 mb-4">
          <button
            class="agora-view-tab px-3 py-1 text-sm transition-all flex items-center gap-1.5"
            :class="viewMode === 'threads' ? 'active' : ''"
            @click="changeView('threads')"
          >
            <Icon name="fa6-solid:comments" class="text-xs" aria-hidden="true" />
            {{ t('agora.view_threads') }}
          </button>
          <button
            class="agora-view-tab px-3 py-1 text-sm transition-all flex items-center gap-1.5"
            :class="viewMode === 'chronological' ? 'active' : ''"
            @click="changeView('chronological')"
          >
            <Icon name="fa6-solid:clock" class="text-xs" aria-hidden="true" />
            {{ t('agora.view_chronological') }}
          </button>
        </div>

        <!-- Messages list -->
        <div class="space-y-4">
          <!-- Loading state - Skeleton loaders -->
          <template v-if="loadingMessages">
            <div
              v-for="i in 3"
              :key="'skeleton-' + i"
              class="agora-message-wrapper rounded-xl shadow-sm p-5 animate-pulse"
            >
              <!-- Header skeleton -->
              <div class="flex items-center gap-3 mb-3">
                <div class="w-8 h-8 rounded-full skeleton-loader" />
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-24 skeleton-loader rounded" />
                  <div class="h-2 w-16 skeleton-loader rounded" />
                </div>
              </div>
              <!-- Content skeleton -->
              <div class="space-y-2 mb-3">
                <div class="h-3 skeleton-loader rounded w-full" />
                <div class="h-3 skeleton-loader rounded w-5/6" />
                <div class="h-3 skeleton-loader rounded w-4/6" />
              </div>
              <!-- Footer skeleton -->
              <div class="flex items-center gap-4">
                <div class="h-6 w-16 skeleton-loader rounded" />
                <div class="h-6 w-16 skeleton-loader rounded" />
              </div>
            </div>
          </template>

          <!-- Error state -->
          <div v-else-if="error" class="agora-error-state rounded-xl p-8 text-center">
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            >
              <Icon
                name="fa6-solid:circle-exclamation"
                class="text-2xl text-red-500"
                aria-hidden="true"
              />
            </div>
            <p class="text-red-700 dark:text-red-300 font-medium">{{ t('agora.error_loading') }}</p>
            <button class="mt-4 text-sm text-primary hover:underline" @click="loadMessages">
              {{ t('common.try_again') }}
            </button>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="messages.length === 0"
            class="agora-empty-state rounded-xl p-12 text-center relative overflow-hidden"
          >
            <div class="relative z-10">
              <div
                class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
              >
                <Icon name="fa6-solid:seedling" class="text-3xl text-primary" aria-hidden="true" />
              </div>
              <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {{ t('agora.no_messages') }}
              </h3>
              <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {{ t('agora.no_messages_subtitle') }}
              </p>
              <div class="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                <Icon name="fa6-solid:arrow-up" class="animate-bounce" aria-hidden="true" />
                <span>{{ t('agora.empty_cta') }}</span>
              </div>
            </div>
            <!-- Decorative dots -->
            <div class="absolute top-4 left-4 w-2 h-2 bg-primary/20 rounded-full" />
            <div class="absolute top-8 left-12 w-1.5 h-1.5 bg-primary/15 rounded-full" />
            <div class="absolute bottom-6 right-8 w-2 h-2 bg-primary/20 rounded-full" />
            <div class="absolute bottom-12 right-16 w-1 h-1 bg-primary/10 rounded-full" />
          </div>

          <!-- Messages - Threads view -->
          <TransitionGroup
            v-else-if="viewMode === 'threads'"
            name="message"
            tag="div"
            class="space-y-4"
          >
            <div
              v-for="message in messages"
              :key="message.id"
              class="agora-message-wrapper rounded-xl shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <AgoraMessageCard
                :message="message"
                :show-replies-toggle="true"
                :is-detail-view="false"
                @deleted="loadMessages"
                @updated="refreshMessages"
              />
            </div>
          </TransitionGroup>

          <!-- Messages - Chronological view -->
          <TransitionGroup v-else name="message" tag="div" class="space-y-3">
            <div
              v-for="message in messages"
              :key="message.id"
              class="agora-message-wrapper rounded-xl shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <!-- Reply indicator -->
              <NuxtLink
                v-if="message.parent_id"
                :to="localePath(`/agora/${message.parent_id}`)"
                class="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <Icon name="fa6-solid:reply" class="rotate-180" aria-hidden="true" />
                <span>{{ t('agora.in_reply_to') }}</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">
                  {{
                    message.parent?.is_anonymous
                      ? t('agora.anonymous_user')
                      : '@' + message.parent?.user?.username
                  }}
                </span>
                <span class="text-gray-400 truncate max-w-[200px]">
                  "{{ message.parent?.content }}"
                </span>
              </NuxtLink>

              <AgoraMessageCard
                :message="message"
                :show-replies-toggle="false"
                :is-detail-view="false"
                :hide-reply-button="false"
                @deleted="loadMessages"
                @updated="refreshMessages"
              />
            </div>
          </TransitionGroup>

          <!-- Loading more - Skeleton loaders -->
          <template v-if="loadingMore">
            <div
              v-for="i in 2"
              :key="'skeleton-more-' + i"
              class="agora-message-wrapper rounded-xl shadow-sm p-5 animate-pulse"
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="w-8 h-8 rounded-full skeleton-loader" />
                <div class="flex-1 space-y-2">
                  <div class="h-3 w-24 skeleton-loader rounded" />
                  <div class="h-2 w-16 skeleton-loader rounded" />
                </div>
              </div>
              <div class="space-y-2 mb-3">
                <div class="h-3 skeleton-loader rounded w-full" />
                <div class="h-3 skeleton-loader rounded w-5/6" />
              </div>
            </div>
          </template>

          <!-- Infinite scroll trigger + fallback button -->
          <div
            v-if="hasMore && !loadingMessages && !loadingMore"
            ref="infiniteScrollTrigger"
            class="text-center py-6"
          >
            <button
              class="agora-load-more-btn px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
              @click="loadMore"
            >
              <Icon name="fa6-solid:angles-down" aria-hidden="true" />
              {{ t('common.load_more') }}
            </button>
          </div>
        </div>

        <!-- Back to top button -->
        <Transition name="fade">
          <button
            v-if="showBackToTop"
            class="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center z-40"
            :aria-label="t('common.back_to_top')"
            @click="scrollToTop"
          >
            <Icon name="fa6-solid:arrow-up" class="text-lg" aria-hidden="true" />
          </button>
        </Transition>
      </div>

      <!-- Sidebar (desktop only) -->
      <div class="hidden lg:block lg:col-span-1 space-y-6">
        <RecentComments />
        <TopComments />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'

  import { useNuxtApp } from '#app'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '~/stores/auth'
  import { useNotification } from '~/composables/useNotification'
  import { useAgoraRealtime } from '~/composables/useAgoraRealtime'
  import { useMobileDetection } from '~/composables/useMobileDetection'
  import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
  import { useMbinAuth } from '~/composables/useMbinAuth'
  import { useMastodonAuth } from '~/composables/useMastodonAuth'
  import AgoraMessageCard from '~/components/agora/AgoraMessageCard.vue'
  import CommentEditor from '~/components/comments/CommentEditor.vue'
  import RecentComments from '~/components/posts/RecentComments.vue'
  import TopComments from '~/components/posts/TopComments.vue'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

  const { t } = useI18n()
  const { isMobile } = useMobileDetection()
  const localePath = useLocalePath()
  const route = useRoute()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()
  const { error: showError } = useNotification()

  // Mbin/Mastodon login
  const {
    loading: mbinLoading,
    error: mbinError,
    mbinEnabled,
    checkMbinStatus,
    redirectToMbin,
  } = useMbinAuth()

  const {
    loading: mastodonLoading,
    error: mastodonError,
    federationEnabled: mastodonEnabled,
    checkFederationStatus: checkMastodonStatus,
    redirectToMastodon,
  } = useMastodonAuth()

  // Login form state
  const showLoginForm = ref(null) // 'mbin' | 'mastodon' | null
  const mbinInstance = ref('')
  const mastodonInstance = ref('')

  // Popular instances
  const popularMbinInstances = ['fedia.io', 'kbin.run']
  const popularMastodonInstances = ['mastodon.social', 'mas.to', 'fosstodon.org']

  // Current page URL for returnUrl
  const currentPath = computed(() => route.fullPath)

  // Handle Mbin login
  async function handleMbinLogin() {
    if (mbinLoading.value || !mbinInstance.value.trim()) return
    await redirectToMbin(mbinInstance.value.trim(), currentPath.value)
  }

  // Handle Mastodon login
  async function handleMastodonLogin() {
    if (mastodonLoading.value || !mastodonInstance.value.trim()) return
    await redirectToMastodon(mastodonInstance.value.trim(), currentPath.value)
  }

  // Select instance from suggestions
  function selectMbinInstance(instance) {
    mbinInstance.value = instance
  }

  function selectMastodonInstance(instance) {
    mastodonInstance.value = instance
  }

  // Toggle login form
  function toggleLoginForm(provider) {
    if (showLoginForm.value === provider) {
      showLoginForm.value = null
    } else {
      showLoginForm.value = provider
      mbinInstance.value = ''
      mastodonInstance.value = ''
    }
  }

  // Real-time
  const {
    isConnected,
    errorType,
    startListening,
    stopListening,
    clearNewMessages,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
  } = useAgoraRealtime()

  const messages = ref([])
  const STORAGE_KEY = 'agora_view_mode'
  // Initialize with default to avoid SSR hydration mismatch
  const viewMode = ref('threads')
  const loading = ref(false)
  const loadingMessages = ref(true)
  const loadingMore = ref(false)
  const error = ref(null)
  const page = ref(1)
  const hasMore = ref(true)

  const isAnonymous = ref(false)
  const expiresInHours = ref(720) // Default: 1 month
  const expiryMode = ref('from_last') // Default: count from last message
  const editorRef = ref(null)
  const showCompose = ref(false)
  const showDurationDropdown = ref(false)
  const showModeDropdown = ref(false)
  const editorContent = ref('')

  // Back to top button
  const showBackToTop = ref(false)
  const scrollThreshold = 400

  function handleScroll() {
    showBackToTop.value = window.scrollY > scrollThreshold
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Infinite scroll setup
  const handleLoadMore = () => {
    if (hasMore.value && !loadingMore.value && !loadingMessages.value) {
      loadMore()
    }
  }

  const { target: infiniteScrollTrigger } = useInfiniteScroll(handleLoadMore, {
    rootMargin: '200px',
    threshold: 0.1,
  })

  // Use modal on mobile for better UX
  const isMobileComposeModal = computed(() => isMobile.value)

  // Check if can submit (has content)
  const canSubmit = computed(() => editorContent.value.trim().length > 0)

  // Expiry options for dropdown
  const expiryOptions = computed(() => [
    { value: 1, label: t('agora.expiry_1_hour') },
    { value: 24, label: t('agora.expiry_1_day') },
    { value: 168, label: t('agora.expiry_1_week') },
    { value: 720, label: t('agora.expiry_1_month') },
    { value: 8760, label: t('agora.expiry_1_year') },
    { value: 876000, label: t('agora.expiry_1_century') },
  ])

  // Get label for expiry hours
  function getExpiryLabel(hours) {
    const option = expiryOptions.value.find((o) => o.value === hours)
    return option ? option.label.toLowerCase() : ''
  }

  // Select expiry duration
  function selectExpiry(value) {
    expiresInHours.value = value
    showDurationDropdown.value = false
  }

  // Select expiry mode
  function selectMode(mode) {
    expiryMode.value = mode
    showModeDropdown.value = false
  }

  // Expand compose and focus editor
  function expandCompose() {
    showCompose.value = true
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.focus()
      }
    })
  }

  // Submit from external button
  function submitFromButton() {
    if (editorRef.value) {
      editorRef.value.submit()
    }
  }

  // Change view mode
  function changeView(newView) {
    if (viewMode.value === newView) return
    viewMode.value = newView
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, newView)
    }
    page.value = 1
    messages.value = []
    loadMessages()
  }

  // Handle editor submit
  async function handleEditorSubmit(formData) {
    if (!formData.content || !formData.content.trim()) return

    try {
      loading.value = true

      await $api.agora.createMessage({
        content: formData.content,
        is_anonymous: isAnonymous.value,
        language_code: authStore.user?.language_code || 'es',
        expires_in_hours: expiresInHours.value,
        expiry_mode: expiryMode.value,
      })

      // Reset form state
      isAnonymous.value = false
      expiresInHours.value = 720 // Reset to default
      expiryMode.value = 'from_last'

      // Reset editor and collapse compose area
      if (editorRef.value) {
        editorRef.value.reset()
      }
      editorContent.value = ''
      showCompose.value = false

      // Reload messages without showing loading spinner
      page.value = 1
      await loadMessages(false)
    } catch (err) {
      console.error('Error creating message:', err)
      showError(t('agora.error_creating'))
    } finally {
      loading.value = false
    }
  }

  function reloadPage() {
    if (import.meta.client) {
      window.location.reload()
    }
  }

  async function loadMessages(showLoading = true) {
    try {
      if (showLoading) {
        loadingMessages.value = true
      }
      error.value = null

      const response = await $api.agora.getMessages({
        per_page: 10,
        page: page.value,
        view: viewMode.value,
      })

      messages.value = response.data.data
      hasMore.value = response.data.meta.current_page < response.data.meta.last_page
    } catch (err) {
      console.error('Error loading messages:', err)
      error.value = err.message
    } finally {
      loadingMessages.value = false
    }
  }

  // Refresh without showing loading spinner (for updates after voting, etc.)
  function refreshMessages() {
    loadMessages(false)
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return

    try {
      loadingMore.value = true
      page.value++

      const response = await $api.agora.getMessages({
        per_page: 10,
        page: page.value,
        view: viewMode.value,
      })

      messages.value.push(...response.data.data)
      hasMore.value = response.data.meta.current_page < response.data.meta.last_page
    } catch (err) {
      console.error('Error loading more messages:', err)
      showError(t('agora.error_loading'))
    } finally {
      loadingMore.value = false
    }
  }

  // Insert a reply into its parent message recursively
  function insertReplyIntoParent(parentId, reply, messageList) {
    for (const msg of messageList) {
      if (msg.id === parentId) {
        if (!msg.replies) msg.replies = []
        // Check if reply already exists
        if (!msg.replies.find((r) => r.id === reply.id)) {
          msg.replies.push(reply)
          msg.replies_count = (msg.replies_count || 0) + 1
        }
        return true
      }
      // Search in nested replies
      if (msg.replies && msg.replies.length > 0) {
        if (insertReplyIntoParent(parentId, reply, msg.replies)) {
          return true
        }
      }
    }
    return false
  }

  // Handle real-time message callback
  function handleRealtimeMessage(data) {
    // Auto-insert replies into their parent
    if (data.is_reply && data.parent_id) {
      insertReplyIntoParent(data.parent_id, data.message, messages.value)
      return
    }

    // Auto-insert top-level messages
    if (!messages.value.find((m) => m.id === data.message.id)) {
      messages.value.unshift(data.message)
    }
    clearNewMessages()
  }

  // Update message in list recursively
  function updateMessageInList(messageId, updatedMessage, messageList) {
    for (let i = 0; i < messageList.length; i++) {
      if (messageList[i].id === messageId) {
        // Preserve replies when updating
        const existingReplies = messageList[i].replies
        messageList[i] = { ...updatedMessage, replies: existingReplies }
        return true
      }
      if (messageList[i].replies?.length) {
        if (updateMessageInList(messageId, updatedMessage, messageList[i].replies)) {
          return true
        }
      }
    }
    return false
  }

  // Remove message from list recursively
  function removeMessageFromList(messageId, messageList) {
    for (let i = 0; i < messageList.length; i++) {
      if (messageList[i].id === messageId) {
        messageList.splice(i, 1)
        return true
      }
      if (messageList[i].replies?.length) {
        if (removeMessageFromList(messageId, messageList[i].replies)) {
          // Update replies count on parent
          messageList[i].replies_count = Math.max(0, (messageList[i].replies_count || 1) - 1)
          return true
        }
      }
    }
    return false
  }

  // Handle real-time message update
  function handleRealtimeMessageUpdate(data) {
    updateMessageInList(data.message.id, data.message, messages.value)
  }

  // Handle real-time message deletion
  function handleRealtimeMessageDelete(data) {
    removeMessageFromList(data.message_id, messages.value)
  }

  // Close dropdowns when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.relative.inline-block')) {
      showDurationDropdown.value = false
      showModeDropdown.value = false
    }
  }

  // Start real-time on mount
  onMounted(() => {
    loadMessages()

    // Check federated login status
    checkMbinStatus()
    checkMastodonStatus()

    // Start listening for real-time updates
    if (import.meta.client) {
      // Restore view mode from localStorage after hydration
      const savedMode = localStorage.getItem(STORAGE_KEY)
      if (savedMode === 'chronological') {
        viewMode.value = savedMode
      }

      onNewMessage(handleRealtimeMessage)
      onMessageUpdated(handleRealtimeMessageUpdate)
      onMessageDeleted(handleRealtimeMessageDelete)
      startListening()
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopListening()
    if (import.meta.client) {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', handleScroll)
    }
  })
</script>

<style scoped>
  /* Mastodon CTA button */
  .mastodon-cta-btn:hover {
    background-color: var(--color-primary);
    color: white !important;
  }

  /* States */
  .agora-loading-state,
  .agora-error-state,
  .agora-empty-state {
    background-color: var(--color-bg-subtle);
    border: 1px dashed var(--color-border-default);
  }

  /* Message wrapper */
  .agora-message-wrapper {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  /* Compose bar (collapsed) */
  .agora-compose-bar {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .agora-compose-bar:hover {
    border-color: var(--color-primary-light);
  }

  .agora-compose-input {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    color: var(--color-text-muted);
  }

  .agora-avatar-placeholder {
    background-color: var(--color-bg-subtle);
  }

  /* Compose form (expanded) */
  .agora-compose-form {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .agora-compose-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .agora-compose-footer {
    border-top: 1px solid var(--color-border-default);
  }

  .agora-close-btn {
    color: var(--color-text-muted);
  }

  .agora-close-btn:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-hover);
  }

  /* Text colors */
  .agora-text-primary {
    color: var(--color-text-primary);
  }

  .agora-text-secondary {
    color: var(--color-text-secondary);
  }

  .agora-text-muted {
    color: var(--color-text-muted);
  }

  /* Dropdowns */
  .agora-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .agora-dropdown-item {
    color: var(--color-text-primary);
  }

  .agora-dropdown-item:hover {
    background-color: var(--color-bg-hover);
  }

  /* View toggle tabs */
  .agora-view-tab {
    color: var(--color-text-muted);
    border-bottom: 2px solid transparent;
    border-radius: 0;
  }

  .agora-view-tab:hover {
    color: var(--color-text-secondary);
  }

  .agora-view-tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  /* Load more button */
  .agora-load-more-btn {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-default);
  }

  .agora-load-more-btn:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Slide transition for expand/collapse */
  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .slide-enter-from,
  .slide-leave-to {
    opacity: 0;
    max-height: 0;
  }

  .slide-enter-to,
  .slide-leave-from {
    opacity: 1;
    max-height: 500px;
  }

  /* Skeleton loader */
  .skeleton-loader {
    background-color: var(--color-bg-hover);
  }

  /* Fade transition for back to top button */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* Message list transitions */
  .message-enter-active {
    transition: all 0.3s ease-out;
  }

  .message-leave-active {
    transition: all 0.2s ease-in;
  }

  .message-enter-from {
    opacity: 0;
    transform: translateY(-20px);
  }

  .message-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }

  .message-move {
    transition: transform 0.3s ease;
  }
</style>
