<template>
  <div>
    <div class="flex items-center justify-between">
      <div
        v-for="(step, index) in visibleSteps"
        :key="step"
        class="flex items-center"
        :class="{ 'flex-1': index < visibleSteps.length - 1 }"
      >
        <button
          class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200"
          :class="getStepClasses(step)"
          :disabled="!isStepAccessible(step)"
          :title="getStepTitle(step)"
          :aria-label="getStepTitle(step)"
          @click="$emit('step-click', step)"
        >
          <Icon v-if="step.completed" name="fa6-solid:check" class="text-sm" aria-hidden="true" />
          <span v-else class="text-sm font-medium" aria-hidden="true">
            {{ index + 1 }}
          </span>
        </button>

        <div
          v-if="index < visibleSteps.length - 1"
          class="flex-1 h-0.5 mx-4"
          :class="getConnectorClasses(step, visibleSteps[index + 1])"
        />
      </div>
    </div>

    <div class="mt-4 text-center">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ getStepTitle(currentStep) }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {{ getStepDescription(currentStep) }}
      </p>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useOnboarding } from '@/composables/useOnboarding'

  const props = defineProps({
    steps: {
      type: Array,
      required: true,
    },
    currentStep: {
      type: String,
      required: true,
    },
    completedSteps: {
      type: Array,
      default: () => [],
    },
  })

  defineEmits(['step-click'])

  const { isStepCompleted, isStepAccessible, getStepTitle, getStepDescription } = useOnboarding()

  const visibleSteps = computed(() => {
    return props.steps.filter((step) => step !== 'completed')
  })

  function getStepClasses(step) {
    if (isStepCompleted(step)) {
      return 'bg-green-500 border-green-500 text-white hover:bg-green-600'
    } else if (step === props.currentStep) {
      return 'bg-primary border-primary text-white'
    } else if (isStepAccessible(step)) {
      return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary'
    } else {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
    }
  }

  function getConnectorClasses(currentStep, nextStep) {
    const currentCompleted = isStepCompleted(currentStep)
    const nextCompleted = isStepCompleted(nextStep)

    if (currentCompleted && nextCompleted) {
      return 'bg-green-500'
    } else if (currentCompleted || currentStep === props.currentStep) {
      return 'bg-gradient-to-r from-green-500 to-gray-300 dark:to-gray-600'
    } else {
      return 'bg-gray-300 dark:bg-gray-600'
    }
  }
</script>
