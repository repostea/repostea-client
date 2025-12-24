<template>
  <div class="container mx-auto p-2 sm:p-4 max-w-3xl">
    <!-- Back link -->
    <NuxtLink
      :to="localePath(`/s/${subName}`)"
      class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-4"
    >
      <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
      {{ $t('common.back') }}
    </NuxtLink>

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

    <!-- Loading state -->
    <div v-if="loading" class="py-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"/>
      <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('common.loading') }}</p>
    </div>

    <!-- Not authorized -->
    <div v-else-if="!sub?.is_moderator" class="py-8">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <Icon name="fa6-solid:lock" class="text-4xl text-red-500 mb-3" aria-hidden="true" />
        <h2 class="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
          {{ $t('subs.settings_not_authorized_title') }}
        </h2>
        <p class="text-red-600 dark:text-red-400">
          {{ $t('subs.settings_not_authorized_description') }}
        </p>
      </div>
    </div>

    <!-- Settings form -->
    <div v-else class="space-y-6">
      <!-- Header with title -->
      <div class="card-bg rounded-lg shadow-sm border settings-border">
        <div class="px-6 py-4 border-b settings-border">
          <h1 class="text-xl font-bold inline-flex items-center">
            <Icon name="fa6-solid:gear" class="mr-2" aria-hidden="true" />
            {{ $t('subs.settings_title') }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            s/{{ sub.name }}
          </p>
        </div>

        <!-- Tab Navigation -->
        <div class="px-6 border-b settings-border">
          <nav class="flex gap-1 -mb-px overflow-x-auto" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              role="tab"
              :aria-selected="activeTab === tab.id"
              :class="[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              ]"
              @click="activeTab = tab.id"
            >
              <Icon :name="tab.icon" aria-hidden="true" />
              {{ tab.label }}
              <span
                v-if="tab.id === 'moderation' && moderationBadgeCount > 0"
                class="ml-1 px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full"
              >
                {{ moderationBadgeCount }}
              </span>
              <span
                v-if="tab.id === 'members' && membersBadgeCount > 0"
                class="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {{ membersBadgeCount }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Panels -->
        <div class="p-6">
          <!-- General Tab -->
          <div v-show="activeTab === 'general'" role="tabpanel">
            <form class="space-y-6" @submit.prevent="saveSettings">
              <!-- Basic Info -->
              <div class="space-y-4">
                <h2 class="text-lg font-semibold flex items-center">
                  <Icon name="fa6-solid:circle-info" class="mr-2 text-primary" aria-hidden="true" />
                  {{ $t('subs.settings_basic_info') }}
                </h2>

                <!-- Sub Name (read-only) -->
                <div>
                  <label class="block text-sm font-medium mb-1">
                    {{ $t('subs.sub_name') }}
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 dark:text-gray-400">s/</span>
                    </div>
                    <input
                      :value="sub.name"
                      type="text"
                      disabled
                      class="w-full pl-8 pr-3 py-2 border rounded-md settings-input opacity-60 cursor-not-allowed"
                    >
                  </div>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('subs.name_requirements') }}
                  </p>
                </div>

                <!-- Title / Display Name -->
                <div>
                  <label for="display_name" class="block text-sm font-medium mb-1">
                    {{ $t('subs.title') }}
                  </label>
                  <input
                    id="display_name"
                    v-model="form.display_name"
                    type="text"
                    class="w-full px-3 py-2 border rounded-md settings-input"
                    :placeholder="$t('subs.title_placeholder')"
                    maxlength="100"
                  >
                </div>

                <!-- Description -->
                <div>
                  <label for="description" class="block text-sm font-medium mb-1">
                    {{ $t('subs.description') }}
                  </label>
                  <textarea
                    id="description"
                    v-model="form.description"
                    rows="3"
                    class="w-full px-3 py-2 border rounded-md settings-input"
                    :placeholder="$t('subs.description_placeholder')"
                    maxlength="500"
                  />
                  <p class="text-xs text-gray-500 mt-1">{{ form.description?.length || 0 }}/500</p>
                </div>
              </div>

              <!-- Shared Form Fields (Icon, Privacy, Content Types, Rules) -->
              <SubFormFields
                v-model="form"
                :sub-id="sub?.id"
                :sub-name="sub?.name"
                :show-section-headers="true"
                :show-nsfw-description="true"
                :show-content-types-description="true"
                :show-rules-description="false"
                :use-is-public="false"
              />

              <!-- Visibility Settings (Owner only) -->
              <div v-if="sub.is_owner" class="space-y-4">
                <h2 class="text-lg font-semibold flex items-center">
                  <Icon name="fa6-solid:eye-slash" class="mr-2 text-primary" aria-hidden="true" />
                  {{ $t('subs.visibility_settings') }}
                </h2>

                <div class="space-y-3">
                  <div class="flex items-start">
                    <input
                      id="hide_owner"
                      v-model="form.hide_owner"
                      type="checkbox"
                      class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                    >
                    <div class="ml-3">
                      <label for="hide_owner" class="text-sm font-medium cursor-pointer">
                        {{ $t('subs.hide_owner') }}
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ $t('subs.hide_owner_description') }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start">
                    <input
                      id="hide_moderators"
                      v-model="form.hide_moderators"
                      type="checkbox"
                      class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                    >
                    <div class="ml-3">
                      <label for="hide_moderators" class="text-sm font-medium cursor-pointer">
                        {{ $t('subs.hide_moderators') }}
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ $t('subs.hide_moderators_description') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit -->
              <div class="pt-4 border-t settings-border flex justify-end gap-3">
                <NuxtLink
                  :to="localePath(`/s/${subName}`)"
                  class="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {{ $t('common.cancel') }}
                </NuxtLink>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-6 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <span v-if="saving" class="inline-flex items-center">
                    <Icon name="fa6-solid:spinner" class="animate-spin mr-2" aria-hidden="true" />
                    {{ $t('common.saving') }}
                  </span>
                  <span v-else>{{ $t('common.save') }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Moderation Tab -->
          <div v-show="activeTab === 'moderation'" role="tabpanel" class="space-y-6">
            <!-- Pending Posts Moderation -->
            <div v-if="sub.require_approval">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold inline-flex items-center">
                  <Icon name="fa6-solid:clock" class="mr-2 text-primary" aria-hidden="true" />
                  {{ $t('subs.pending_posts') }}
                </h2>
                <span v-if="pendingPosts.length > 0" class="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                  {{ pendingPosts.length }}
                </span>
              </div>

              <div v-if="loadingPending" class="text-center py-4">
                <Icon name="fa6-solid:spinner" class="animate-spin text-2xl text-gray-400" aria-hidden="true" />
              </div>

              <div v-else-if="pendingPosts.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Icon name="fa6-solid:circle-check" class="text-3xl mb-2 text-green-500" aria-hidden="true" />
                <p>{{ $t('subs.no_pending_posts') }}</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="post in pendingPosts"
                  :key="post.id"
                  class="p-3 border rounded-lg settings-border"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-sm truncate">{{ post.title }}</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ $t('common.by') }} {{ post.user?.username }} · {{ formatTimeAgo(post.created_at) }}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <button
                        :disabled="moderatingPost === post.id"
                        class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        :title="$t('subs.approve')"
                        @click="approvePost(post.id)"
                      >
                        <Icon name="fa6-solid:check" aria-hidden="true" />
                      </button>
                      <button
                        :disabled="moderatingPost === post.id"
                        class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        :title="$t('subs.reject')"
                        @click="rejectPost(post.id)"
                      >
                        <Icon name="fa6-solid:xmark" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Icon name="fa6-solid:circle-info" class="text-2xl mb-2 text-gray-400" aria-hidden="true" />
              <p class="text-sm">{{ $t('subs.approval_not_required') }}</p>
            </div>

            <!-- Hidden Posts -->
            <div class="pt-6 border-t settings-border">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-lg font-semibold inline-flex items-center">
                    <Icon name="fa6-solid:eye-slash" class="mr-2 text-primary" aria-hidden="true" />
                    {{ $t('subs.hidden_posts') }}
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ $t('subs.hidden_posts_description') }}
                  </p>
                </div>
                <span v-if="hiddenPosts.length > 0" class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  {{ hiddenPosts.length }}
                </span>
              </div>

              <div v-if="loadingHidden" class="text-center py-4">
                <Icon name="fa6-solid:spinner" class="animate-spin text-2xl text-gray-400" aria-hidden="true" />
              </div>

              <div v-else-if="hiddenPosts.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Icon name="fa6-solid:circle-check" class="text-3xl mb-2 text-green-500" aria-hidden="true" />
                <p>{{ $t('subs.no_hidden_posts') }}</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="post in hiddenPosts"
                  :key="post.id"
                  class="p-3 border rounded-lg settings-border"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-sm truncate">{{ post.title }}</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ $t('common.by') }} {{ post.user?.username }} · {{ formatTimeAgo(post.created_at) }}
                      </p>
                      <p v-if="post.moderation_reason" class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        <strong>{{ $t('subs.hidden_reason') }}:</strong> {{ post.moderation_reason }}
                      </p>
                      <p v-if="post.moderated_by" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {{ $t('subs.hidden_by') }}: {{ post.moderated_by?.username || 'Unknown' }}
                      </p>
                    </div>
                    <button
                      :disabled="unhidingPost === post.id"
                      class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      :title="$t('subs.unhide_post')"
                      @click="unhidePost(post.id)"
                    >
                      <Icon v-if="unhidingPost === post.id" name="fa6-solid:spinner" class="animate-spin" aria-hidden="true" />
                      <Icon v-else name="fa6-solid:eye" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Members Tab -->
          <div v-show="activeTab === 'members'" role="tabpanel" class="space-y-6">
            <!-- Membership Requests (for private subs) -->
            <div v-if="sub.is_private">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold inline-flex items-center">
                  <Icon name="fa6-solid:user-plus" class="mr-2 text-primary" aria-hidden="true" />
                  {{ $t('subs.membership_requests') }}
                </h2>
                <span v-if="membershipRequests.length > 0" class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {{ membershipRequests.length }}
                </span>
              </div>

              <div v-if="loadingRequests" class="text-center py-4">
                <Icon name="fa6-solid:spinner" class="animate-spin text-2xl text-gray-400" aria-hidden="true" />
              </div>

              <div v-else-if="membershipRequests.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Icon name="fa6-solid:circle-check" class="text-3xl mb-2 text-green-500" aria-hidden="true" />
                <p>{{ $t('subs.no_membership_requests') }}</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="request in membershipRequests"
                  :key="request.id"
                  class="p-3 border rounded-lg settings-border"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="request.avatar"
                        :src="request.avatar"
                        :alt="request.username"
                        class="w-10 h-10 rounded-full"
                      >
                      <div v-else class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {{ request.username?.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <NuxtLink :to="localePath(`/u/${request.username}`)" class="font-medium text-sm hover:text-primary">
                          {{ request.username }}
                        </NuxtLink>
                        <p v-if="request.pivot?.request_message" class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {{ request.pivot.request_message }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {{ formatTimeAgo(request.pivot?.created_at) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        :disabled="processingRequest === request.id"
                        class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        :title="$t('subs.approve')"
                        @click="approveMembershipRequest(request.id)"
                      >
                        <Icon name="fa6-solid:check" aria-hidden="true" />
                      </button>
                      <button
                        :disabled="processingRequest === request.id"
                        class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        :title="$t('subs.reject')"
                        @click="rejectMembershipRequest(request.id)"
                      >
                        <Icon name="fa6-solid:xmark" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Members Management -->
            <div :class="{ 'pt-6 border-t settings-border': sub.is_private }">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold inline-flex items-center">
                  <Icon name="fa6-solid:users" class="mr-2 text-primary" aria-hidden="true" />
                  {{ $t('subs.members_title') }}
                </h2>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ sub.members_count || 0 }} {{ $t('subs.members') }}
                </span>
              </div>

              <div v-if="loadingMembers" class="text-center py-4">
                <Icon name="fa6-solid:spinner" class="animate-spin text-2xl text-gray-400" aria-hidden="true" />
              </div>

              <div v-else-if="membersList.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p>{{ $t('subs.no_members') }}</p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="member in membersList"
                  :key="member.id"
                  class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div class="flex items-center gap-3">
                    <img
                      v-if="member.avatar"
                      :src="member.avatar"
                      :alt="member.username"
                      class="w-8 h-8 rounded-full"
                    >
                    <div v-else class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {{ member.username?.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <NuxtLink :to="localePath(`/u/${member.username}`)" class="text-sm font-medium hover:text-primary">
                        {{ member.username }}
                      </NuxtLink>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatTimeAgo(member.joined_at) }}
                      </p>
                    </div>
                  </div>
                  <button
                    v-if="member.id !== sub.created_by"
                    :disabled="removingMember === member.id"
                    class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-sm"
                    :title="$t('subs.remove_member')"
                    @click="confirmRemoveMember(member)"
                  >
                    <Icon name="fa6-solid:user-minus" aria-hidden="true" />
                  </button>
                  <span v-else class="text-xs text-primary font-medium">
                    {{ $t('subs.owner') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Tab (Owner only) -->
          <div v-show="activeTab === 'team'" role="tabpanel">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold inline-flex items-center">
                  <Icon name="fa6-solid:shield" class="mr-2 text-primary" aria-hidden="true" />
                  {{ $t('subs.moderators_title') }}
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ $t('subs.moderators_description') }}
                </p>
              </div>
              <button
                v-if="availableMembers.length > 0"
                class="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors inline-flex items-center"
                @click="showAddModeratorModal = true"
              >
                <Icon name="fa6-solid:plus" class="mr-1" aria-hidden="true" />
                {{ $t('subs.add_moderator') }}
              </button>
            </div>

            <div v-if="loadingModerators" class="text-center py-4">
              <Icon name="fa6-solid:spinner" class="animate-spin text-2xl text-gray-400" aria-hidden="true" />
            </div>

            <div v-else class="space-y-2">
              <!-- Owner (always shown first) -->
              <div class="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div class="flex items-center gap-3">
                  <img
                    v-if="sub.creator?.avatar"
                    :src="sub.creator.avatar"
                    :alt="sub.creator?.username"
                    class="w-8 h-8 rounded-full"
                  >
                  <div v-else class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                    {{ sub.creator?.username?.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <NuxtLink :to="localePath(`/u/${sub.creator?.username}`)" class="text-sm font-medium hover:text-primary">
                      {{ sub.creator?.username }}
                    </NuxtLink>
                  </div>
                </div>
                <span class="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded">
                  {{ $t('subs.owner') }}
                </span>
              </div>

              <!-- Other moderators -->
              <div
                v-for="mod in moderatorsList"
                :key="mod.id"
                class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div class="flex items-center gap-3">
                  <img
                    v-if="mod.avatar"
                    :src="mod.avatar"
                    :alt="mod.username"
                    class="w-8 h-8 rounded-full"
                  >
                  <div v-else class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                    {{ mod.username?.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <NuxtLink :to="localePath(`/u/${mod.username}`)" class="text-sm font-medium hover:text-primary">
                      {{ mod.username }}
                    </NuxtLink>
                  </div>
                </div>
                <button
                  :disabled="removingModerator === mod.id"
                  class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-sm"
                  :title="$t('subs.remove_moderator')"
                  @click="confirmRemoveModerator(mod)"
                >
                  <Icon name="fa6-solid:user-minus" aria-hidden="true" />
                </button>
              </div>

              <!-- No other moderators message -->
              <p v-if="moderatorsList.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                {{ $t('subs.no_moderators') }}
              </p>
            </div>
          </div>
        </div>
        <!-- End Tab Panels -->
      </div>
      <!-- End Header Card -->

      <!-- Add Moderator Modal -->
      <Teleport to="body">
        <div v-if="showAddModeratorModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddModeratorModal = false">
          <div class="card-bg rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div class="px-6 py-4 border-b settings-border">
              <h3 class="text-lg font-bold">{{ $t('subs.add_moderator') }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('subs.add_moderator_description') }}</p>
            </div>
            <div class="p-6 max-h-[50vh] overflow-y-auto">
              <div v-if="availableMembers.length === 0" class="text-center py-4 text-gray-500">
                {{ $t('subs.no_members') }}
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="member in availableMembers"
                  :key="member.id"
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  :class="selectedMemberForMod?.id === member.id ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'"
                  @click="selectedMemberForMod = member"
                >
                  <img
                    v-if="member.avatar"
                    :src="member.avatar"
                    :alt="member.username"
                    class="w-8 h-8 rounded-full"
                  >
                  <div v-else class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                    {{ member.username?.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-sm font-medium">{{ member.username }}</span>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t settings-border flex justify-end gap-3">
              <button
                class="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                @click="showAddModeratorModal = false"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                :disabled="!selectedMemberForMod || addingModerator"
                class="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 inline-flex items-center"
                @click="addModerator"
              >
                <Icon v-if="addingModerator" name="fa6-solid:spinner" class="animate-spin mr-2" aria-hidden="true" />
                {{ $t('subs.promote_to_moderator') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#i18n'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { useSubsStore } from '~/stores/subs'
import { useNotification } from '~/composables/useNotification'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const subsStore = useSubsStore()
const { success, error: showError } = useNotification()

const subName = computed(() => route.params.name)
const sub = computed(() => subsStore.currentSub)
const loading = computed(() => subsStore.loading)

const saving = ref(false)

// Moderation state
const pendingPosts = ref([])
const loadingPending = ref(false)
const moderatingPost = ref(null)

// Members state
const members = ref([])
const loadingMembers = ref(false)
const removingMember = ref(null)

// Membership requests state
const membershipRequests = ref([])
const loadingRequests = ref(false)
const processingRequest = ref(null)

// Moderators state
const moderators = ref([])
const loadingModerators = ref(false)
const addingModerator = ref(false)
const removingModerator = ref(null)
const showAddModeratorModal = ref(false)
const selectedMemberForMod = ref(null)

// Hidden posts state
const hiddenPosts = ref([])
const loadingHidden = ref(false)
const unhidingPost = ref(null)

// Tab navigation
const activeTab = ref('general')
const tabs = computed(() => {
  const baseTabs = [
    { id: 'general', label: t('subs.settings_tab_general'), icon: 'fa6-solid:gear' },
    { id: 'moderation', label: t('subs.settings_tab_moderation'), icon: 'fa6-solid:shield-halved' },
    { id: 'members', label: t('subs.settings_tab_members'), icon: 'fa6-solid:users' }
  ]
  if (sub.value?.is_owner) {
    baseTabs.push({ id: 'team', label: t('subs.settings_tab_team'), icon: 'fa6-solid:user-shield' })
  }
  return baseTabs
})

// Badge counts for tabs
const moderationBadgeCount = computed(() => {
  let count = 0
  if (sub.value?.require_approval) count += pendingPosts.value.length
  return count
})
const membersBadgeCount = computed(() => {
  if (sub.value?.is_private) return membershipRequests.value.length
  return 0
})

// Safe list computed properties
const membersList = computed(() => {
  return Array.isArray(members.value) ? members.value : []
})
const moderatorsList = computed(() => {
  const modList = Array.isArray(moderators.value) ? moderators.value : []
  return modList.filter(m => m.id !== sub.value?.created_by)
})

const form = ref({
  display_name: '',
  description: '',
  icon: '📄',
  color: '#6366F1',
  is_private: false,
  require_approval: false,
  allow_nsfw: false,
  allowed_content_types: ['text', 'link', 'image', 'video', 'audio', 'poll'],
  rules: [],
  hide_owner: false,
  hide_moderators: false
})

// Fetch sub data on mount
onMounted(async () => {
  if (!sub.value || sub.value.name !== subName.value) {
    await subsStore.fetchSub(subName.value)
  }
  initForm()

  // Load moderation data if user is moderator
  if (sub.value?.is_moderator) {
    loadPendingPosts()
    loadMembers()
    loadModerators()
    loadHiddenPosts()
    if (sub.value.is_private) {
      loadMembershipRequests()
    }
  }
})

// Watch for sub changes to load moderation data
watch(sub, (newSub) => {
  if (newSub?.is_moderator) {
    loadPendingPosts()
    loadMembers()
    loadModerators()
    loadHiddenPosts()
    if (newSub.is_private) {
      loadMembershipRequests()
    }
  }
})

watch(sub, () => {
  initForm()
})

function initForm() {
  if (sub.value) {
    form.value = {
      display_name: sub.value.display_name || '',
      description: sub.value.description || '',
      icon: sub.value.icon || '📄',
      color: sub.value.color || '#6366F1',
      is_private: sub.value.is_private || false,
      require_approval: sub.value.require_approval || false,
      allow_nsfw: sub.value.is_adult || false,
      allowed_content_types: sub.value.allowed_content_types || ['text', 'link', 'image', 'video', 'audio', 'poll'],
      rules: Array.isArray(sub.value.rules) ? [...sub.value.rules] : [],
      hide_owner: sub.value.hide_owner || false,
      hide_moderators: sub.value.hide_moderators || false
    }
  }
}

async function saveSettings() {
  saving.value = true

  try {
    // Filter out empty rules
    const rules = form.value.rules.filter(r => r.title.trim())

    await subsStore.updateSub(sub.value.id, {
      display_name: form.value.display_name,
      description: form.value.description,
      icon: form.value.icon,
      color: form.value.color,
      is_private: form.value.is_private,
      require_approval: form.value.require_approval,
      is_adult: form.value.allow_nsfw,
      allowed_content_types: form.value.allowed_content_types,
      rules: rules.length > 0 ? JSON.stringify(rules) : null,
      hide_owner: form.value.hide_owner,
      hide_moderators: form.value.hide_moderators
    })

    success(t('subs.settings_saved'))
    router.push(localePath(`/s/${subName.value}`))
  } catch (err) {
    console.error('Error saving settings:', err)
    showError(err.response?.data?.message || t('subs.settings_error'))
  } finally {
    saving.value = false
  }
}

// Moderation functions
async function loadPendingPosts() {
  if (!sub.value?.id) return
  loadingPending.value = true
  try {
    const response = await $api.subs.getPendingPosts(sub.value.id)
    pendingPosts.value = response.data || []
  } catch (err) {
    console.error('Error loading pending posts:', err)
  } finally {
    loadingPending.value = false
  }
}

async function approvePost(postId) {
  moderatingPost.value = postId
  try {
    await $api.subs.approvePost(sub.value.id, postId)
    pendingPosts.value = pendingPosts.value.filter(p => p.id !== postId)
    success(t('subs.post_approved'))
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_approving'))
  } finally {
    moderatingPost.value = null
  }
}

async function rejectPost(postId) {
  moderatingPost.value = postId
  try {
    await $api.subs.rejectPost(sub.value.id, postId)
    pendingPosts.value = pendingPosts.value.filter(p => p.id !== postId)
    success(t('subs.post_rejected'))
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_rejecting'))
  } finally {
    moderatingPost.value = null
  }
}

// Members functions
async function loadMembers() {
  if (!sub.value?.id) return
  loadingMembers.value = true
  try {
    const response = await $api.subs.getMembers(sub.value.id)
    members.value = response.data || []
  } catch (err) {
    console.error('Error loading members:', err)
  } finally {
    loadingMembers.value = false
  }
}

async function confirmRemoveMember(member) {
  if (!confirm(t('subs.confirm_remove_member', { username: member.username }))) {
    return
  }
  removingMember.value = member.id
  try {
    await $api.subs.removeMember(sub.value.id, member.id)
    members.value = members.value.filter(m => m.id !== member.id)
    success(t('subs.member_removed'))
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_removing_member'))
  } finally {
    removingMember.value = null
  }
}

// Membership requests functions
async function loadMembershipRequests() {
  if (!sub.value?.id) return
  loadingRequests.value = true
  try {
    const response = await $api.subs.getMembershipRequests(sub.value.id)
    membershipRequests.value = response.data || []
  } catch (err) {
    console.error('Error loading membership requests:', err)
  } finally {
    loadingRequests.value = false
  }
}

async function approveMembershipRequest(userId) {
  processingRequest.value = userId
  try {
    await $api.subs.approveMembershipRequest(sub.value.id, userId)
    membershipRequests.value = membershipRequests.value.filter(r => r.id !== userId)
    success(t('subs.request_approved'))
    // Reload members to show the new member
    loadMembers()
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_approving_request'))
  } finally {
    processingRequest.value = null
  }
}

async function rejectMembershipRequest(userId) {
  processingRequest.value = userId
  try {
    await $api.subs.rejectMembershipRequest(sub.value.id, userId)
    membershipRequests.value = membershipRequests.value.filter(r => r.id !== userId)
    success(t('subs.request_rejected'))
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_rejecting_request'))
  } finally {
    processingRequest.value = null
  }
}

// Moderators functions
async function loadModerators() {
  if (!sub.value?.id) return
  loadingModerators.value = true
  try {
    const response = await $api.subs.getModerators(sub.value.id)
    moderators.value = response.data || []
  } catch (err) {
    console.error('Error loading moderators:', err)
  } finally {
    loadingModerators.value = false
  }
}

async function addModerator() {
  if (!selectedMemberForMod.value) return
  addingModerator.value = true
  try {
    await $api.subs.addModerator(sub.value.id, selectedMemberForMod.value.id)
    success(t('subs.moderator_added'))
    showAddModeratorModal.value = false
    selectedMemberForMod.value = null
    loadModerators()
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_adding_moderator'))
  } finally {
    addingModerator.value = false
  }
}

async function confirmRemoveModerator(moderator) {
  if (!confirm(t('subs.confirm_remove_moderator', { username: moderator.username }))) {
    return
  }
  removingModerator.value = moderator.id
  try {
    await $api.subs.removeModerator(sub.value.id, moderator.id)
    moderators.value = moderators.value.filter(m => m.id !== moderator.id)
    success(t('subs.moderator_removed'))
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_removing_moderator'))
  } finally {
    removingModerator.value = null
  }
}

// Get members that are not yet moderators (for adding new moderators)
const availableMembers = computed(() => {
  const modList = Array.isArray(moderators.value) ? moderators.value : []
  const memberList = Array.isArray(members.value) ? members.value : []
  const modIds = new Set(modList.map(m => m.id))
  modIds.add(sub.value?.created_by) // Owner is always a moderator
  return memberList.filter(m => !modIds.has(m.id))
})

// Hidden posts functions
async function loadHiddenPosts() {
  if (!sub.value?.id) return
  loadingHidden.value = true
  try {
    const response = await $api.subs.getHiddenPosts(sub.value.id)
    hiddenPosts.value = response.data?.data || []
  } catch (err) {
    console.error('Error loading hidden posts:', err)
  } finally {
    loadingHidden.value = false
  }
}

async function unhidePost(postId) {
  unhidingPost.value = postId
  try {
    await $api.subs.unhidePost(sub.value.id, postId)
    hiddenPosts.value = hiddenPosts.value.filter(p => p.id !== postId)
    success(t('subs.post_unhidden'))
  } catch (err) {
    showError(err.response?.data?.message || t('subs.error_unhiding_post'))
  } finally {
    unhidingPost.value = null
  }
}

function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('common.just_now')
  if (diffMins < 60) return t('common.minutes_ago', { count: diffMins })
  if (diffHours < 24) return t('common.hours_ago', { count: diffHours })
  if (diffDays < 30) return t('common.days_ago', { count: diffDays })
  return date.toLocaleDateString()
}
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
  ring: 2px;
  ring-color: var(--color-primary);
}
</style>
