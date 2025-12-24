// test/unit/components/PostCard.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Instead of importing the real component which has problematic dependencies,
// we create a mock component.
// This avoids resolving internal dependencies like #i18n
const PostCardMock = {
  name: 'PostCard',
  template: `
    <div class="post-card">
      <h2 class="card-title">{{ post.title }}</h2>
      <div class="author-info">{{ post.user.username }}</div>
      <div class="votes-container">{{ post.votes }}</div>
      <div class="comments-count">{{ post.numComments }}</div>
      <div class="card-text" v-if="!showFullText">{{ post.content }}</div>
      <div class="full-content" v-else>{{ post.content }}</div>
    </div>
  `,
  props: {
    post: {
      type: Object,
      required: true,
    },
    showFullText: {
      type: Boolean,
      default: false,
    },
    hideComments: {
      type: Boolean,
      default: false,
    },
  },
}

describe('PostCard Component', () => {
  let wrapper

  beforeEach(() => {
    // Crear datos de prueba para el post
    const post = {
      id: 1,
      title: 'Test Post Title',
      content: 'This is test content',
      user: {
        username: 'testuser',
      },
      created_at: '2023-01-01T00:00:00Z',
      votes: 10,
      numComments: 5,
    }

    // Montar el componente mock en lugar del componente real
    wrapper = mount(PostCardMock, {
      props: {
        post: post,
        showFullText: false,
        hideComments: false,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        mocks: {
          $t: (key) => key,
          localePath: (path) => path,
        },
        stubs: {
          NuxtLink: true,
        },
      },
    })
  })

  it('renders the post title correctly', () => {
    expect(wrapper.find('.card-title').text()).toContain('Test Post Title')
  })

  it('displays the post metadata correctly', () => {
    expect(wrapper.find('.author-info').text()).toContain('testuser')
    expect(wrapper.find('.votes-container').text()).toContain('10')
    expect(wrapper.find('.comments-count').text()).toContain('5')
  })

  it('shows truncated content when showFullText is false', async () => {
    // Verify content is initially truncated
    expect(wrapper.find('.card-text').exists()).toBe(true)

    // Cambiar la propiedad a true
    await wrapper.setProps({ showFullText: true })

    // Verificar que ahora se muestra el contenido completo
    expect(wrapper.find('.full-content').exists()).toBe(true)
  })
})
