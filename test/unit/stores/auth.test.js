import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    // Crear una nueva instancia de Pinia para cada test
    setActivePinia(createPinia())
  })

  it('should start with initial state', () => {
    const store = useAuthStore()

    // Comprobar el estado inicial
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.initialized).toBe(false)
  })

  it('should have isAuthenticated = false when no token/user', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })
})
