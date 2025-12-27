import { useLazyComponents, lazyComponents } from '~/composables/useLazyComponents'

export default defineNuxtPlugin(() => {
  const { preloadComponents } = useLazyComponents()

  // Preload critical components that are likely to be used
  const criticalComponents = [
    { name: 'PostFormWizard', loader: lazyComponents.PostFormWizard },
    { name: 'CommentEditor', loader: lazyComponents.CommentEditor },
    { name: 'CommentsList', loader: lazyComponents.CommentsList },
    { name: 'MarkdownEditor', loader: lazyComponents.MarkdownEditor },
  ]

  // Preload non-critical components that are commonly used
  const nonCriticalComponents = [
    { name: 'TagSelector', loader: lazyComponents.TagSelector },
    { name: 'AudioPlayer', loader: lazyComponents.AudioPlayer },
    { name: 'VideoPlayer', loader: lazyComponents.VideoPlayer },
    { name: 'PostRelationshipsButton', loader: lazyComponents.PostRelationshipsButton },
    { name: 'PostRelationships', loader: lazyComponents.PostRelationships },
    { name: 'AchievementsList', loader: lazyComponents.AchievementsList },
  ]

  // Sidebar components - deferred more (desktop only, not critical for mobile)
  const sidebarComponents = [{ name: 'SidebarStats', loader: lazyComponents.SidebarStats }]

  // Modal components - NOT preloaded, only loaded on-demand when opened
  // SearchModal, AudioPlatformsModal, NotificationModal, AddRelationshipModal
  // PostForm, PlatformStats - Page-specific, loaded when navigating to those pages

  // Preload critical components immediately after initial load
  if (import.meta.client) {
    nextTick(() => {
      preloadComponents(criticalComponents)
    })

    // Preload non-critical components with delay
    setTimeout(() => {
      preloadComponents(nonCriticalComponents)
    }, 2000)

    // Preload sidebar components with more delay (desktop only)
    setTimeout(() => {
      preloadComponents(sidebarComponents)
    }, 3500)
  }
})
