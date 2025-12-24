<template>
  <div class="logo-container">
    <div class="logo-wrapper">
      <NuxtImg
        src="/logo-wolf.png"
        :alt="siteName"
        class="logo-image"
        width="36"
        height="36"
        format="webp"
        quality="80"
        loading="eager"
        :placeholder="[36, 36, 10]"
      />
    </div>
    <span class="logo-text">{{ siteName }}</span>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const siteName = config.public.appName || 'Repostea'
</script>

<style scoped>
  .logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  /* En temas oscuros: fondo más claro para contraste */
  .dark .logo-wrapper {
    background-color: var(--color-bg-elevated);
  }

  .logo-image {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  .logo-text {
    font-size: 1.25rem;
    font-weight: 900;
    letter-spacing: -0.025em;
    color: var(--color-navbar-text);
    text-transform: uppercase;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  /* En móviles muy estrechos, reducir tamaño del texto */
  @media (max-width: 380px) {
    .logo-container {
      gap: 8px;
    }

    .logo-wrapper {
      width: 36px;
      height: 36px;
    }

    .logo-image {
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 1rem;
    }
  }

  /* En móviles extremadamente estrechos, ocultar el texto */
  @media (max-width: 320px) {
    .logo-text {
      display: none;
    }
  }
</style>
