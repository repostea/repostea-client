<template>
  <div class="mini-achievements-container">
    <div class="achievements-wrapper">
      <div
        v-for="achievement in props.achievements"
        :key="achievement.id"
        class="mini-achievement"
        :class="{ active: activeAchievement === achievement.id }"
        @click="toggleDetails(achievement.id)"
      >
        <div class="mini-hexagon-shape" :style="getAchievementStyle(achievement)">
          <Icon :name="getAchievementIconIconify(achievement)" aria-hidden="true" />
        </div>
      </div>
    </div>

    <!-- Nombre del logro actualmente seleccionado -->
    <div
      v-if="activeAchievement !== null"
      class="selected-achievement-name"
      :style="getSelectedNameStyle()"
    >
      {{ getSelectedAchievementName() }}
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

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
    username: {
      type: String,
      required: true,
    },
  })

  function toggleDetails(id) {
    activeAchievement.value = activeAchievement.value === id ? null : id
  }

  function getSelectedAchievementName() {
    const achievement = props.achievements.find((a) => a.id === activeAchievement.value)
    return achievement ? achievement.name : ''
  }

  function getSelectedNameStyle() {
    const achievement = props.achievements.find((a) => a.id === activeAchievement.value)
    if (!achievement) return {}

    return {
      color: getAchievementColor(achievement),
    }
  }

  const achievementStyles = [
    {
      color: '#f59e0b',
      bgColor: '#FEF3C7',
      iconify: 'fa6-solid:graduation-cap', // Education, first steps
    },
    {
      color: '#8b5cf6',
      bgColor: '#EDE9FE',
      iconify: 'fa6-solid:brain', // Intelligence, strategy
    },
    {
      color: '#3b82f6',
      bgColor: '#DBEAFE',
      iconify: 'fa6-solid:book', // Knowledge, content
    },
    {
      color: '#10b981',
      bgColor: '#D1FAE5',
      iconify: 'fa6-solid:face-smile', // Social achievements, community
    },
    {
      color: '#f97316',
      bgColor: '#FFEDD5',
      iconify: 'fa6-solid:fire', // Streak, consistent activity
    },
    {
      color: '#6b7280',
      bgColor: '#F3F4F6',
      iconify: 'fa6-solid:shield-halved', // Moderation, collaboration
    },
    {
      color: '#ef4444',
      bgColor: '#FEE2E2',
      iconify: 'fa6-solid:heart', // Popularity, likes
    },
    {
      color: '#ec4899',
      bgColor: '#FCE7F3',
      iconify: 'fa6-solid:star', // Logros destacados, especiales
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


  function getAchievementIconIconify(achievement) {
    // If the achievement has icon_iconify from backend, use it
    if (achievement.icon_iconify) {
      return achievement.icon_iconify
    }

    // If the achievement has an icon in iconify format (legacy), use it
    if (achievement.icon && achievement.icon.includes(':')) {
      return achievement.icon
    }

    // Convert FA5 icon names to FA6 Iconify format
    if (achievement.icon) {
      const iconName = achievement.icon.replace(/^(fas?|far|fal|fab)\s+fa-/, '')
      const fa6IconMap = {
        'code-branch': 'code-branch',
        'laugh': 'face-smile',
        'smile': 'face-smile',
        'cut': 'scissors',
        'times-circle': 'circle-xmark',
        'external-link-alt': 'arrow-up-right-from-square',
        'user-circle': 'circle-user',
        'ellipsis-h': 'ellipsis',
        'shield-alt': 'shield-halved',
        'comment-alt': 'message',
        'fire-alt': 'fire-flame-curved',
        'share-alt': 'share-nodes',
        'pencil-alt': 'pen-to-square',
        'edit': 'pen-to-square',
        'file-alt': 'file-lines',
        'vote-yea': 'check-to-slot',
        'poll': 'square-poll-vertical',
        'check-to-slot': 'check-to-slot',
      }

      const fa6Name = fa6IconMap[iconName] || iconName
      const style = achievement.icon.startsWith('far ') ? 'regular' : 'solid'
      return `fa6-${style}:${fa6Name}`
    }

    // Otherwise, use the fallback styles
    const index = (achievement.id || 0) % achievementStyles.length
    return achievementStyles[index].iconify
  }

</script>

<style scoped>
  .mini-achievements-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 0.75rem;
  }

  .achievements-wrapper {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
  }

  .mini-achievement {
    position: relative;
    cursor: pointer;
  }

  .mini-hexagon-shape {
    width: 24px;
    height: 22px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    transition: transform 0.2s ease;
    border: none;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .mini-achievement:hover .mini-hexagon-shape {
    transform: scale(1.15);
  }

  .mini-hexagon-shape :deep(i),
  .mini-hexagon-shape :deep(svg),
  .mini-hexagon-shape :deep(.iconify) {
    font-size: 0.625rem !important;
    width: 0.625rem !important;
    height: 0.625rem !important;
    z-index: 2;
  }

  .selected-achievement-name {
    font-size: 0.7rem;
    font-weight: 600;
    margin-top: 0.5rem;
    text-align: center;
  }

  .selected-achievement-name {
    color: var(--color-text-secondary);
  }
</style>
