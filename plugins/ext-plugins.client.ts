/**
 * External Plugins Loader
 *
 * This plugin dynamically loads plugins from the plugins-ext/ directory.
 * Plugins in that directory are gitignored and can contain private functionality.
 *
 * Each plugin should have an index.ts/js file that exports:
 * - id: string - Unique plugin identifier
 * - name: string - Human readable name
 * - version: string - Plugin version
 * - setup: (nuxtApp) => void | Promise<void> - Setup function
 */

import { defineNuxtPlugin } from '#app'

export interface ExtPlugin {
  id: string
  name: string
  version: string
  description?: string
  setup: (nuxtApp: any) => void | Promise<void>
}

export interface PluginRegistry {
  plugins: Map<string, ExtPlugin>
  isLoaded: (id: string) => boolean
  get: (id: string) => ExtPlugin | undefined
  all: () => ExtPlugin[]
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const plugins = new Map<string, ExtPlugin>()

  // In production/build, plugins would need to be pre-bundled
  // This loader works for development with dynamic imports
  // For production, plugins should be listed in a manifest

  // Try to load plugin manifest if exists
  try {
    // @ts-ignore - dynamic import of optional manifest
    const manifest = await import('../plugins-ext/manifest.json').catch(() => null)

    if (manifest?.plugins) {
      for (const pluginId of manifest.plugins) {
        try {
          // @ts-ignore - dynamic import
          const pluginModule = await import(`../plugins-ext/${pluginId}/index.ts`).catch(() =>
            // @ts-ignore - try js extension
            import(`../plugins-ext/${pluginId}/index.js`)
          )

          const plugin: ExtPlugin = pluginModule.default || pluginModule

          if (plugin.id && plugin.setup) {
            plugins.set(plugin.id, plugin)

            // Execute plugin setup
            await plugin.setup(nuxtApp)

          }
        } catch (err) {
          console.warn(`[Plugins] Failed to load plugin: ${pluginId}`, err)
        }
      }
    }
  } catch {
    // No manifest or plugins directory - that's fine
  }

  const registry: PluginRegistry = {
    plugins,
    isLoaded: (id: string) => plugins.has(id),
    get: (id: string) => plugins.get(id),
    all: () => Array.from(plugins.values()),
  }

  return {
    provide: {
      extPlugins: registry,
    },
  }
})
