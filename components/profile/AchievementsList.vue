<template>
  <div class="achievements-container">
    <div class="achievements-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.id"
        class="achievement-card"
        :class="{ active: activeAchievement === achievement.id }"
        @click="toggleDetails(achievement.id)"
      >
        <div class="achievement-wrapper hexagon-variant">
          <div class="hexagon-shape" :style="getAchievementStyle(achievement)">
            <Icon :name="getAchievementIcon(achievement)" aria-hidden="true" />
          </div>
        </div>

        <div class="achievement-name" :style="getAchievementNameStyle(achievement)">
          {{ getTranslatedText(achievement.name) }}
        </div>

        <div v-if="activeAchievement === achievement.id" class="achievement-expanded">
          <div class="achievement-description">
            {{ getTranslatedText(achievement.description) }}
          </div>
          <div class="achievement-type">{{ achievement.type }}</div>
          <div v-if="!isUnlocked(achievement)" class="achievement-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: `${getProgress(achievement)}%`,
                  backgroundColor: getAchievementColor(achievement),
                }"
              />
            </div>
            <div class="progress-text" :style="{ color: getAchievementColor(achievement) }">
              {{ getProgress(achievement) }}%
            </div>
          </div>
          <div
            v-if="isUnlocked(achievement) && achievement.karma_bonus > 0"
            class="karma-bonus"
            :style="{ color: getAchievementColor(achievement) }"
          >
            +{{ achievement.karma_bonus }} {{ $t('common.points') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from '#i18n'
  import { ref } from 'vue'

  const { t } = useI18n()
  const activeAchievement = ref(null)

  const props = defineProps({
    achievements: {
      type: Array,
      default: () => [],
    },
    userAchievements: {
      type: Array,
      default: () => [],
    },
  })

  function toggleDetails(id) {
    activeAchievement.value = activeAchievement.value === id ? null : id
  }

  const achievementStyles = [
    {
      color: '#f59e0b',
      bgColor: '#FEF3C7',
      icon: 'fa6-solid:graduation-cap',
    },
    {
      color: '#8b5cf6',
      bgColor: '#EDE9FE',
      icon: 'fa6-solid:brain',
    },
    {
      color: '#3b82f6',
      bgColor: '#DBEAFE',
      icon: 'fa6-solid:book',
    },
    {
      color: '#10b981',
      bgColor: '#D1FAE5',
      icon: 'fa6-solid:face-laugh',
    },
    {
      color: '#f97316',
      bgColor: '#FFEDD5',
      icon: 'fa6-solid:scissors',
    },
    {
      color: '#6b7280',
      bgColor: '#F3F4F6',
      icon: 'fa6-solid:ban',
    },
    {
      color: '#ef4444',
      bgColor: '#FEE2E2',
      icon: 'fa6-solid:circle-xmark',
    },
    {
      color: '#ec4899',
      bgColor: '#FCE7F3',
      icon: 'fa6-solid:arrow-up-right-from-square',
    },
  ]

  function getAchievementColor(achievement) {
    const index = (achievement.id || 0) % achievementStyles.length
    return achievementStyles[index].color
  }

  function getAchievementBgColor(achievement) {
    const index = (achievement.id || 0) % achievementStyles.length
    return achievementStyles[index].bgColor
  }

  function getAchievementStyle(achievement) {
    const color = getAchievementColor(achievement)
    const bgColor = getAchievementBgColor(achievement)

    return {
      color: color,
      backgroundColor: bgColor,
      borderColor: color,
    }
  }

  function getAchievementNameStyle(achievement) {
    return {
      color: getAchievementColor(achievement),
    }
  }

  function getAchievementIcon(achievement) {
    // If the achievement has icon_iconify from backend, use it
    if (achievement.icon_iconify) {
      return achievement.icon_iconify
    }

    // If the achievement has an icon in iconify format (contains colon), use it
    if (achievement.icon && achievement.icon.includes(':')) {
      return achievement.icon
    }

    // Convert FA5 icon names to FA6 Iconify format
    if (achievement.icon) {
      const iconName = achievement.icon.replace(/^(fas?|far|fal|fab)\s+fa-/, '')
      const fa6IconMap = {
        'code-branch': 'code-branch',
        laugh: 'face-laugh',
        smile: 'face-smile',
        cut: 'scissors',
        'times-circle': 'circle-xmark',
        'external-link-alt': 'arrow-up-right-from-square',
        'user-circle': 'circle-user',
        'ellipsis-h': 'ellipsis',
        'shield-alt': 'shield-halved',
        'comment-alt': 'message',
        'fire-alt': 'fire-flame-curved',
        'share-alt': 'share-nodes',
        'pencil-alt': 'pen-to-square',
        edit: 'pen-to-square',
        'file-alt': 'file-lines',
        'vote-yea': 'check-to-slot',
        poll: 'square-poll-vertical',
        'check-to-slot': 'check-to-slot',
      }

      const fa6Name = fa6IconMap[iconName] || iconName
      const style = achievement.icon.startsWith('far ') ? 'regular' : 'solid'
      return `fa6-${style}:${fa6Name}`
    }

    // Use default icon from achievementStyles
    const index = (achievement.id || 0) % achievementStyles.length
    return achievementStyles[index].icon
  }

  function isUnlocked(achievement) {
    return getUserAchievement(achievement)?.unlocked_at !== null
  }

  function getProgress(achievement) {
    return getUserAchievement(achievement)?.progress || 0
  }

  function getUserAchievement(achievement) {
    return props.userAchievements.find((ua) => ua.achievement_id === achievement.id)
  }

  function getTranslatedText(text) {
    if (!text) return ''

    // If the text looks like a translation key (contains dots like "achievements.welcome"),
    // try to translate it. Otherwise, return as is (already localized from backend)
    if (text.includes('.')) {
      const translated = t(text)
      // If translation returns the same key, it means it wasn't found, so return original
      return translated === text ? text : translated
    }

    // Text doesn't look like a key, return as is
    return text
  }
</script>

<style scoped>
  .achievements-container {
    width: 100%;
    margin-top: 1rem;
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
  }

  .achievement-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    padding: 0.75rem 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    position: relative;
  }

  .achievement-wrapper {
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hexagon-variant .hexagon-shape {
    width: 65px;
    height: 58px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    transition: transform 0.2s ease;
    border: none;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .hexagon-variant:hover .hexagon-shape {
    transform: rotate(10deg);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  }

  .hexagon-shape :deep(i),
  .hexagon-shape :deep(svg),
  .hexagon-shape :deep(.iconify) {
    font-size: 1.75rem !important;
    width: 1.75rem !important;
    height: 1.75rem !important;
    z-index: 2;
  }

  .achievement-name {
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.25rem;
    line-height: 1.2;
    max-width: 100%;
  }

  .achievement-expanded {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border-default);
    width: 100%;
  }

  .achievement-description {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }

  .achievement-type {
    font-size: 0.7rem;
    font-style: italic;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
    text-transform: capitalize;
  }

  .achievement-progress {
    width: 100%;
    margin-top: 0.5rem;
  }

  .progress-bar {
    height: 5px;
    background-color: var(--color-bg-elevated);
    border-radius: 2.5px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  .progress-fill {
    height: 100%;
  }

  .progress-text {
    font-size: 0.65rem;
    text-align: right;
    font-weight: 600;
  }

  .karma-bonus {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .achievement-card.active {
    background-color: var(--color-bg-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 640px) {
    .achievements-grid {
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 0.75rem;
    }

    .hexagon-variant .hexagon-shape {
      width: 55px;
      height: 50px;
    }

    .hexagon-shape :deep(i),
    .hexagon-shape :deep(svg),
    .hexagon-shape :deep(.iconify) {
      font-size: 1.5rem !important;
      width: 1.5rem !important;
      height: 1.5rem !important;
    }
  }

  @media (max-width: 480px) {
    .achievements-grid {
      grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
      gap: 0.5rem;
    }

    .hexagon-variant .hexagon-shape {
      width: 50px;
      height: 45px;
    }

    .hexagon-shape :deep(i),
    .hexagon-shape :deep(svg),
    .hexagon-shape :deep(.iconify) {
      font-size: 1.35rem !important;
      width: 1.35rem !important;
      height: 1.35rem !important;
    }

    .achievement-name {
      font-size: 0.7rem;
    }
  }
</style>
