<template>
  <div v-if="isDev" class="min-h-screen">
    <!-- Header -->
    <div class="bg-primary py-6 px-4 mb-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold" style="color: var(--color-btn-primary-text)">
          Component Showcase
        </h1>
        <p class="text-sm opacity-80 mt-1" style="color: var(--color-btn-primary-text)">
          Componentes REALES de la aplicación - Solo visible en desarrollo
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 pb-12">
      <!-- ==================== THEME SELECTOR ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:palette" class="text-primary" aria-hidden="true" /> Selector de Tema
        </h2>
        <div class="card p-6">
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              v-for="theme in themes"
              :key="theme.name"
              class="px-4 py-2 rounded-md border transition-all"
              :class="
                currentTheme === theme.name
                  ? 'bg-primary border-primary'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary'
              "
              :style="currentTheme === theme.name ? { color: 'var(--color-btn-primary-text)' } : {}"
              @click="setTheme(theme.name, theme.dark)"
            >
              {{ theme.label }}
            </button>
          </div>
          <p class="text-sm text-gray-500">Componente real: <code>ThemeSelector</code></p>
        </div>
      </section>

      <!-- ==================== PAGE HEADER ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:heading" class="text-primary" aria-hidden="true" /> Page Header
        </h2>
        <div class="card p-6 space-y-6">
          <PageHeader
            title="Título de página"
            description="Descripción opcional de la página"
            icon="house"
          />
          <PageHeader title="Sin descripción" icon="gear" />
          <PageHeader title="Solo título" />
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Componente: <code>components/ui/PageHeader.vue</code>
        </p>
      </section>

      <!-- ==================== LOGO ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:image" class="text-primary" aria-hidden="true" /> Logo
        </h2>
        <div class="card p-6">
          <div class="flex items-center gap-8">
            <div>
              <p class="text-xs text-gray-500 mb-2">Logo normal</p>
              <Logo />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Logo con nombre</p>
              <Logo :show-name="true" />
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/common/Logo.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== LOADING SPINNER ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:spinner" class="text-primary" aria-hidden="true" /> Loading Spinner
        </h2>
        <div class="card p-6">
          <div class="flex items-center gap-8 flex-wrap">
            <div v-for="size in ['xs', 'sm', 'md', 'lg', 'xl']" :key="size">
              <p class="text-xs text-gray-500 mb-2">{{ size.toUpperCase() }}</p>
              <LoadingSpinner :size="size" />
            </div>
          </div>
          <div class="flex items-center gap-8 mt-6 flex-wrap">
            <div
              v-for="color in ['primary', 'white', 'neutral', 'current']"
              :key="color"
              :class="color === 'white' ? 'bg-gray-800 p-2 rounded' : ''"
            >
              <p class="text-xs text-gray-500 mb-2">{{ color }}</p>
              <LoadingSpinner :color="color" />
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/common/LoadingSpinner.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== TIME AGO ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:clock" class="text-primary" aria-hidden="true" /> Time Ago
        </h2>
        <div class="card p-6">
          <div class="space-y-2">
            <div class="flex items-center gap-4">
              <span class="text-xs text-gray-500 w-24">Ahora:</span>
              <TimeAgo :datetime="new Date()" />
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs text-gray-500 w-24">Hace 5 min:</span>
              <TimeAgo :datetime="fiveMinutesAgo" />
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs text-gray-500 w-24">Hace 2 horas:</span>
              <TimeAgo :datetime="twoHoursAgo" />
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs text-gray-500 w-24">Hace 3 días:</span>
              <TimeAgo :datetime="threeDaysAgo" />
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs text-gray-500 w-24">Hace 2 meses:</span>
              <TimeAgo :datetime="twoMonthsAgo" />
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/ui/TimeAgo.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== AUTHOR INFO ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:user" class="text-primary" aria-hidden="true" /> Author Info
        </h2>
        <div class="card p-6">
          <div class="space-y-4">
            <div>
              <p class="text-xs text-gray-500 mb-2">Usuario normal</p>
              <AuthorInfo :user="mockUser" :created-at="mockDate" :show-time="true" />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Usuario anónimo</p>
              <AuthorInfo
                :user="null"
                :created-at="mockDate"
                :show-time="true"
                :is-anonymous="true"
                author-name="Anónimo"
              />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Admin</p>
              <AuthorInfo :user="mockAdmin" :created-at="mockDate" :show-time="true" />
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/common/AuthorInfo.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== USER INFO CARD ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:id-card" class="text-primary" aria-hidden="true" /> User Info Card
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UserInfoCard :user="mockUserProfile" />
          <UserInfoCard :user="mockAdminProfile" />
        </div>
        <p class="text-sm text-gray-500 mt-2">
          Componente: <code>components/profile/UserInfoCard.vue</code>
        </p>
      </section>

      <!-- ==================== LANGUAGE SELECTOR ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:globe" class="text-primary" aria-hidden="true" /> Language Selector
        </h2>
        <div class="card p-6">
          <LanguageSelector />
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/common/LanguageSelector.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== CONTENT LANGUAGE SELECTOR ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:language" class="text-primary" aria-hidden="true" /> Content
          Language Selector
        </h2>
        <div class="card p-6">
          <ContentLanguageSelector v-model="selectedLanguage" />
          <p class="text-sm text-gray-500 mt-4">
            Seleccionado: <code>{{ selectedLanguage }}</code>
          </p>
          <p class="text-sm text-gray-500">
            Componente: <code>components/common/ContentLanguageSelector.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== LAYOUT SELECTOR ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:table-cells" class="text-primary" aria-hidden="true" /> Layout
          Selector
        </h2>
        <div class="card p-6">
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">Vista de posts:</span>
            <LayoutSelector />
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/posts/LayoutSelector.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== VOTE BADGE ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:square-poll-vertical" class="text-primary" aria-hidden="true" />
          Vote Badge
        </h2>
        <div class="card p-6">
          <div class="flex gap-6 flex-wrap">
            <div>
              <p class="text-xs text-gray-500 mb-2">Sin votar</p>
              <VoteBadge :votes="42" :user-has-voted="false" />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Ya votado</p>
              <VoteBadge :votes="128" :user-has-voted="true" />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Pocos votos</p>
              <VoteBadge :votes="3" :user-has-voted="false" />
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/posts/VoteBadge.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== VOTE CONTROLS ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:arrows-up-down" class="text-primary" aria-hidden="true" /> Vote
          Controls
        </h2>
        <div class="card p-6">
          <div class="flex gap-8 flex-wrap items-start">
            <div>
              <p class="text-xs text-gray-500 mb-2">Sin votar</p>
              <VoteControls :item-id="1" :votes-count="15" :user-vote="null" item-type="comment" />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Voto positivo</p>
              <VoteControls
                :item-id="2"
                :votes-count="23"
                :user-vote="1"
                user-vote-type="interesting"
                item-type="comment"
              />
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Voto negativo</p>
              <VoteControls
                :item-id="3"
                :votes-count="-5"
                :user-vote="-1"
                user-vote-type="irrelevant"
                item-type="comment"
              />
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/comments/VoteControls.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== SEAL CORNER BADGE ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:award" class="text-primary" aria-hidden="true" /> Seal Corner Badge
        </h2>
        <div class="card p-6">
          <div class="flex gap-8 items-center flex-wrap">
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-2">Recomendado (5-2)</p>
              <SealCornerBadge :recommended-count="5" :advise-against-count="2" />
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-2">Desaconsejado (2-8)</p>
              <SealCornerBadge :recommended-count="2" :advise-against-count="8" />
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-2">Muy recomendado (15-1)</p>
              <SealCornerBadge :recommended-count="15" :advise-against-count="1" />
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-2">Empate (no se muestra)</p>
              <SealCornerBadge :recommended-count="3" :advise-against-count="3" />
              <span class="text-xs text-gray-400">(oculto)</span>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/seals/SealCornerBadge.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== POST CARD ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:newspaper" class="text-primary" aria-hidden="true" /> Post Card
        </h2>
        <div class="space-y-4">
          <div>
            <p class="text-xs text-gray-500 mb-2">Layout: card (default)</p>
            <PostCard :post="mockPost" layout="card" />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-2">Layout: list</p>
            <PostCard :post="mockPost" layout="list" />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-2">Layout: compact</p>
            <PostCard :post="mockPost" layout="compact" />
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-4">
          Componente: <code>components/posts/PostCard.vue</code>
        </p>
      </section>

      <!-- ==================== NSFW CONTENT WARNING ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:eye-slash" class="text-primary" aria-hidden="true" /> NSFW Content
          Warning
        </h2>
        <div class="card p-6">
          <div class="max-w-md">
            <NSFWContentWarning :post="mockNSFWPost" :show-full-text="false">
              <template #default="{ showContent }">
                <div v-if="showContent" class="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                  Contenido NSFW revelado
                </div>
                <div v-else class="p-4 bg-gray-100 dark:bg-gray-800 rounded">Contenido oculto</div>
              </template>
            </NSFWContentWarning>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/posts/NSFWContentWarning.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== COMMENT ITEM ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:comment" class="text-primary" aria-hidden="true" /> Comment Item
        </h2>
        <div class="card">
          <CommentItem :comment="mockComment" :post-author-id="1" />
        </div>
        <p class="text-sm text-gray-500 mt-4">
          Componente: <code>components/comments/CommentItem.vue</code>
        </p>
      </section>

      <!-- ==================== NOTIFICATION ITEM ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:bell" class="text-primary" aria-hidden="true" /> Notification Item
        </h2>
        <div class="card overflow-hidden">
          <NotificationItem :notification="mockNotificationComment" class="group" />
          <NotificationItem :notification="mockNotificationVote" class="group" />
          <NotificationItem :notification="mockNotificationAchievement" class="group" />
        </div>
        <p class="text-sm text-gray-500 mt-4">
          Componente: <code>components/notifications/NotificationItem.vue</code>
        </p>
      </section>

      <!-- ==================== ERROR DISPLAY ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:circle-exclamation" class="text-primary" aria-hidden="true" /> Error
          Display
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ErrorDisplay type="404" :show-action="false" />
          <ErrorDisplay type="500" :show-action="false" />
          <ErrorDisplay type="network" :show-action="false" />
          <ErrorDisplay type="unauthorized" :show-action="false" />
          <ErrorDisplay type="forbidden" :show-action="false" />
          <ErrorDisplay
            type="generic"
            custom-title="Error personalizado"
            custom-message="Este es un mensaje de error personalizado"
            :show-action="false"
          />
        </div>
        <p class="text-sm text-gray-500 mt-4">
          Componente: <code>components/ui/ErrorDisplay.vue</code>
        </p>
      </section>

      <!-- ==================== CONFIRM DIALOG ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:circle-question" class="text-primary" aria-hidden="true" /> Confirm
          Dialog
        </h2>
        <div class="card p-6">
          <button class="btn-primary px-4 py-2 rounded-md" @click="showConfirmDialog = true">
            Abrir diálogo de confirmación
          </button>
          <ConfirmDialog
            :show="showConfirmDialog"
            title="¿Estás seguro?"
            message="Esta acción no se puede deshacer. ¿Deseas continuar?"
            confirm-text="Sí, continuar"
            cancel-text="Cancelar"
            @confirm="handleConfirm"
            @cancel="showConfirmDialog = false"
          />
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/common/ConfirmDialog.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== REGISTRATION CTAs ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:user-plus" class="text-primary" aria-hidden="true" /> Registration
          CTAs
        </h2>
        <div class="space-y-6">
          <div>
            <p class="text-xs text-gray-500 mb-2">SimpleRegistrationCTA</p>
            <SimpleRegistrationCTA />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-2">CompactRegistrationCTA</p>
            <CompactRegistrationCTA />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-2">LargeRegistrationCTA</p>
            <LargeRegistrationCTA />
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-4">
          Componentes: <code>components/common/*RegistrationCTA.vue</code>
        </p>
      </section>

      <!-- ==================== SEAL BUTTON ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:certificate" class="text-primary" aria-hidden="true" /> Seal Button
        </h2>
        <div class="card p-6">
          <div class="flex gap-4 flex-wrap">
            <SealButton
              content-type="post"
              :content-id="1"
              :recommended-count="5"
              :advise-against-count="2"
              :user-has-recommended="false"
              :user-has-advise-against="false"
            />
            <SealButton
              content-type="post"
              :content-id="2"
              :recommended-count="12"
              :advise-against-count="0"
              :user-has-recommended="true"
              :user-has-advise-against="false"
            />
            <SealButton
              content-type="post"
              :content-id="3"
              :recommended-count="1"
              :advise-against-count="8"
              :user-has-recommended="false"
              :user-has-advise-against="true"
            />
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/seals/SealButton.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== FILTER CONTROLS ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:filter" class="text-primary" aria-hidden="true" /> Filter Controls
        </h2>
        <div class="card p-6">
          <FilterControls
            :current-sort="currentSort"
            :current-time-range="currentTimeRange"
            @update:sort="currentSort = $event"
            @update:time-range="currentTimeRange = $event"
          />
          <p class="text-sm text-gray-500 mt-4">
            Sort: <code>{{ currentSort }}</code
            >, Time: <code>{{ currentTimeRange }}</code>
          </p>
          <p class="text-sm text-gray-500">
            Componente: <code>components/posts/FilterControls.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== PLATFORM STATS ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:chart-bar" class="text-primary" aria-hidden="true" /> Platform Stats
        </h2>
        <div class="card p-6">
          <PlatformStats />
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/stats/PlatformStats.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== COOKIE BANNER ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:cookie-bite" class="text-primary" aria-hidden="true" /> Cookie
          Banner
        </h2>
        <div class="card p-6">
          <p class="text-sm text-gray-500 mb-4">
            El banner de cookies se muestra automáticamente si no se ha aceptado. Vista previa del
            estilo:
          </p>
          <div
            class="border rounded-lg overflow-hidden"
            style="border-color: var(--color-border-default)"
          >
            <div
              class="p-4"
              style="
                background-color: var(--color-bg-card);
                border-top: 3px solid var(--color-primary);
              "
            >
              <div class="flex items-start gap-3">
                <Icon
                  name="fa6-solid:cookie-bite"
                  class="text-primary text-xl flex-shrink-0 mt-1"
                  aria-hidden="true"
                />
                <div class="flex-1">
                  <h4 class="font-semibold mb-1">Uso de Cookies</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Este sitio utiliza únicamente cookies esenciales necesarias para el
                    funcionamiento básico. No usamos cookies de seguimiento, analíticas ni
                    publicitarias.
                  </p>
                  <div class="flex gap-2">
                    <button class="btn-primary px-4 py-1.5 rounded text-sm">Aceptar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            Componente: <code>components/legal/CookieBanner.vue</code>
          </p>
        </div>
      </section>

      <!-- ==================== UI PRIMITIVES (Generic) ==================== -->
      <section class="mb-12">
        <h2 class="section-title">
          <Icon name="fa6-solid:puzzle-piece" class="text-primary" aria-hidden="true" /> Primitivos
          UI (Estilos base)
        </h2>
        <div class="card p-6 space-y-6">
          <div>
            <h3 class="subsection-title">Botones (clases CSS)</h3>
            <div class="flex flex-wrap gap-3">
              <button class="btn-primary px-4 py-2 rounded-md">btn-primary</button>
              <button
                class="bg-primary px-4 py-2 rounded-md"
                style="color: var(--color-btn-primary-text)"
              >
                bg-primary
              </button>
              <button
                class="border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors"
              >
                Outline
              </button>
              <button class="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md">Secondary</button>
              <button class="bg-red-500 text-white px-4 py-2 rounded-md">Danger</button>
              <button class="bg-green-500 text-white px-4 py-2 rounded-md">Success</button>
            </div>
          </div>

          <div>
            <h3 class="subsection-title">Alertas (clases CSS)</h3>
            <div class="space-y-2">
              <div
                class="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-md"
              >
                <Icon name="fa6-solid:circle-check" class="mr-2" aria-hidden="true" /> Mensaje de
                éxito - Todo ha ido bien.
              </div>
              <div
                class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md"
              >
                <Icon name="fa6-solid:circle-xmark" class="mr-2" aria-hidden="true" /> Mensaje de
                error - Algo ha fallado.
              </div>
              <div
                class="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-md"
              >
                <Icon name="fa6-solid:triangle-exclamation" class="mr-2" aria-hidden="true" />
                Advertencia - Ten cuidado.
              </div>
              <div
                class="bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md"
              >
                <Icon name="fa6-solid:circle-info" class="mr-2" aria-hidden="true" /> Información -
                Dato importante.
              </div>
            </div>
          </div>

          <div>
            <h3 class="subsection-title">Inputs (clases CSS)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Label Primary</label>
                <input type="text" placeholder="Placeholder text" class="input-field" >
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Con borde primary</label>
                <input
                  type="text"
                  placeholder="Placeholder text"
                  class="input-field border-primary"
                >
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <select class="input-field">
                <option>Opción 1</option>
                <option>Opción 2</option>
              </select>
              <textarea placeholder="Textarea..." class="input-field" rows="2" />
            </div>
            <div class="flex gap-4 mt-4 items-center">
              <label class="flex items-center gap-2">
                <input type="checkbox" class="w-4 h-4 accent-primary" checked >
                <span class="text-sm">Checkbox marcado</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" class="w-4 h-4 accent-primary" >
                <span class="text-sm">Checkbox</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="radio" class="w-4 h-4 accent-primary" checked >
                <span class="text-sm">Radio 1</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="radio" class="w-4 h-4 accent-primary" >
                <span class="text-sm">Radio 2</span>
              </label>
            </div>
          </div>

          <div>
            <h3 class="subsection-title">Cards (clases CSS)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="card p-4">
                <h4 class="font-semibold mb-2">Card con Header Primary</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Contenido de ejemplo para una card básica.
                </p>
                <button class="btn-primary px-3 py-1 rounded text-sm mt-3">Acción</button>
              </div>
              <div class="card overflow-hidden">
                <div class="bg-primary px-4 py-2" style="color: var(--color-btn-primary-text)">
                  <h4 class="font-semibold">Card con Border</h4>
                </div>
                <div class="p-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400">Border lateral primary.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="subsection-title">Badges (clases CSS)</h3>
            <div class="flex flex-wrap gap-2">
              <span
                class="px-3 py-1 rounded-full text-sm"
                style="background-color: var(--color-primary); color: var(--color-btn-primary-text)"
                >Primary</span
              >
              <span class="px-3 py-1 bg-green-500 text-white rounded-full text-sm">Success</span>
              <span class="px-3 py-1 bg-red-500 text-white rounded-full text-sm">Danger</span>
              <span class="px-3 py-1 bg-yellow-500 text-black rounded-full text-sm">Warning</span>
              <span class="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">Info</span>
              <span class="px-3 py-1 bg-gray-500 text-white rounded-full text-sm">Neutral</span>
            </div>
          </div>

          <div>
            <h3 class="subsection-title">Tipografía</h3>
            <div class="space-y-2">
              <h1 class="text-4xl font-bold">Heading 1 - text-4xl</h1>
              <h2 class="text-3xl font-bold text-primary">Heading 2 - text-3xl</h2>
              <h3 class="text-2xl font-semibold">Heading 3 - text-2xl</h3>
              <h4 class="text-xl font-semibold">Heading 4 - text-xl</h4>
              <h5 class="text-lg font-medium">Heading 5 - text-lg</h5>
              <p class="text-base">
                Párrafo normal - text-base. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <p class="text-sm text-gray-500">Texto pequeño muted - text-sm.</p>
              <p class="text-xs text-gray-400">Texto muy pequeño - text-xs.</p>
            </div>
          </div>

          <div>
            <h3 class="subsection-title">Enlaces</h3>
            <div class="flex flex-wrap gap-4">
              <a href="#" class="text-primary hover:text-primary-dark">Enlace Primary</a>
              <a href="#" class="text-blue-500 hover:underline">Enlace Azul</a>
              <a href="#" class="underline">Enlace Muted</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Not in dev mode -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <Icon name="fa6-solid:lock" class="text-6xl text-gray-400 mb-4" aria-hidden="true" />
      <h1 class="text-2xl font-bold mb-2">Acceso Restringido</h1>
      <p class="text-gray-500">Esta página solo está disponible en modo desarrollo.</p>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'

  // Real components
  import Logo from '~/components/common/Logo.vue'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
  import AuthorInfo from '~/components/common/AuthorInfo.vue'
  import LanguageSelector from '~/components/common/LanguageSelector.vue'
  import ContentLanguageSelector from '~/components/common/ContentLanguageSelector.vue'
  import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
  import SimpleRegistrationCTA from '~/components/common/SimpleRegistrationCTA.vue'
  import CompactRegistrationCTA from '~/components/common/CompactRegistrationCTA.vue'
  import LargeRegistrationCTA from '~/components/common/LargeRegistrationCTA.vue'
  import PostCard from '~/components/posts/PostCard.vue'
  import CommentItem from '~/components/comments/CommentItem.vue'
  import SealButton from '~/components/seals/SealButton.vue'
  import FilterControls from '~/components/posts/FilterControls.vue'
  import PlatformStats from '~/components/stats/PlatformStats.vue'

  // New components
  import TimeAgo from '~/components/ui/TimeAgo.vue'
  import PageHeader from '~/components/ui/PageHeader.vue'
  import ErrorDisplay from '~/components/ui/ErrorDisplay.vue'
  import VoteBadge from '~/components/posts/VoteBadge.vue'
  import LayoutSelector from '~/components/posts/LayoutSelector.vue'
  import VoteControls from '~/components/comments/VoteControls.vue'
  import NotificationItem from '~/components/notifications/NotificationItem.vue'
  import UserInfoCard from '~/components/profile/UserInfoCard.vue'
  import SealCornerBadge from '~/components/seals/SealCornerBadge.vue'
  import NSFWContentWarning from '~/components/posts/NSFWContentWarning.vue'

  const isDev = computed(() => process.env.NODE_ENV === 'development' || import.meta.dev)

  const currentTheme = ref('default')
  const showConfirmDialog = ref(false)
  const selectedLanguage = ref('es')
  const currentSort = ref('hot')
  const currentTimeRange = ref('all')

  // Mock dates for TimeAgo - use fixed dates to avoid SSR/client hydration mismatch
  const mockDate = ref('2025-01-15T12:00:00.000Z')
  const fiveMinutesAgo = ref('2025-01-15T11:55:00.000Z')
  const twoHoursAgo = ref('2025-01-15T10:00:00.000Z')
  const threeDaysAgo = ref('2025-01-12T12:00:00.000Z')
  const twoMonthsAgo = ref('2024-11-15T12:00:00.000Z')

  // Mock users
  const mockUser = {
    id: 1,
    username: 'usuario_ejemplo',
    avatar_url: null,
    karma: 1250,
    isAdmin: false,
    isGlobalModerator: false,
  }

  const mockAdmin = {
    id: 2,
    username: 'admin_user',
    avatar_url: null,
    karma: 5000,
    isAdmin: true,
    isGlobalModerator: false,
  }

  // For UserInfoCard
  const mockUserProfile = {
    id: 1,
    username: 'usuario_ejemplo',
    display_name: 'Usuario Ejemplo',
    avatar: null,
    bio: 'Desarrollador apasionado por la tecnología',
    karma_points: 1250,
    created_at: '2023-06-15T10:30:00Z',
  }

  const mockAdminProfile = {
    id: 2,
    username: 'admin_renegados',
    display_name: 'Admin',
    avatar: null,
    bio: 'Administrador de la comunidad',
    karma_points: 9500,
    created_at: '2022-01-01T00:00:00Z',
  }

  // Mock post
  const mockPost = {
    id: 1,
    uuid: 'abc123',
    title: 'Título de ejemplo para probar el componente PostCard',
    content:
      'Este es el contenido del post. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    excerpt: 'Este es el contenido del post. Lorem ipsum dolor sit amet...',
    type: 'text',
    slug: 'titulo-de-ejemplo',
    permalink: '/p/abc123/titulo-de-ejemplo',
    url: null,
    thumbnail_url: null,
    votes_count: 42,
    user_has_voted: false,
    user_vote_type: null,
    numComments: 15,
    views: 234,
    created_at: '2025-01-15T12:00:00.000Z',
    published_at: '2025-01-15T12:00:00.000Z',
    user_id: 1,
    user: mockUser,
    sub: { id: 1, name: 'tecnologia', display_name: 'Tecnología' },
    language: 'es',
    is_nsfw: false,
    reports_count: 0,
    reports: [],
    recommended_seals_count: 3,
    advise_against_seals_count: 0,
  }

  // Mock NSFW post
  const mockNSFWPost = {
    ...mockPost,
    id: 99,
    is_nsfw: true,
    title: 'Contenido para adultos',
  }

  // Mock comment
  const mockComment = {
    id: 1,
    hex_id: '1',
    content:
      'Este es un comentario de ejemplo. Me parece muy interesante el tema que has compartido. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    created_at: '2025-01-15T12:00:00.000Z',
    votes_count: 12,
    user_has_voted: false,
    user: mockUser,
    is_anonymous: false,
    children: [],
    _commentNumber: 1,
  }

  // Mock notifications
  const mockNotificationComment = {
    id: 1,
    type: 'comment',
    title: 'usuario_test comentó en tu envío',
    body: '<p>Gran artículo, muy informativo!</p>',
    timestamp: '2025-01-15T11:55:00.000Z',
    read: false,
    actionUrl: '/posts/test',
    data: { commenter_username: 'usuario_test', post_title: 'Mi post de ejemplo' },
  }

  const mockNotificationVote = {
    id: 2,
    type: 'vote',
    title: 'Tu comentario recibió votos positivos',
    body: '<p>Tu comentario ha recibido 5 votos positivos.</p>',
    timestamp: '2025-01-15T10:00:00.000Z',
    read: true,
    actionUrl: '/posts/test#comment-1',
  }

  const mockNotificationAchievement = {
    id: 3,
    type: 'achievement',
    title: '¡Logro desbloqueado!',
    body: '<p>Has conseguido el logro "Primer comentario"</p>',
    timestamp: '2025-01-12T12:00:00.000Z',
    read: false,
    iconClass: 'fa6-solid:trophy text-yellow-500',
  }

  // Themes
  const themes = [
    { name: 'default', label: 'Default', dark: false },
    { name: 'dark', label: 'Dark', dark: true },
    { name: 'hacker', label: 'Hacker', dark: true },
    { name: 'nord', label: 'Nord', dark: true },
    { name: 'dracula', label: 'Dracula', dark: true },
    { name: 'sepia', label: 'Sepia', dark: false },
    { name: 'solarized-light', label: 'Solarized Light', dark: false },
    { name: 'solarized-dark', label: 'Solarized Dark', dark: true },
    { name: 'high-contrast-dark', label: 'High Contrast Dark', dark: true },
    { name: 'high-contrast-light', label: 'High Contrast Light', dark: false },
  ]

  function setTheme(themeName, isDark) {
    const html = document.documentElement
    html.className = html.className.replace(/theme-\S+/g, '').trim()
    if (themeName !== 'default') {
      html.classList.add(`theme-${themeName}`)
    }
    if (isDark) {
      html.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      html.classList.remove('dark')
      document.body.classList.remove('dark')
    }
    currentTheme.value = themeName

    // Update URL
    const url = new URL(window.location.href)
    if (themeName !== 'default') {
      url.searchParams.set('theme', themeName)
    } else {
      url.searchParams.delete('theme')
    }
    window.history.replaceState({}, '', url)
  }

  function handleConfirm() {
    showConfirmDialog.value = false
  }

  onMounted(() => {
    // Check URL for theme parameter
    const urlParams = new URLSearchParams(window.location.search)
    const themeParam = urlParams.get('theme')

    if (themeParam) {
      const theme = themes.find((t) => t.name === themeParam)
      if (theme) {
        setTheme(theme.name, theme.dark)
        return
      }
    }

    // Fallback to current theme
    const html = document.documentElement
    const themeMatch = html.className.match(/theme-(\S+)/)
    if (themeMatch) {
      currentTheme.value = themeMatch[1]
    }
  })

  useHead({
    title: 'Component Showcase - Dev Only',
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  })
</script>

<style scoped>
  .card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: 0.5rem;
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: var(--color-btn-primary-text);
  }

  .btn-primary:hover {
    background-color: var(--color-primary-dark);
  }

  .section-title {
    @apply text-xl font-bold mb-4 flex items-center gap-2;
  }

  .subsection-title {
    @apply text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wide;
  }

  .input-field {
    @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary;
    background-color: var(--color-bg-card);
    border-color: var(--color-border-default);
  }

  code {
    @apply px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono;
  }
</style>
