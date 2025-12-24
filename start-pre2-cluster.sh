#!/bin/bash

# Script para iniciar 8 instancias de Nuxt en puertos 3010-3017
# Para staging/preview environment

echo "🚀 Iniciando 8 instancias de nuxt-pre2 en puertos 3010-3017..."

for port in {3010..3017}; do
    echo "Iniciando instancia en puerto $port..."
    PORT=$port NUXT_PUBLIC_SUPPORTED_LOCALES="es,en,ca,gl,eu" NUXT_PUBLIC_DEFAULT_LOCALE="es" pm2 start .output/server/index.mjs --name "nuxt-pre2-$port"
done

echo "✅ 8 instancias iniciadas"
pm2 list
pm2 save

echo ""
echo "💡 Para detenerlas todas:"
echo "   pm2 delete nuxt-pre2-3010 nuxt-pre2-3011 nuxt-pre2-3012 nuxt-pre2-3013 nuxt-pre2-3014 nuxt-pre2-3015 nuxt-pre2-3016 nuxt-pre2-3017"
echo "   O usar: pm2 delete /nuxt-pre2-/"
