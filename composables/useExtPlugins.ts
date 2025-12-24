/**
 * Composable to access external plugins registry.
 *
 * Usage:
 * ```ts
 * const { isLoaded, get, all } = useExtPlugins()
 *
 * if (isLoaded('my-plugin')) {
 *   const plugin = get('my-plugin')
 *   // Use plugin...
 * }
 * ```
 */

import type { PluginRegistry, ExtPlugin } from '~/plugins/ext-plugins.client'

export function useExtPlugins() {
  const nuxtApp = useNuxtApp()

  // Get the plugin registry (may not exist if no plugins loaded)
  const registry = nuxtApp.$extPlugins as PluginRegistry | undefined

  return {
    /**
     * Check if a plugin is loaded
     */
    isLoaded: (id: string): boolean => {
      return registry?.isLoaded(id) ?? false
    },

    /**
     * Get a plugin by ID
     */
    get: (id: string): ExtPlugin | undefined => {
      return registry?.get(id)
    },

    /**
     * Get all loaded plugins
     */
    all: (): ExtPlugin[] => {
      return registry?.all() ?? []
    },

    /**
     * Check if plugin system is available
     */
    isAvailable: (): boolean => {
      return !!registry
    },
  }
}
