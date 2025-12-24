<template>
  <BasePostCard
    v-bind="$attrs"
    :post="post"
    :show-placeholder="showPlaceholder"
    :show-full-text="showFullText"
    :hide-comments="hideComments"
    :layout="layout"
    @vote="vote"
  >
    <template #below-vote>
      <slot name="below-vote"/>
    </template>

    <template #content>
      <NSFWContentWarning :post="post" :show-full-text="showFullText">
        <template #default>
          <component
            :is="contentComponent"
            :content="post.content || post.body || ''"
            :excerpt="post.excerpt || ''"
            :title="post.title"
            :url="post.url"
            :thumbnail-url="post.thumbnail_url"
            :show-full-text="showFullText"
            :no-embed-message="getNoEmbedMessage()"
            :post="post"
            :layout="layout"
            @expand="openPostDetail"
            @title-click="handleTitleClick"
          />
        </template>
      </NSFWContentWarning>
    </template>

    <template #cta>
      <slot name="cta"/>
    </template>

    <template #footer>
      <CardFooter
        :post-id="post.id || post.entryId"
        :post-slug="post.slug"
        :post-uuid="post.uuid"
        :user-id="post.user_id || post.author_id"
        :created-at="post.created_at"
        :published-at="post.published_at"
        :frontpage-at="post.frontpage_at"
        :comments-count="post.numComments || 0"
        :views="post.views"
        :total-views="post.total_views || 0"
        :impressions="post.impressions || 0"
        :reports-count="post.reports_count || 0"
        :reports="post.reports || []"
        :source-name="post.source_name"
        :source-url="post.source_url"
        :is-external-import="post.is_external_import"
        :hide-comments="hideComments"
        :is-visited="post.is_visited || false"
        :new-comments-count="post.new_comments_count || 0"
        :sub="post.sub"
        :recommended-seals-count="post.recommended_seals_count || 0"
        :advise-against-seals-count="post.advise_against_seals_count || 0"
        :user-has-recommended="post.user_has_recommended || false"
        :user-has-advise-against="post.user_has_advise_against || false"
        :is-own-post="post.can_edit || false"
        :federation="post.federation || { likes_count: 0, shares_count: 0, replies_count: 0, has_engagement: false }"
        @seals-updated="handleSealsUpdated"
      >
        <template #actions>
          <PostRelationshipsButton
            :post-id="post.id || post.entryId"
            :relationships-count="post.relationships_count || 0"
            :post-title="post.title"
            :post-author-id="post.user_id || post.author_id"
          />
          <PostActionsItem
            :post-id="post.id || post.entryId"
            :show-labels="false"
            @favorite-toggled="onFavoriteToggled"
            @read-later-toggled="onReadLaterToggled"
            @saved-to-list="onSavedToList"
          />
          <EditPostModal
            :post="post"
            @post-updated="onPostUpdated"
          />
        </template>
      </CardFooter>
    </template>
  </BasePostCard>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePostsStore } from '~/stores/posts'
  import { useLocalePath, useI18n  } from '#i18n'

  import { useNotification } from '~/composables/useNotification'
  import BasePostCard from '~/components/posts/postCard/BasePostCard.vue'
  import NSFWContentWarning from '~/components/posts/NSFWContentWarning.vue'
  import TextContent from '~/components/posts/postCard/TextContent.vue'
  import LinkContent from '~/components/posts/postCard/LinkContent.vue'
  import VideoContent from '~/components/posts/postCard/VideoContent.vue'
  import AudioContent from '~/components/posts/postCard/AudioContent.vue'
  import PollContent from '~/components/posts/postCard/PollContent.vue'
  import ImageContent from '~/components/posts/postCard/ImageContent.vue'
  import CardFooter from '~/components/posts/postCard/CardFooter.vue'
  import PostActionsItem from '~/components/posts/PostActionsItem.vue'
  import EditPostModal from '~/components/posts/EditPostModal.vue'
  import PostRelationshipsButton from '~/components/posts/PostRelationshipsButton.vue'

  defineOptions({
    inheritAttrs: false
  })

  const props = defineProps({
    post: {
      type: Object,
      required: true,
    },
    showPlaceholder: {
      type: Boolean,
      default: true,
    },
    showFullText: {
      type: Boolean,
      default: false,
    },
    hideComments: {
      type: Boolean,
      default: false,
    },
    layout: {
      type: String,
      default: 'card',
      validator: (value) => ['list', 'compact', 'card'].includes(value),
    },
  })

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const postsStore = usePostsStore()
  const { success } = useNotification()

  const contentComponent = computed(() => {
    const contentType = props.post.content_type

    if (contentType === 'text') {
      return TextContent
    } else if (contentType === 'video') {
      return VideoContent
    } else if (contentType === 'audio') {
      return AudioContent
    } else if (contentType === 'poll') {
      return PollContent
    } else if (contentType === 'image') {
      return ImageContent
    } else {
      return LinkContent
    }
  })

  function openPostDetail() {
    router.push(localePath(`/posts/${props.post.slug || props.post.id || props.post.entryId}`))
  }

  function getNoEmbedMessage() {
    if (props.post.content_type === 'video') {
      return t('posts.view_video')
    } else if (props.post.content_type === 'audio') {
      return t('posts.listen_audio')
    }
    return ''
  }

  function onFavoriteToggled() {
  }

  function onReadLaterToggled() {
    // Read later toggled
  }

  function onSavedToList() {
    // Saved to list
  }

  async function vote(value) {
    try {
      await postsStore.votePost(props.post.id || props.post.entryId, value)
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  async function handleTitleClick() {
    // View registration removed - it will be handled by the post detail page
    // to avoid duplicate view counting
  }

  function handleSealsUpdated(counts) {
    // Update the post's seal counts in the store or local state
    if (props.post) {
      props.post.recommended_seals_count = counts.recommended
      props.post.advise_against_seals_count = counts.advise_against
    }
  }

  // Edit functions
  function onPostUpdated(updatedPost) {
    // Update the post in local props
    Object.assign(props.post, updatedPost)
    success(t('posts.post_updated'))
  }
</script>
