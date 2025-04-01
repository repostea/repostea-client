<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-3xl mx-auto">
      <div
        class="bg-white dark:bg-card-dark rounded-lg shadow-sm border border-border-color dark:border-neutral-700 mb-6"
      >
        <div class="px-6 py-4 border-b border-border-color dark:border-neutral-700">
          <h2 class="text-xl font-medium flex items-center">
            <i class="fas fa-info-circle mr-2"></i>Acerca de Repostea
          </h2>
        </div>
        <div class="p-6">
          <h3 class="text-lg font-bold mb-3">¿Qué es Repostea?</h3>

          <div class="mb-6">
            <p class="mb-3">
              Repostea es una
              <strong>prueba de concepto</strong> de un
              <strong>metaagregador de noticias</strong> que recopila y enlaza las portadas de
              distintos sitios de agregación de contenido. Está en fase de desarrollo y validación.
            </p>

            <ul class="list-disc pl-5 space-y-2 mb-4">
              <li>Repostea enlaza directamente a las entradas destacadas de otros agregadores.</li>
              <li>
                No buscamos ningún tipo de lucro: no usamos cookies de seguimiento ni publicidad.
              </li>
              <li>Puedes registrarte sin correo electrónico para personalizar tu portada.</li>
              <li>
                Queremos ser un punto de unión entre plataformas, ayudarlas a crecer y darles
                visibilidad.
              </li>
            </ul>
          </div>

          <h3 class="text-lg font-bold mb-3">Hoja de Ruta</h3>

          <div class="mb-6">
            <p class="mb-3">Estos son los siguientes pasos en el desarrollo de Repostea:</p>

            <ol class="list-decimal pl-5 space-y-2 mb-4">
              <li>
                <strong>Integración de ActivityPub</strong> – Conectaremos Repostea con el fediverso
                para ampliar el alcance.
              </li>
              <li>
                <strong>Registro anónimo</strong> – Implementaremos un sistema de registro que no
                requiera correo electrónico.
              </li>
              <li>
                <strong>Selección de agregadores personalizada</strong>
                – Podrás elegir de qué fuentes quieres recibir contenido.
              </li>
              <li>
                <strong>Personalización de portada</strong> – Ajustes como número de votos mínimos,
                agregadores preferidos, temas, etc.
              </li>
              <li>
                <strong>Sistema de etiquetas mejorado</strong> – Mejor organización y descubrimiento
                de contenido por intereses.
              </li>
              <li>
                <strong>Interfaz adaptable</strong> – Mejoras en la experiencia de usuario para
                diferentes dispositivos.
              </li>
            </ol>
          </div>

          <h3 class="text-lg font-bold mb-3">Colaboración</h3>

          <div class="mb-6">
            <p class="mb-3">
              Estamos buscando colaboradores, socios e inversores interesados en este proyecto. Si
              te interesa participar:
            </p>

            <ul class="list-disc pl-5 space-y-2 mb-4">
              <li>Desarrolladores con experiencia en Laravel y Vue.js/Nuxt</li>
              <li>Diseñadores UX/UI</li>
              <li>Socios estratégicos para crecer el ecosistema</li>
            </ul>

            <p>
              Si tienes dudas, sugerencias o no deseas que tu plataforma aparezca indexada en
              Repostea, puedes contactar con nosotros a través de
              <a href="mailto:info@repostea.com" class="text-primary hover:underline"
                >info@repostea.com</a
              >.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
