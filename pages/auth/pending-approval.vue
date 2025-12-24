<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-center">
      <div class="w-full max-w-md">
        <div
          class="card-bg rounded-lg shadow-sm border auth-border"
        >
          <div
            class="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-300 dark:border-blue-800 rounded-t-lg"
          >
            <h2 class="text-lg font-medium text-blue-700 dark:text-blue-300">
              <Icon name="fa6-solid:clock" class="mr-2" aria-hidden="true" />
              Account Pending Approval
            </h2>
          </div>

          <div class="p-6">
            <div
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-4 rounded-md mb-6"
            >
              <div class="flex items-start">
                <Icon name="fa6-solid:circle-info" class="mr-3 mt-0.5 text-xl" aria-hidden="true" />
                <div class="flex-1">
                  <p class="font-medium mb-2">Your registration was successful!</p>
                  <p class="text-sm">
                    Your account has been created and is currently pending administrator approval.
                    You will receive an email notification once your account has been reviewed.
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-4 text-sm text-text-muted dark:text-text-dark-muted">
              <p>
                <Icon name="fa6-solid:circle-check" class="text-green-500 mr-2" aria-hidden="true" />
                <strong>Account Created:</strong> Your information has been securely saved.
              </p>
              <p>
                <Icon name="fa6-solid:hourglass-half" class="text-yellow-500 mr-2" aria-hidden="true" />
                <strong>Awaiting Review:</strong> An administrator will review your registration
                shortly.
              </p>
              <p>
                <Icon name="fa6-solid:envelope" class="text-blue-500 mr-2" aria-hidden="true" />
                <strong>Email Notification:</strong> You'll be notified once your account is
                approved.
              </p>
            </div>

            <div class="mt-6 pt-6 border-t auth-border">
              <p class="text-sm text-center text-text-muted dark:text-text-dark-muted mb-4">
                This typically takes 24-48 hours. Thank you for your patience!
              </p>

              <NuxtLink
                :to="localePath('/auth/login')"
                class="block w-full text-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
              >
                <Icon name="fa6-solid:arrow-left" class="mr-2" aria-hidden="true" />
                Back to Login
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useLocalePath } from '#i18n'
  const localePath = useLocalePath()
</script>

<style scoped>
  .auth-border {
    border-color: var(--color-border-default);
  }
</style>
