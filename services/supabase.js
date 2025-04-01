import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#app'
import { defineNuxtPlugin } from '#app'

let supabaseClient = null

export const getSupabase = () => {
  return supabaseClient
}

export const initSupabase = () => {
  if (supabaseClient) return supabaseClient

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Supabase configuration is missing. Make sure you provide the SUPABASE_URL and SUPABASE_KEY variables in your .env file.'
    )
    return null
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

export default defineNuxtPlugin((nuxtApp) => {
  const supabase = initSupabase()

  if (supabase) {
    const authService = {
      async signUp(email, password, userData = {}) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,
          },
        })

        if (error) throw error
        return data
      },

      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        return data
      },

      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },

      async getUser() {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        return data.user
      },

      getSession() {
        return supabase.auth.getSession()
      },

      onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
      },

      async resetPasswordForEmail(email, redirectTo) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        })

        if (error) throw error
        return data
      },
    }

    nuxtApp.provide('authService', authService)
  }

  return {
    provide: {
      supabase,
    },
  }
})
