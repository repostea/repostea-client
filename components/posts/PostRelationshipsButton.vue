<template>
  <div>
    <!-- Button to show relationships (only if not always expanded) -->
    <FooterButton
      v-if="!alwaysExpanded"
      icon="fa6-solid:diagram-project"
      :title="t('posts.relationships.title')"
      :count="relationshipsCount"
      @click="showModal = true"
    />

    <!-- Modal (only if not always expanded) -->
    <Teleport to="body">
      <div
        v-if="showModal && !alwaysExpanded"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        @click.self="showModal = false"
      >
      <div class="card-bg rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="rel-modal-header px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h3 class="text-lg font-semibold text-text dark:text-text-dark flex items-center">
            <Icon name="fa6-solid:diagram-project" class="mr-2" aria-hidden="true" />
            {{ t('posts.relationships.title') }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="showModal = false"
          >
            <Icon name="fa6-solid:xmark" class="text-xl" aria-hidden="true" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-4">
          <div v-if="loading" class="text-center py-8">
            <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>

          <div v-else-if="error" class="text-center py-8 text-red-500 dark:text-red-400">
            <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
            {{ error }}
          </div>

          <div v-else-if="groupedRelationships.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <Icon name="fa6-solid:link-slash" class="text-4xl mb-4 opacity-50 mx-auto block" aria-hidden="true" />
            <p class="mb-4">{{ t('posts.relationships.none') }}</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="group in groupedRelationships"
              :key="group.type"
              class="contents"
            >
              <div
                v-for="rel in group.relationships"
                :key="rel.id"
                class="rel-card rounded-lg hover:shadow-md transition-shadow"
              >
                  <!-- Mobile: Use compact sidebar design -->
                  <div class="sm:hidden">
                    <div class="flex items-start">
                      <!-- Post votes badge - compact -->
                      <div class="flex-shrink-0 m-2">
                        <div class="flex flex-col items-center justify-start w-14 px-1.5 py-2 rounded-lg vote-badge-static">
                          <div class="text-base font-bold leading-none tabular-nums">
                            {{ rel.post.vote_count || 0 }}
                          </div>
                          <div class="text-[10px] font-semibold mt-1 vote-badge-text-static">
                            {{ t('posts.votes') }}
                          </div>
                        </div>
                      </div>

                      <!-- Post card - smaller text -->
                      <NuxtLink
                        :to="localePath(rel.post.url || `/posts/${rel.post.slug || rel.post.id}`)"
                        class="flex-1 p-2 rel-item-hover transition-colors"
                        @click="showModal = false"
                      >
                        <div class="text-xs font-medium text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-light line-clamp-2 mb-1">
                          {{ rel.post.title }}
                        </div>

                        <div class="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                          <Icon name="fa6-solid:user" class="mr-1" aria-hidden="true" />
                          {{ rel.post.author }}
                        </div>

                        <div class="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <span class="flex items-center">
                            <Icon name="fa6-solid:clock" class="mr-1" aria-hidden="true" />
                            {{ formatDate(rel.post.created_at) }}
                          </span>
                          <template v-if="rel.post.comment_count > 0">
                            <span>•</span>
                            <span class="flex items-center">
                              <Icon name="fa6-solid:comment" class="mr-1" aria-hidden="true" />
                              {{ rel.post.comment_count }}
                            </span>
                          </template>
                        </div>
                      </NuxtLink>
                    </div>

                    <!-- Footer -->
                    <div v-if="rel.notes || rel.created_by || canEditRelationship(rel)" class="px-2 pb-2">
                      <div v-if="rel.created_by" class="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        <Icon name="fa6-solid:link" class="text-primary dark:text-primary-light" aria-hidden="true" />
                        <span class="font-medium text-gray-700 dark:text-gray-300">
                          {{ rel.created_by || t('common.anonymous') }}
                        </span>
                        <span>•</span>
                        <span>{{ formatDate(rel.created_at) }}</span>
                      </div>

                      <div v-if="rel.notes" class="text-[11px] text-gray-700 dark:text-gray-300 mb-1 p-1.5 rel-notes-bg border-l-2 rel-notes-border rounded-sm">
                        <div class="font-semibold text-primary dark:text-primary-light text-[10px] mb-0.5">
                          {{ t('posts.relationships.why_related') }}:
                        </div>
                        <div class="italic whitespace-pre-line line-clamp-2">
                          {{ rel.notes }}
                        </div>
                      </div>

                      <div v-if="canEditRelationship(rel)" class="flex items-center gap-1 mt-1">
                        <button
                          class="inline-flex items-center text-[10px] px-1.5 py-0.5 text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          @click.prevent="editRelationship(rel)"
                        >
                          <Icon name="fa6-solid:pen-to-square" class="mr-0.5" aria-hidden="true" />
                          {{ t('common.edit') }}
                        </button>
                        <button
                          class="inline-flex items-center text-[10px] px-1.5 py-0.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          @click.prevent="openDeleteConfirm(rel)"
                        >
                          <Icon name="fa6-solid:trash" class="mr-0.5" aria-hidden="true" />
                          {{ t('common.delete') }}
                        </button>
                      </div>
                    </div>

                    <!-- Vote section at bottom -->
                    <div class="rel-vote-section flex items-center justify-center gap-2 px-3 py-1.5">
                      <span class="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {{ t('posts.relationships.vote_relationship') }}
                      </span>
                      <div class="flex items-center gap-1.5">
                        <button
                          :class="[
                            'w-6 h-6 flex items-center justify-center rounded rel-action-hover transition-colors',
                            rel.user_vote === 1 ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' : 'text-gray-500 dark:text-gray-400'
                          ]"
                          :title="t('posts.relationships.vote_useful')"
                          :aria-label="t('posts.relationships.vote_useful')"
                          @click.stop="voteRelationship(rel.id, 1)"
                        >
                          <Icon name="fa6-solid:arrow-up" class="text-xs" aria-hidden="true" />
                        </button>
                        <div class="text-sm font-bold leading-none tabular-nums min-w-[1.5rem] text-center" :class="getScoreClass(rel.score)">
                          {{ rel.score || 0 }}
                        </div>
                        <button
                          :class="[
                            'w-6 h-6 flex items-center justify-center rounded rel-action-hover transition-colors',
                            rel.user_vote === -1 ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' : 'text-gray-500 dark:text-gray-400'
                          ]"
                          :title="t('posts.relationships.vote_not_useful')"
                          :aria-label="t('posts.relationships.vote_not_useful')"
                          @click.stop="voteRelationship(rel.id, -1)"
                        >
                          <Icon name="fa6-solid:arrow-down" class="text-xs" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Desktop: Original design with vote bar on right -->
                  <div class="hidden sm:flex sm:items-stretch">
                    <div class="flex items-start flex-1">
                      <!-- Post votes badge (non-interactive, display only) - VoteBadge style -->
                      <div class="flex flex-col items-center justify-start w-20 px-2 py-3 m-3 rounded-lg vote-badge-static flex-shrink-0">
                        <div class="text-xl font-bold leading-none tabular-nums">
                          {{ rel.post.vote_count || 0 }}
                        </div>
                        <div class="text-xs font-semibold mt-1 vote-badge-text-static">
                          {{ t('posts.votes') }}
                        </div>
                      </div>

                      <!-- Post card (clickable) -->
                      <NuxtLink
                        :to="localePath(rel.post.url || `/posts/${rel.post.slug || rel.post.id}`)"
                        class="flex-1 p-4 rel-item-hover transition-colors"
                        @click="showModal = false"
                      >
                        <div class="flex-1 min-w-0">
                          <div class="flex items-start gap-2 mb-2">
                            <div class="text-base font-medium text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-light line-clamp-2 flex-1">
                              {{ rel.post.title }}
                            </div>
                            <span
                              class="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                              :style="{
                                backgroundColor: `${getTypeColor(group.type)}15`,
                                color: getTypeColor(group.type),
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: `${getTypeColor(group.type)}40`
                              }"
                            >
                              {{ group.label }}
                            </span>
                          </div>

                          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span class="flex items-center">
                              <Icon name="fa6-solid:user" class="mr-1" aria-hidden="true" />
                              {{ rel.post.author }}
                            </span>
                          </div>

                          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span class="flex items-center">
                              <Icon name="fa6-solid:clock" class="mr-1" aria-hidden="true" />
                              {{ formatDate(rel.post.created_at) }}
                            </span>
                            <template v-if="rel.post.comment_count > 0">
                              <span>•</span>
                              <span class="flex items-center">
                                <Icon name="fa6-solid:comment" class="mr-1" aria-hidden="true" />
                                {{ rel.post.comment_count }}
                              </span>
                            </template>
                            <template v-if="rel.post.frontpage_at">
                              <span>•</span>
                              <span class="flex items-center text-primary dark:text-primary-light">
                                <Icon name="fa6-solid:fire" class="mr-1" aria-hidden="true" />
                                {{ t('posts.frontpage') }}
                              </span>
                            </template>
                          </div>

                          <!-- Desktop footer inside NuxtLink -->
                          <div v-if="rel.notes || rel.created_by || canEditRelationship(rel)" class="rel-expanded-add mt-3 pt-3">
                            <div v-if="rel.created_by" class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                              <Icon name="fa6-solid:link" class="text-primary dark:text-primary-light text-xs" aria-hidden="true" />
                              <span class="font-medium text-gray-700 dark:text-gray-300">
                                {{ rel.created_by || t('common.anonymous') }}
                              </span>
                              <span>•</span>
                              <span>{{ formatDate(rel.created_at) }}</span>
                            </div>

                            <!-- Why related note (below who added it) -->
                            <div v-if="rel.notes" class="text-sm text-gray-700 dark:text-gray-300 mb-2 p-2.5 rel-notes-bg border-l-3 rel-notes-border rounded-sm">
                              <div class="font-semibold text-primary dark:text-primary-light text-xs mb-1">
                                {{ t('posts.relationships.why_related') }}:
                              </div>
                              <div class="italic whitespace-pre-line">
                                {{ rel.notes }}
                              </div>
                            </div>

                            <div v-if="canEditRelationship(rel)" class="flex items-center gap-2 mt-2">
                              <button
                                class="inline-flex items-center text-xs px-2 py-1 text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                                :title="t('common.edit')"
                                @click.stop="editRelationship(rel)"
                              >
                                <Icon name="fa6-solid:pen-to-square" class="mr-1" aria-hidden="true" />
                                {{ t('common.edit') }}
                              </button>
                              <button
                                class="inline-flex items-center text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                :title="t('common.delete')"
                                @click.stop="openDeleteConfirm(rel)"
                              >
                                <Icon name="fa6-solid:trash" class="mr-1" aria-hidden="true" />
                                {{ t('common.delete') }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </NuxtLink>
                    </div>

                    <!-- Vote relationship section (right side on desktop) - similar to VoteBadge -->
                    <div class="flex flex-col items-center justify-center w-24 py-3 rel-vote-badge-border rounded-r-lg relationship-vote-badge">
                      <div class="text-[10px] font-semibold vote-badge-text mb-1 text-center leading-tight">
                        {{ t('posts.relationships.vote_relationship') }}
                      </div>
                      <div class="text-2xl font-bold leading-none tabular-nums mb-2 vote-score-number" :class="getScoreClass(rel.score)">
                        {{ rel.score || 0 }}
                      </div>
                      <div class="flex gap-2">
                        <button
                          :class="[
                            'vote-arrow-btn',
                            rel.user_vote === 1 ? 'active' : ''
                          ]"
                          :title="t('posts.relationships.vote_useful')"
                          :aria-label="t('posts.relationships.vote_useful')"
                          @click.stop="voteRelationship(rel.id, 1)"
                        >
                          <Icon name="fa6-solid:arrow-up" aria-hidden="true" />
                        </button>
                        <button
                          :class="[
                            'vote-arrow-btn',
                            rel.user_vote === -1 ? 'active-down' : ''
                          ]"
                          :title="t('posts.relationships.vote_not_useful')"
                          :aria-label="t('posts.relationships.vote_not_useful')"
                          @click.stop="voteRelationship(rel.id, -1)"
                        >
                          <Icon name="fa6-solid:arrow-down" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <!-- Add Relationship Button (always visible at bottom) -->
          <div class="rel-add-section mt-6 pt-4">
            <button
              class="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary transition-colors rounded-lg"
              @click="showCreateForm = true"
            >
              <Icon name="fa6-solid:plus" class="mr-2" aria-hidden="true" />
              {{ t('posts.relationships.add_title') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Always Expanded Version (for sidebar) -->
    <div
      v-if="alwaysExpanded"
      class="rel-expanded-container card-bg rounded-lg shadow-sm"
    >
      <!-- Header -->
      <div class="rel-expanded-header px-4 py-3 flex items-center justify-between">
        <h3 class="font-medium text-text dark:text-text-dark flex items-center">
          <Icon name="fa6-solid:diagram-project" class="mr-2" aria-hidden="true" />
          {{ t('posts.relationships.title') }}
        </h3>
        <span v-if="relationshipsCount > 0" class="text-xs text-gray-500 dark:text-gray-400">
          {{ relationshipsCount }}
        </span>
      </div>

      <!-- Body -->
      <div class="p-4">
        <div v-if="loading" class="text-center py-4">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
        </div>

        <div v-else-if="error" class="text-center py-4 text-red-500 dark:text-red-400 text-sm">
          <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
          {{ error }}
        </div>

        <div v-else-if="groupedRelationships.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
          <Icon name="fa6-solid:link-slash" class="text-3xl mb-3 opacity-50 mx-auto block" aria-hidden="true" />
          <p class="text-sm">{{ t('posts.relationships.none') }}</p>
          <button
            v-if="authStore.isAuthenticated"
            class="mt-3 inline-flex items-center text-xs text-primary dark:text-primary-light hover:underline"
            @click="showCreateForm = true"
          >
            <Icon name="fa6-solid:plus" class="mr-1" aria-hidden="true" />
            {{ t('posts.relationships.add') }}
          </button>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="group in groupedRelationships"
            :key="group.type"
            class="contents"
          >
            <div
              v-for="rel in group.relationships"
              :key="rel.id"
              class="rel-card rounded-lg hover:shadow-md transition-shadow flex flex-col"
            >
                <div class="flex items-start">
                  <!-- Post votes badge - VoteBadge style -->
                  <div class="flex-shrink-0 m-2">
                    <div class="flex flex-col items-center justify-start w-14 px-1.5 py-2 rounded-lg vote-badge-static">
                      <div class="text-base font-bold leading-none tabular-nums">
                        {{ rel.post.vote_count || 0 }}
                      </div>
                      <div class="text-[10px] font-semibold mt-1 vote-badge-text-static">
                        {{ t('posts.votes') }}
                      </div>
                    </div>
                  </div>

                  <!-- Post card -->
                  <NuxtLink
                    :to="localePath(rel.post.url || `/posts/${rel.post.slug || rel.post.id}`)"
                    class="flex-1 p-2 rel-item-hover transition-colors"
                  >
                    <div class="flex items-start gap-1.5 mb-1">
                      <div class="text-xs font-medium text-text dark:text-text-dark hover:text-primary dark:hover:text-primary-light line-clamp-2 flex-1">
                        {{ rel.post.title }}
                      </div>
                      <span
                        class="px-1.5 py-0.5 rounded-full text-[9px] font-semibold flex-shrink-0"
                        :style="{
                          backgroundColor: `${getTypeColor(group.type)}15`,
                          color: getTypeColor(group.type),
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: `${getTypeColor(group.type)}40`
                        }"
                      >
                        {{ group.label }}
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                      <Icon name="fa6-solid:user" aria-hidden="true" />
                      {{ rel.post.author }}
                    </div>

                    <div class="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <span class="flex items-center">
                        <Icon name="fa6-solid:clock" class="mr-1" aria-hidden="true" />
                        {{ formatDate(rel.post.created_at) }}
                      </span>
                      <template v-if="rel.post.comment_count > 0">
                        <span>•</span>
                        <span class="flex items-center">
                          <Icon name="fa6-solid:comment" class="mr-1" aria-hidden="true" />
                          {{ rel.post.comment_count }}
                        </span>
                      </template>
                    </div>
                  </NuxtLink>
                </div>

                <!-- Footer (outside of NuxtLink to span full width) -->
                <div v-if="rel.notes || rel.created_by || canEditRelationship(rel)" class="px-2 pb-2">
                  <div v-if="rel.created_by" class="flex flex-wrap items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    <Icon name="fa6-solid:link" class="text-primary dark:text-primary-light" aria-hidden="true" />
                    <span class="font-medium text-gray-700 dark:text-gray-300">
                      {{ rel.created_by || t('common.anonymous') }}
                    </span>
                    <span>•</span>
                    <span>{{ formatDate(rel.created_at) }}</span>
                  </div>

                  <div v-if="rel.notes" class="text-[11px] text-gray-700 dark:text-gray-300 mb-1 p-1.5 rel-notes-bg border-l-2 rel-notes-border rounded-sm">
                    <div class="font-semibold text-primary dark:text-primary-light text-[10px] mb-0.5">
                      {{ t('posts.relationships.why_related') }}:
                    </div>
                    <div class="italic whitespace-pre-line line-clamp-2">
                      {{ rel.notes }}
                    </div>
                  </div>

                  <div v-if="canEditRelationship(rel)" class="flex items-center gap-1 mt-1">
                    <button
                      class="inline-flex items-center text-[10px] px-1.5 py-0.5 text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                      @click.prevent="editRelationship(rel)"
                    >
                      <Icon name="fa6-solid:pen-to-square" class="mr-0.5" aria-hidden="true" />
                      {{ t('common.edit') }}
                    </button>
                    <button
                      class="inline-flex items-center text-[10px] px-1.5 py-0.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      @click.prevent="openDeleteConfirm(rel)"
                    >
                      <Icon name="fa6-solid:trash" class="mr-0.5" aria-hidden="true" />
                      {{ t('common.delete') }}
                    </button>
                  </div>
                </div>

                <!-- Vote relationship badge (bottom) -->
                <div class="rel-vote-section flex items-center justify-center gap-2 px-3 py-1.5">
                  <span class="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {{ t('posts.relationships.vote_relationship') }}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <button
                      :class="[
                        'w-6 h-6 flex items-center justify-center rounded rel-action-hover transition-colors',
                        rel.user_vote === 1 ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' : 'text-gray-500 dark:text-gray-400'
                      ]"
                      :title="t('posts.relationships.vote_useful')"
                      :aria-label="t('posts.relationships.vote_useful')"
                      @click.stop="voteRelationship(rel.id, 1)"
                    >
                      <Icon name="fa6-solid:arrow-up" class="text-xs" aria-hidden="true" />
                    </button>
                    <div class="text-sm font-bold leading-none tabular-nums min-w-[1.5rem] text-center" :class="getScoreClass(rel.score)">
                      {{ rel.score || 0 }}
                    </div>
                    <button
                      :class="[
                        'w-6 h-6 flex items-center justify-center rounded rel-action-hover transition-colors',
                        rel.user_vote === -1 ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' : 'text-gray-500 dark:text-gray-400'
                      ]"
                      :title="t('posts.relationships.vote_not_useful')"
                      :aria-label="t('posts.relationships.vote_not_useful')"
                      @click.stop="voteRelationship(rel.id, -1)"
                    >
                      <Icon name="fa6-solid:arrow-down" class="text-xs" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          <!-- Add Relationship Button -->
          <div v-if="authStore.isAuthenticated" class="rel-expanded-add mt-3 pt-3">
            <button
              class="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary transition-colors rounded-lg"
              @click="showCreateForm = true"
            >
              <Icon name="fa6-solid:plus" class="mr-1" aria-hidden="true" />
              {{ t('posts.relationships.add') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Relationship Modal -->
    <AddRelationshipModal
      v-if="showCreateForm"
      :post-id="postId"
      :current-post-title="postTitle"
      :post-author-id="postAuthorId"
      @close="showCreateForm = false"
      @created="handleRelationshipCreated"
    />

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
        @click.self="closeDeleteConfirm"
      >
      <div class="card-bg rounded-lg shadow-xl w-full max-w-md" @click.stop>
        <div class="rel-delete-header px-6 py-4">
          <h2 class="text-xl font-medium text-red-600 dark:text-red-400">
            <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
            {{ t('posts.relationships.confirm_delete_title') }}
          </h2>
        </div>

        <div class="p-6">
          <p class="mb-4">{{ t('posts.relationships.confirm_delete') }}</p>
          <div v-if="relationshipToDelete" class="rel-delete-item mb-6 p-3 rounded-lg">
            <div class="text-sm font-medium text-text dark:text-text-dark mb-1">
              {{ relationshipToDelete.post.title }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('posts.relationships.types.' + relationshipToDelete.type) }}
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              class="rel-cancel-btn px-4 py-2 rounded-md transition-colors"
              @click="closeDeleteConfirm"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              :disabled="isDeleting"
              @click="confirmDeleteRelationship"
            >
              <span
                v-if="isDeleting"
                class="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
              />
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { useNuxtApp } from '#app'
  import { useLocalePath, useI18n } from '#i18n'
  import { useAuthStore } from '~/stores/auth'
  import AddRelationshipModal from '~/components/posts/AddRelationshipModal.vue'
  import FooterButton from '~/components/posts/postCard/FooterButton.vue'

  const { t, locale } = useI18n()
  const { timezone } = useUserTimezone()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()
  const authStore = useAuthStore()

  const props = defineProps({
    postId: {
      type: [Number, String],
      required: true,
    },
    relationshipsCount: {
      type: Number,
      default: 0,
    },
    postTitle: {
      type: String,
      default: '',
    },
    postAuthorId: {
      type: [Number, String],
      default: null,
    },
    alwaysExpanded: {
      type: Boolean,
      default: false,
    },
  })

  const showModal = ref(false)
  const showCreateForm = ref(false)
  const showDeleteConfirm = ref(false)
  const relationshipToDelete = ref(null)
  const editingRelationship = ref(null)
  const relationships = ref([])
  const loading = ref(false)
  const error = ref(null)
  const isDeleting = ref(false)

  const groupedRelationships = computed(() => {
    const groups = {
      reply: { type: 'reply', label: t('posts.relationships.types.reply'), icon: 'reply', relationships: [] },
      continuation: { type: 'continuation', label: t('posts.relationships.types.continuation'), icon: 'forward', relationships: [] },
      related: { type: 'related', label: t('posts.relationships.types.related'), icon: 'link', relationships: [] },
      update: { type: 'update', label: t('posts.relationships.types.update'), icon: 'sync', relationships: [] },
      correction: { type: 'correction', label: t('posts.relationships.types.correction'), icon: 'edit', relationships: [] },
      duplicate: { type: 'duplicate', label: t('posts.relationships.types.duplicate'), icon: 'copy', relationships: [] },
    }

    // Ensure relationships.value is an array before iterating
    if (Array.isArray(relationships.value)) {
      relationships.value.forEach((rel) => {
        if (groups[rel.type]) {
          groups[rel.type].relationships.push(rel)
        }
      })
    }

    return Object.values(groups).filter((g) => g.relationships.length > 0)
  })

  function getTypeColor(type) {
    const colors = {
      reply: '#3b82f6',
      continuation: '#8b5cf6',
      related: '#10b981',
      update: '#f59e0b',
      correction: '#ef4444',
      duplicate: '#6b7280',
    }
    return colors[type] || '#6b7280'
  }

  function getScoreClass(score) {
    const s = score || 0
    if (s >= 5) return 'text-green-600 dark:text-green-400'
    if (s >= 2) return 'text-blue-600 dark:text-blue-400'
    if (s > 0) return 'text-primary dark:text-primary-light'
    if (s < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  async function voteRelationship(relationshipId, voteValue) {
    try {
      const response = await $api.relationships.vote(relationshipId, voteValue)

      // Update the relationship in the local data
      const relationship = relationships.value.find(r => r.id === relationshipId)
      if (relationship) {
        const previousVote = relationship.user_vote

        // Toggle vote if same value, otherwise change vote
        if (previousVote === voteValue) {
          relationship.user_vote = null
          // Revert the vote count
          relationship.score = (relationship.score || 0) - voteValue
        } else {
          relationship.user_vote = voteValue
          // If had a previous vote, revert it first, then apply new vote
          if (previousVote !== null) {
            relationship.score = ((relationship.score || 0) - previousVote) + voteValue
          } else {
            relationship.score = (relationship.score || 0) + voteValue
          }
        }

        // Update counts from server response if available
        if (response.data?.stats) {
          relationship.upvotes_count = response.data.stats.upvotes
          relationship.downvotes_count = response.data.stats.downvotes
          relationship.score = response.data.stats.score
        }
      }
    } catch (err) {
      console.error('Error voting relationship:', err)
      // Optionally show error to user
    }
  }

  function formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return t('common.time.minutes_ago', diffMins)
    } else if (diffHours < 24) {
      return t('common.time.hours_ago', diffHours)
    } else if (diffDays < 7) {
      return t('common.time.days_ago', diffDays)
    } else {
      return d.toLocaleDateString(locale.value, { timeZone: timezone })
    }
  }

  async function loadContinuationChain() {
    if (!props.postId) return

    continuationChainLoading.value = true

    try {
      const response = await $api.posts.getContinuationChain(props.postId)
      const chainData = response.data?.data || response.data
      continuationChain.value = Array.isArray(chainData) ? chainData : []
    } catch (err) {
      console.error('Error loading continuation chain:', err)
      continuationChain.value = []
    } finally {
      continuationChainLoading.value = false
    }
  }

  async function loadRelationships() {
    if (!props.postId) return

    loading.value = true
    error.value = null

    try {
      const response = await $api.posts.getRelationships(props.postId)
      // The API returns {data: {own: [...], external: [...]}}
      const relationshipsData = response.data?.data || response.data

      // Handle new grouped structure
      if (relationshipsData && typeof relationshipsData === 'object' && !Array.isArray(relationshipsData)) {
        // New structure: {own: [...], external: [...]}
        const ownRels = relationshipsData.own || []
        const externalRels = relationshipsData.external || []
        relationships.value = [...ownRels, ...externalRels]
      } else {
        // Old structure or fallback: flat array
        relationships.value = Array.isArray(relationshipsData) ? relationshipsData : []
      }

      // Load continuation chain if there are continuation relationships
      const hasContinuation = relationships.value.some(r => r.type === 'continuation')
      if (hasContinuation) {
        await loadContinuationChain()
      }
    } catch (err) {
      console.error('Error loading relationships:', err)
      error.value = t('posts.relationships.error_loading')
      relationships.value = [] // Ensure it's an array even on error
    } finally {
      loading.value = false
    }
  }

  // Load relationships when modal is opened OR when component is always expanded
  watch(showModal, (newVal) => {
    if (newVal && relationships.value.length === 0) {
      loadRelationships()
    }
  })

  // Load relationships immediately if always expanded
  watch(() => props.alwaysExpanded, (newVal) => {
    if (newVal) {
      loadRelationships()
    }
  }, { immediate: true })

  function handleRelationshipCreated() {
    showCreateForm.value = false
    editingRelationship.value = null
    // Reload relationships to show the new one
    loadRelationships()
  }

  function canEditRelationship(relationship) {
    if (!authStore.isAuthenticated || !authStore.user) return false
    // Check if the current user is the owner (works even if published anonymously)
    return relationship.is_owner === true
  }

  function editRelationship(relationship) {
    editingRelationship.value = relationship
    showCreateForm.value = true
  }

  function openDeleteConfirm(relationship) {
    relationshipToDelete.value = relationship
    showDeleteConfirm.value = true
  }

  function closeDeleteConfirm() {
    showDeleteConfirm.value = false
    relationshipToDelete.value = null
  }

  async function confirmDeleteRelationship() {
    if (!relationshipToDelete.value) return

    try {
      isDeleting.value = true
      await $api.posts.deleteRelationship(props.postId, relationshipToDelete.value.id)
      // Remove from local list
      relationships.value = relationships.value.filter(r => r.id !== relationshipToDelete.value.id)
      closeDeleteConfirm()
    } catch (err) {
      console.error('Error deleting relationship:', err)
      error.value = t('posts.relationships.error_deleting')
    } finally {
      isDeleting.value = false
    }
  }
</script>

<style scoped>
  .rel-modal-header {
    background-color: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border-default);
  }

  .rel-card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .rel-vote-section {
    background-color: var(--color-bg-subtle);
    border-top: 1px solid var(--color-border-default);
  }

  .rel-add-section {
    border-top: 1px solid var(--color-border-default);
  }

  .rel-expanded-container {
    border: 1px solid var(--color-border-default);
  }

  .rel-expanded-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .rel-expanded-add {
    border-top: 1px solid var(--color-border-default);
  }

  .rel-delete-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .rel-delete-item {
    background-color: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
  }

  .rel-cancel-btn {
    background-color: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-text-primary);
  }

  .rel-cancel-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .rel-item-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .rel-notes-bg {
    background-color: var(--color-bg-subtle);
  }

  .rel-notes-border {
    border-color: var(--color-border-strong);
  }

  .rel-action-hover:hover {
    background-color: var(--color-bg-active);
  }

  .rel-vote-badge-border {
    border-left: 1px solid var(--color-border-default);
  }

  .relationship-vote-badge {
    background: linear-gradient(to bottom,
      rgba(var(--color-primary-rgb), 0.08),
      rgba(var(--color-primary-rgb), 0.15)
    );
    border-color: rgba(var(--color-primary-rgb), 0.3) !important;
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb), 0.1);
    transition: all 0.3s ease;
  }

  .relationship-vote-badge:hover {
    box-shadow: 0 4px 6px rgba(var(--color-primary-rgb), 0.2);
    background: linear-gradient(to bottom,
      rgba(var(--color-primary-rgb), 0.12),
      rgba(var(--color-primary-rgb), 0.2)
    );
  }

  .vote-badge-text {
    color: var(--color-primary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .vote-score-number {
    text-shadow: 0 1px 2px rgba(var(--color-primary-rgb), 0.1);
  }

  /* VoteBadge static style (for post votes, non-interactive) - More subtle version */
  .vote-badge-static {
    background-color: transparent;
    color: rgb(107, 114, 128); /* gray-500 */
    border: 1px solid rgb(229, 231, 235); /* gray-200 */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  :deep(.dark) .vote-badge-static {
    color: rgb(156, 163, 175); /* gray-400 */
    border-color: rgb(75, 85, 99); /* gray-600 */
  }

  .vote-badge-text-static {
    color: rgb(107, 114, 128); /* gray-500 */
    font-weight: 600;
  }

  :deep(.dark) .vote-badge-text-static {
    color: rgb(156, 163, 175); /* gray-400 */
  }

  .vote-arrow-btn {
    padding: 0.375rem 0.5rem;
    border-radius: 0.375rem;
    color: var(--color-text-muted);
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .vote-arrow-btn:hover {
    background-color: rgba(var(--color-primary-rgb), 0.15);
    color: var(--color-primary);
    border-color: rgba(var(--color-primary-rgb), 0.4);
    transform: translateY(-1px);
  }

  .vote-arrow-btn.active {
    color: var(--color-btn-primary-text);
    background: linear-gradient(to bottom, var(--color-primary-light), var(--color-primary-dark));
    border-color: var(--color-primary);
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb), 0.3);
  }

  .vote-arrow-btn.active-down {
    color: var(--color-btn-primary-text);
    background: linear-gradient(to bottom, var(--color-danger-light), var(--color-danger));
    border-color: var(--color-danger);
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
  }

  /* Dark mode adjustments */
  :global(.dark) .vote-arrow-btn {
    background: rgba(0, 0, 0, 0.2);
  }

  :global(.dark) .vote-arrow-btn:hover {
    background-color: rgba(var(--color-primary-rgb), 0.2);
  }
</style>
