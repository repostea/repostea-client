<template>
  <div class="profile-nav-container rounded-lg shadow-sm overflow-visible lg:overflow-hidden mb-6">
    <!-- Mobile: Pills/Chips style with More dropdown -->
    <nav class="flex lg:hidden gap-2 overflow-x-auto px-4 py-3 items-center">
      <NuxtLink
        :to="localePath('/profile')"
        class="px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-colors"
        :class="
          activeTab === 'overview'
            ? 'bg-primary text-white dark:bg-primary-light dark:text-gray-900 hover:text-white dark:hover:text-gray-900'
            : 'profile-nav-pill-inactive text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'
        "
      >
        {{ t('profile.overview') }}
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/edit')"
        class="px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-colors"
        :class="
          activeTab === 'profile'
            ? 'bg-primary text-white dark:bg-primary-light dark:text-gray-900 hover:text-white dark:hover:text-gray-900'
            : 'profile-nav-pill-inactive text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'
        "
      >
        {{ t('profile.my_profile') }}
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/posts')"
        class="px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-colors"
        :class="
          activeTab === 'posts'
            ? 'bg-primary text-white dark:bg-primary-light dark:text-gray-900 hover:text-white dark:hover:text-gray-900'
            : 'profile-nav-pill-inactive text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'
        "
      >
        {{ t('profile.my_posts') }}
      </NuxtLink>

      <!-- More dropdown -->
      <div v-click-outside="closeMoreMenu" class="relative">
        <button
          ref="moreButton"
          class="px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-colors flex items-center gap-1"
          :class="
            ['notifications', 'achievements', 'invitations', 'moderation', 'federation', 'settings'].includes(activeTab)
              ? 'bg-primary text-white dark:bg-primary-light dark:text-gray-900 hover:text-white dark:hover:text-gray-900'
              : 'profile-nav-pill-inactive text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light'
          "
          @click="toggleMoreMenu"
        >
          {{ t('common.more') }}
          <Icon name="fa6-solid:chevron-down" class="text-xs" aria-hidden="true" />
        </button>

        <div
          v-if="isMoreMenuOpen"
          class="profile-nav-dropdown fixed mt-2 py-2 w-48 rounded-md shadow-lg"
          style="z-index: 9999;"
          :style="{ top: dropdownTop + 'px', right: dropdownRight + 'px' }"
        >
          <NuxtLink
            :to="localePath('/profile/notifications')"
            class="flex items-center px-4 py-2 text-sm hover:bg-primary/10"
            :class="
              activeTab === 'notifications'
                ? 'text-primary dark:text-primary-light font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="closeMoreMenu"
          >
            <Icon name="fa6-solid:bell" class="w-5 mr-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {{ t('notifications.notifications') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/achievements')"
            class="flex items-center px-4 py-2 text-sm hover:bg-primary/10"
            :class="
              activeTab === 'achievements'
                ? 'text-primary dark:text-primary-light font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="closeMoreMenu"
          >
            <Icon name="fa6-solid:trophy" class="w-5 mr-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {{ t('achievements.title') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/invitations')"
            class="flex items-center px-4 py-2 text-sm hover:bg-primary/10"
            :class="
              activeTab === 'invitations'
                ? 'text-primary dark:text-primary-light font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="closeMoreMenu"
          >
            <Icon name="fa6-solid:envelope" class="w-5 mr-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {{ t('profile.invitations') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/moderation')"
            class="flex items-center px-4 py-2 text-sm hover:bg-primary/10"
            :class="
              activeTab === 'moderation'
                ? 'text-primary dark:text-primary-light font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="closeMoreMenu"
          >
            <Icon name="fa6-solid:gavel" class="w-5 mr-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {{ t('profile.moderation.title') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/federation')"
            class="flex items-center px-4 py-2 text-sm hover:bg-primary/10"
            :class="
              activeTab === 'federation'
                ? 'text-primary dark:text-primary-light font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="closeMoreMenu"
          >
            <Icon name="fa6-solid:globe" class="w-5 mr-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {{ t('settings.federation.title') }}
          </NuxtLink>

          <NuxtLink
            :to="localePath('/profile/settings')"
            class="flex items-center px-4 py-2 text-sm hover:bg-primary/10"
            :class="
              activeTab === 'settings'
                ? 'text-primary dark:text-primary-light font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="closeMoreMenu"
          >
            <Icon name="fa6-solid:gear" class="w-5 mr-3 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            {{ t('profile.settings') }}
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Desktop: Vertical sidebar style -->
    <nav class="hidden lg:flex flex-col">
      <NuxtLink
        :to="localePath('/profile')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'overview'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:chart-line"
          class="w-5 mr-3"
          :class="
            activeTab === 'overview'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('profile.overview') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/edit')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'profile'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:user"
          class="w-5 mr-3"
          :class="
            activeTab === 'profile'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('profile.my_profile') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/posts')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'posts'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:newspaper"
          class="w-5 mr-3"
          :class="
            activeTab === 'posts'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('profile.my_posts') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/notifications')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'notifications'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:bell"
          class="w-5 mr-3"
          :class="
            activeTab === 'notifications'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('notifications.notifications') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/achievements')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'achievements'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:trophy"
          class="w-5 mr-3"
          :class="
            activeTab === 'achievements'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('achievements.title') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/invitations')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'invitations'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:envelope"
          class="w-5 mr-3"
          :class="
            activeTab === 'invitations'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('profile.invitations') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/moderation')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'moderation'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:gavel"
          class="w-5 mr-3"
          :class="
            activeTab === 'moderation'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('profile.moderation.title') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/federation')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'federation'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:globe"
          class="w-5 mr-3"
          :class="
            activeTab === 'federation'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('settings.federation.title') }}</span>
      </NuxtLink>

      <NuxtLink
        :to="localePath('/profile/settings')"
        class="profile-nav-link flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
        :class="
          activeTab === 'settings'
            ? 'bg-primary/10 text-primary dark:text-primary-light border-l-4 border-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary dark:hover:text-primary-light'
        "
      >
        <Icon
          name="fa6-solid:gear"
          class="w-5 mr-3"
          :class="
            activeTab === 'settings'
              ? 'text-primary dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          "
          aria-hidden="true"
        />
        <span>{{ t('profile.settings') }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n, useLocalePath  } from '#i18n'
  

  defineProps({
    activeTab: {
      type: String,
      required: true,
    },
  })

  const { t } = useI18n()
  const localePath = useLocalePath()

  const isMoreMenuOpen = ref(false)
  const moreButton = ref(null)
  const dropdownTop = ref(0)
  const dropdownRight = ref(0)

  const toggleMoreMenu = () => {
    isMoreMenuOpen.value = !isMoreMenuOpen.value

    if (isMoreMenuOpen.value && moreButton.value) {
      const rect = moreButton.value.getBoundingClientRect()
      dropdownTop.value = rect.bottom + 8
      dropdownRight.value = window.innerWidth - rect.right
    }
  }

  const closeMoreMenu = () => {
    isMoreMenuOpen.value = false
  }

  const vClickOutside = {
    mounted(el, binding) {
      el._clickOutside = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event)
        }
      }
      document.addEventListener('click', el._clickOutside)
    },
    unmounted(el) {
      document.removeEventListener('click', el._clickOutside)
    },
  }
</script>

<style scoped>
  .profile-nav-container {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .profile-nav-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  /* Desktop nav links */
  .profile-nav-link {
    border-bottom: 1px solid var(--color-border-default);
  }

  .profile-nav-link:last-child {
    border-bottom: none;
  }

  .profile-nav-pill-inactive {
    background-color: var(--color-bg-hover);
  }
</style>
