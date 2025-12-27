<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text dark:text-text-dark mb-2">{{ $t('karma.title') }}</h1>
      <p class="text-text-muted dark:text-text-dark-muted mb-3">{{ $t('karma.description') }}</p>
      <div
        class="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-800 rounded text-sm text-yellow-900 dark:text-yellow-200"
      >
        {{ $t('karma.beta_notice') }}
      </div>
    </div>

    <!-- Resumen -->
    <section class="mb-12">
      <h2
        class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 karma-border-bottom"
      >
        {{ $t('karma.overview.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted mb-4 leading-relaxed">
        {{ $t('karma.overview.intro') }}
      </p>
      <p class="text-sm font-semibold text-text dark:text-text-dark mb-2">
        {{ $t('karma.overview.key_features') }}
      </p>
      <ul class="list-disc list-inside space-y-1 text-text-muted dark:text-text-dark-muted">
        <li>{{ $t('karma.overview.feature_1') }}</li>
        <li>{{ $t('karma.overview.feature_2') }}</li>
        <li>{{ $t('karma.overview.feature_3') }}</li>
        <li>{{ $t('karma.overview.feature_4') }}</li>
      </ul>
    </section>

    <!-- Mecánicas del Sistema -->
    <section class="mb-12">
      <h2
        class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 karma-border-bottom"
      >
        {{ $t('karma.mechanics.title') }}
      </h2>

      <!-- Publicaciones -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.posts.title') }}
        </h3>
        <ul class="space-y-2 text-text-muted dark:text-text-dark-muted text-sm">
          <li>{{ $t('karma.mechanics.posts.base') }}</li>
          <li>{{ $t('karma.mechanics.posts.diminishing') }}</li>
          <li>{{ $t('karma.mechanics.posts.comment_bonus') }}</li>
          <li>{{ $t('karma.mechanics.posts.cap') }}</li>
          <li class="text-xs italic">{{ $t('karma.mechanics.posts.note') }}</li>
        </ul>
      </div>

      <!-- Comentarios -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.comments.title') }}
        </h3>
        <ul class="space-y-2 text-text-muted dark:text-text-dark-muted text-sm">
          <li>{{ $t('karma.mechanics.comments.upvote') }}</li>
          <li>{{ $t('karma.mechanics.comments.downvote') }}</li>
          <li>{{ $t('karma.mechanics.comments.diminishing') }}</li>
          <li>{{ $t('karma.mechanics.comments.reply_bonus') }}</li>
        </ul>
      </div>

      <!-- Bonus de Actividad -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.activity.title') }}
        </h3>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-3">
          {{ $t('karma.mechanics.activity.description') }}
        </p>
        <ul class="space-y-2 text-text-muted dark:text-text-dark-muted text-sm">
          <li>{{ $t('karma.mechanics.activity.posts') }}</li>
          <li>{{ $t('karma.mechanics.activity.comments') }}</li>
          <li>{{ $t('karma.mechanics.activity.votes') }}</li>
          <li class="text-xs italic">{{ $t('karma.mechanics.activity.cap') }}</li>
          <li class="text-xs italic">{{ $t('karma.mechanics.activity.example') }}</li>
        </ul>
      </div>

      <!-- Age Decay -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.age_decay.title') }}
        </h3>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-3">
          {{ $t('karma.mechanics.age_decay.description') }}
        </p>
        <table class="w-full text-sm karma-border mb-3">
          <tbody>
            <tr class="karma-border-bottom">
              <td class="p-2 text-text-muted dark:text-text-dark-muted">
                {{ $t('karma.mechanics.age_decay.m1') }}
              </td>
            </tr>
            <tr class="karma-border-bottom">
              <td class="p-2 text-text-muted dark:text-text-dark-muted">
                {{ $t('karma.mechanics.age_decay.m3') }}
              </td>
            </tr>
            <tr class="karma-border-bottom">
              <td class="p-2 text-text-muted dark:text-text-dark-muted">
                {{ $t('karma.mechanics.age_decay.m6') }}
              </td>
            </tr>
            <tr class="karma-border-bottom">
              <td class="p-2 text-text-muted dark:text-text-dark-muted">
                {{ $t('karma.mechanics.age_decay.m12') }}
              </td>
            </tr>
            <tr class="karma-border-bottom">
              <td class="p-2 text-text-muted dark:text-text-dark-muted">
                {{ $t('karma.mechanics.age_decay.y2') }}
              </td>
            </tr>
            <tr>
              <td class="p-2 text-text-muted dark:text-text-dark-muted">
                {{ $t('karma.mechanics.age_decay.old') }}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="text-xs italic text-text-muted dark:text-text-dark-muted">
          {{ $t('karma.mechanics.age_decay.note') }}
        </p>
      </div>
    </section>

    <!-- Sellos de Comunidad -->
    <section id="community-seals" class="mb-12 scroll-mt-20">
      <h2
        class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 karma-border-bottom"
      >
        {{ $t('karma.mechanics.seals.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted mb-4 text-sm leading-relaxed">
        {{ $t('karma.mechanics.seals.description') }}
      </p>

      <!-- Tabla de asignación de sellos -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.seals.weekly_allocation') }}
        </h3>
        <table class="w-full text-sm karma-border mb-4">
          <thead class="karma-header-bg">
            <tr>
              <th class="p-3 text-left text-text dark:text-text-dark font-semibold">
                {{ $t('karma.mechanics.seals.seal_table_level') }}
              </th>
              <th class="p-3 text-right text-text dark:text-text-dark font-semibold">
                {{ $t('karma.mechanics.seals.seal_table_seals') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon name="fa6-solid:seedling" class="mr-2 text-green-500" aria-hidden="true" />
                  <span>{{ $t('karma.levels.novice') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">0</td>
            </tr>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon
                    name="fa6-solid:magnifying-glass"
                    class="mr-2 text-blue-500"
                    aria-hidden="true"
                  />
                  <span>{{ $t('karma.levels.apprentice') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1</td>
            </tr>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon name="fa6-solid:star" class="mr-2 text-yellow-500" aria-hidden="true" />
                  <span>{{ $t('karma.levels.contributor') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">2</td>
            </tr>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon name="fa6-solid:trophy" class="mr-2 text-orange-500" aria-hidden="true" />
                  <span>{{ $t('karma.levels.expert') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">3</td>
            </tr>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon name="fa6-solid:crown" class="mr-2 text-purple-500" aria-hidden="true" />
                  <span>{{ $t('karma.levels.mentor') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">4</td>
            </tr>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon name="fa6-solid:gem" class="mr-2 text-cyan-500" aria-hidden="true" />
                  <span>{{ $t('karma.levels.sage') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">5</td>
            </tr>
            <tr class="karma-border-top">
              <td class="p-3">
                <div class="flex items-center text-text-muted dark:text-text-dark-muted">
                  <Icon name="fa6-solid:medal" class="mr-2 text-amber-500" aria-hidden="true" />
                  <span>{{ $t('karma.levels.legend') }}</span>
                </div>
              </td>
              <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">6</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Impacto en karma -->
      <div class="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.seals.impact_title') }}
        </h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-start text-text-muted dark:text-text-dark-muted">
            <Icon
              name="fa6-solid:award"
              class="mr-2 mt-0.5 text-green-600 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{{ $t('karma.mechanics.seals.recommended') }}</span>
          </li>
          <li class="flex items-start text-text-muted dark:text-text-dark-muted">
            <Icon
              name="fa6-solid:triangle-exclamation"
              class="mr-2 mt-0.5 text-red-600 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{{ $t('karma.mechanics.seals.advised_against') }}</span>
          </li>
        </ul>
      </div>

      <!-- Reglas -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-text dark:text-text-dark mb-3">
          {{ $t('karma.mechanics.seals.rules_title') }}
        </h3>
        <ul
          class="list-disc list-inside space-y-1 text-text-muted dark:text-text-dark-muted text-sm"
        >
          <li>{{ $t('karma.mechanics.seals.rule_1') }}</li>
          <li>{{ $t('karma.mechanics.seals.rule_2') }}</li>
          <li>{{ $t('karma.mechanics.seals.rule_3') }}</li>
          <li>{{ $t('karma.mechanics.seals.rule_4') }}</li>
          <li>{{ $t('karma.mechanics.seals.rule_5') }}</li>
          <li>{{ $t('karma.mechanics.seals.rule_6') }}</li>
        </ul>
      </div>

      <p class="text-sm italic text-text-muted dark:text-text-dark-muted">
        {{ $t('karma.mechanics.seals.impact') }}
      </p>
    </section>

    <!-- Niveles y Multiplicadores -->
    <section class="mb-12">
      <h2
        class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 karma-border-bottom"
      >
        {{ $t('karma.levels.title') }}
      </h2>
      <p class="text-text-muted dark:text-text-dark-muted mb-4 text-sm leading-relaxed">
        {{ $t('karma.levels.description') }}
      </p>
      <table class="w-full text-sm karma-border">
        <thead class="karma-header-bg">
          <tr>
            <th class="p-3 text-left text-text dark:text-text-dark font-semibold">
              {{ $t('karma.levels.table_level') }}
            </th>
            <th class="p-3 text-right text-text dark:text-text-dark font-semibold">
              {{ $t('karma.levels.table_karma') }}
            </th>
            <th class="p-3 text-right text-text dark:text-text-dark font-semibold">
              {{ $t('karma.levels.table_multiplier') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.novice') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">0</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.0x</td>
          </tr>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.apprentice') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">200</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.0x</td>
          </tr>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.contributor') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1,000</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.0x</td>
          </tr>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.expert') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">4,000</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.0x</td>
          </tr>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.mentor') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">16,000</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.05x</td>
          </tr>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.sage') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">40,000</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.10x</td>
          </tr>
          <tr class="karma-border-top">
            <td class="p-3 text-text-muted dark:text-text-dark-muted">
              {{ $t('karma.levels.legend') }}
            </td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">100,000</td>
            <td class="p-3 text-right text-text-muted dark:text-text-dark-muted">1.15x</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Ejemplos Prácticos -->
    <section class="mb-12">
      <h2
        class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 karma-border-bottom"
      >
        {{ $t('karma.examples.title') }}
      </h2>

      <!-- Ejemplo 1 -->
      <div class="mb-6 p-4 karma-example-bg border-l-4 border-gray-400">
        <h3 class="font-semibold text-text dark:text-text-dark mb-2">
          {{ $t('karma.examples.viral_post.title') }}
        </h3>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
          {{ $t('karma.examples.viral_post.old_system') }}
        </p>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-2">
          {{ $t('karma.examples.viral_post.new_system') }}
        </p>
        <p class="text-xs italic text-text-muted dark:text-text-dark-muted">
          {{ $t('karma.examples.viral_post.conclusion') }}
        </p>
      </div>

      <!-- Ejemplo 2 -->
      <div class="mb-6 p-4 karma-example-bg border-l-4 border-gray-400">
        <h3 class="font-semibold text-text dark:text-text-dark mb-2">
          {{ $t('karma.examples.content_decay.title') }}
        </h3>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
          {{ $t('karma.examples.content_decay.scenario') }}
        </p>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
          {{ $t('karma.examples.content_decay.fresh') }}
        </p>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-2">
          {{ $t('karma.examples.content_decay.old') }}
        </p>
        <p class="text-xs italic text-text-muted dark:text-text-dark-muted">
          {{ $t('karma.examples.content_decay.conclusion') }}
        </p>
      </div>

      <!-- Ejemplo 3 -->
      <div class="mb-6 p-4 karma-example-bg border-l-4 border-gray-400">
        <h3 class="font-semibold text-text dark:text-text-dark mb-2">
          {{ $t('karma.examples.deleted_content.title') }}
        </h3>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
          {{ $t('karma.examples.deleted_content.scenario') }}
        </p>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
          {{ $t('karma.examples.deleted_content.karma_lost') }}
        </p>
        <p class="text-sm text-text-muted dark:text-text-dark-muted mb-2">
          {{ $t('karma.examples.deleted_content.strike') }}
        </p>
        <p class="text-xs italic text-text-muted dark:text-text-dark-muted">
          {{ $t('karma.examples.deleted_content.conclusion') }}
        </p>
      </div>
    </section>

    <!-- Proyecciones de Progresión -->
    <section class="mb-12">
      <h2
        class="text-2xl font-semibold text-text dark:text-text-dark mb-4 pb-2 karma-border-bottom"
      >
        {{ $t('karma.simulations.title') }}
      </h2>
      <p class="text-sm text-text-muted dark:text-text-dark-muted mb-4">
        {{ $t('karma.simulations.description') }}
      </p>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <!-- Usuario Casual -->
        <div class="p-4 karma-border">
          <h3 class="font-semibold text-text dark:text-text-dark mb-2 text-sm">
            {{ $t('karma.simulations.casual.title') }}
          </h3>
          <p class="text-xs text-text-muted dark:text-text-dark-muted mb-2">
            {{ $t('karma.simulations.casual.activity') }}
          </p>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
            {{ $t('karma.simulations.casual.monthly') }}
          </p>
          <p class="text-xs text-text-muted dark:text-text-dark-muted">
            {{ $t('karma.simulations.casual.legend') }}
          </p>
        </div>

        <!-- Usuario Activo -->
        <div class="p-4 karma-border">
          <h3 class="font-semibold text-text dark:text-text-dark mb-2 text-sm">
            {{ $t('karma.simulations.active.title') }}
          </h3>
          <p class="text-xs text-text-muted dark:text-text-dark-muted mb-2">
            {{ $t('karma.simulations.active.activity') }}
          </p>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
            {{ $t('karma.simulations.active.monthly') }}
          </p>
          <p class="text-xs text-text-muted dark:text-text-dark-muted">
            {{ $t('karma.simulations.active.legend') }}
          </p>
        </div>

        <!-- Power User -->
        <div class="p-4 karma-border">
          <h3 class="font-semibold text-text dark:text-text-dark mb-2 text-sm">
            {{ $t('karma.simulations.power.title') }}
          </h3>
          <p class="text-xs text-text-muted dark:text-text-dark-muted mb-2">
            {{ $t('karma.simulations.power.activity') }}
          </p>
          <p class="text-sm text-text-muted dark:text-text-dark-muted mb-1">
            {{ $t('karma.simulations.power.monthly') }}
          </p>
          <p class="text-xs text-text-muted dark:text-text-dark-muted">
            {{ $t('karma.simulations.power.legend') }}
          </p>
        </div>

        <!-- Usuario Troll -->
        <div class="p-4 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950">
          <h3 class="font-semibold text-red-700 dark:text-red-400 mb-2 text-sm">
            {{ $t('karma.simulations.troll.title') }}
          </h3>
          <p class="text-xs text-red-600 dark:text-red-500 mb-2">
            {{ $t('karma.simulations.troll.activity') }}
          </p>
          <p class="text-sm text-red-700 dark:text-red-400 mb-1">
            {{ $t('karma.simulations.troll.monthly') }}
          </p>
          <p class="text-xs text-red-600 dark:text-red-500">
            {{ $t('karma.simulations.troll.result') }}
          </p>
        </div>
      </div>

      <p class="text-xs italic text-text-muted dark:text-text-dark-muted">
        {{ $t('karma.simulations.note') }}
      </p>
    </section>

    <!-- Detalles Técnicos (opcional, colapsable) -->
    <details class="mb-8">
      <summary
        class="cursor-pointer text-lg font-semibold text-text dark:text-text-dark mb-2 pb-2 karma-border-bottom"
      >
        {{ $t('karma.technical.title') }}
      </summary>
      <div class="mt-4 space-y-3 text-sm">
        <div>
          <p class="text-xs font-semibold text-text dark:text-text-dark mb-1">
            Karma por Publicación:
          </p>
          <pre
            class="p-3 karma-code-bg rounded text-xs overflow-x-auto text-text-muted dark:text-text-dark-muted"
            >{{ $t('karma.technical.formula_post') }}</pre
          >
        </div>
        <div>
          <p class="text-xs font-semibold text-text dark:text-text-dark mb-1">
            Karma por Comentario:
          </p>
          <pre
            class="p-3 karma-code-bg rounded text-xs overflow-x-auto text-text-muted dark:text-text-dark-muted"
            >{{ $t('karma.technical.formula_comment') }}</pre
          >
        </div>
        <div>
          <p class="text-xs font-semibold text-text dark:text-text-dark mb-1">Karma Total:</p>
          <pre
            class="p-3 karma-code-bg rounded text-xs overflow-x-auto text-text-muted dark:text-text-dark-muted"
            >{{ $t('karma.technical.formula_total') }}</pre
          >
        </div>
        <div>
          <p class="text-xs font-semibold text-text dark:text-text-dark mb-1">
            Función de Rendimientos Decrecientes:
          </p>
          <pre
            class="p-3 karma-code-bg rounded text-xs overflow-x-auto text-text-muted dark:text-text-dark-muted"
            >{{ $t('karma.technical.diminishing') }}</pre
          >
        </div>
        <div>
          <p class="text-xs font-semibold text-text dark:text-text-dark mb-1">
            Multiplicador Temporal:
          </p>
          <pre
            class="p-3 karma-code-bg rounded text-xs overflow-x-auto text-text-muted dark:text-text-dark-muted"
            >{{ $t('karma.technical.time_mult') }}</pre
          >
        </div>
        <div>
          <p class="text-xs font-semibold text-text dark:text-text-dark mb-1">
            Bonificación de Actividad:
          </p>
          <pre
            class="p-3 karma-code-bg rounded text-xs overflow-x-auto text-text-muted dark:text-text-dark-muted"
            >{{ $t('karma.technical.activity') }}</pre
          >
        </div>
        <p class="text-xs italic text-text-muted dark:text-text-dark-muted mt-3">
          {{ $t('karma.technical.note') }}
        </p>
      </div>
    </details>
  </div>
</template>

<script setup>
  const { t } = useI18n()
  const runtimeConfig = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = runtimeConfig.public.siteUrl
  const pageUrl = `${siteUrl}${route.path}`
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  useSeoMeta({
    title: t('karma.title') + ' | ' + runtimeConfig.public.appName,
    description: t('karma.description'),
    keywords: `${runtimeConfig.public.appName}, karma, puntos, reputación, sistema, comunidad, gamificación`,
    robots: 'index, follow',
    ogTitle: t('karma.title') + ' | ' + runtimeConfig.public.appName,
    ogDescription: t('karma.description'),
    ogImage: ogImageUrl,
    ogUrl: pageUrl,
    ogType: 'website',
    ogSiteName: runtimeConfig.public.appName,
    twitterCard: 'summary',
    twitterTitle: t('karma.title') + ' | ' + runtimeConfig.public.appName,
    twitterDescription: t('karma.description'),
    twitterImage: ogImageUrl,
    twitterSite: runtimeConfig.public.twitterHandle || undefined,
  })

  // Set canonical URL
  useCanonical()

  // Add HowTo structured data (karma is a how-to guide)
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          '@id': pageUrl,
          url: pageUrl,
          name: t('karma.title'),
          description: t('karma.description'),
          inLanguage: 'es-ES',
          isPartOf: {
            '@id': `${siteUrl}/#website`,
          },
        }),
        tagPosition: 'bodyClose',
      },
    ],
  })
</script>

<style scoped>
  .karma-border {
    border: 1px solid var(--color-border-default);
  }

  .karma-border-bottom {
    border-bottom: 1px solid var(--color-border-default);
  }

  .karma-border-top {
    border-top: 1px solid var(--color-border-default);
  }

  .karma-header-bg {
    background-color: var(--color-bg-subtle);
  }

  .karma-example-bg {
    background-color: var(--color-bg-subtle);
  }

  .karma-code-bg {
    background-color: var(--color-bg-subtle);
  }
</style>
