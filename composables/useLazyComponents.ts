import { ref, readonly, type Ref } from 'vue'

/**
 * Composable for lazy loading heavy components
 * Improves initial page load performance by deferring component loading
 */
export const useLazyComponents = () => {
  const loadedComponents: Ref<Set<string>> = ref(new Set())
  const loadingComponents: Ref<Set<string>> = ref(new Set())

  /**
   * Lazy load a component with optional delay
   */
  const loadComponent = async (componentName: string, loader: () => Promise<any>, delay = 0) => {
    // If already loaded, return immediately
    if (loadedComponents.value.has(componentName)) {
      return true
    }

    // If already loading, wait for it
    if (loadingComponents.value.has(componentName)) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (loadedComponents.value.has(componentName)) {
            resolve(true)
          } else {
            setTimeout(checkLoaded, 10)
          }
        }
        checkLoaded()
      })
    }

    loadingComponents.value.add(componentName)

    try {
      // Add delay if specified (useful for non-critical components)
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      await loader()
      loadedComponents.value.add(componentName)
      loadingComponents.value.delete(componentName)
      return true
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error)
      loadingComponents.value.delete(componentName)
      return false
    }
  }

  /**
   * Preload components that will likely be needed
   */
  const preloadComponents = async (
    components: Array<{ name: string; loader: () => Promise<any> }>
  ) => {
    // Use requestIdleCallback if available for non-critical preloading
    const preload = () => {
      components.forEach(({ name, loader }) => {
        loadComponent(name, loader, 100) // Small delay for preloading
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload)
    } else {
      setTimeout(preload, 1000)
    }
  }

  /**
   * Check if a component is loaded
   */
  const isComponentLoaded = (componentName: string) => {
    return loadedComponents.value.has(componentName)
  }

  /**
   * Check if a component is currently loading
   */
  const isComponentLoading = (componentName: string) => {
    return loadingComponents.value.has(componentName)
  }

  return {
    loadComponent,
    preloadComponents,
    isComponentLoaded,
    isComponentLoading,
    loadedComponents: readonly(loadedComponents),
    loadingComponents: readonly(loadingComponents),
  }
}

/**
 * Predefined lazy loaders for common heavy components
 */
export const lazyComponents = {
  // Form components
  PostFormWizard: () => import('~/components/posts/PostFormWizard.vue'),
  MarkdownEditor: () => import('~/components/posts/MarkdownEditor.vue'),
  TagSelector: () => import('~/components/posts/TagSelector.vue'),
  CommentEditor: () => import('~/components/comments/CommentEditor.vue'),

  // Comments components
  CommentsList: () => import('~/components/comments/CommentsList.vue'),

  // Media components
  AudioPlayer: () => import('~/components/media/AudioPlayer.vue'),
  VideoPlayer: () => import('~/components/media/VideoPlayer.vue'),

  // Modal components
  AddRelationshipModal: () => import('~/components/posts/AddRelationshipModal.vue'),
  PostRelationshipsButton: () => import('~/components/posts/PostRelationshipsButton.vue'),
  SearchModal: () => import('~/components/posts/SearchModal.vue'),
  AudioPlatformsModal: () => import('~/components/help/AudioPlatformsModal.vue'),
  NotificationModal: () => import('~/components/notifications/NotificationModal.vue'),

  // Page-specific components
  PostForm: () => import('~/components/posts/PostForm.vue'),
  PostRelationships: () => import('~/components/posts/PostRelationships.vue'),
  AchievementsList: () => import('~/components/profile/AchievementsList.vue'),

  // Stats components
  PlatformStats: () => import('~/components/stats/PlatformStats.vue'),

  // Sidebar components (desktop only, can be deferred)
  SidebarStats: () => import('~/components/posts/SidebarStats.vue'),
}

/**
 * Intersection Observer based lazy loading for components
 */
export const useLazyComponentObserver = () => {
  const observer = ref<IntersectionObserver | null>(null)
  const { loadComponent } = useLazyComponents()

  const observeComponent = (
    element: HTMLElement,
    componentName: string,
    loader: () => Promise<any>
  ) => {
    if (!observer.value) {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement
              const name = target.dataset.componentName
              const loaderFn = target.dataset.loader

              if (name && loaderFn) {
                loadComponent(name, loader)
                observer.value?.unobserve(target)
              }
            }
          })
        },
        {
          rootMargin: '50px', // Load slightly before component comes into view
          threshold: 0.1,
        }
      )
    }

    element.dataset.componentName = componentName
    observer.value.observe(element)
  }

  const disconnect = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  return {
    observeComponent,
    disconnect,
  }
}
