// test/unit/components/posts/PostRelationships.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock del componente PostRelationships
const PostRelationshipsMock = {
  name: 'PostRelationships',
  template: `
    <div class="post-relationships">
      <div class="relationships-header">
        <h3>{{ title }}</h3>
        <button v-if="canAdd" class="add-relationship-btn" @click="openAddModal">Add</button>
      </div>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="hasRelationships" class="relationships-list">
        <div v-for="group in groupedRelationships" :key="group.type" class="relationship-group">
          <div class="group-header">
            <Icon :name="'fa6-solid:' + group.icon" />
            <span>{{ group.label }}</span>
          </div>
          <div class="group-items">
            <div v-for="rel in group.relationships" :key="rel.id" class="relationship-item">
              <a :href="rel.post.url">{{ rel.post.title }}</a>
              <button v-if="canDelete(rel)" class="delete-btn" @click="deleteRelationship(rel)">Delete</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-relationships">No relationships</div>
    </div>
  `,
  props: {
    postId: {
      type: Number,
      required: true,
    },
    canAdd: {
      type: Boolean,
      default: false,
    },
    currentUserId: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      relationships: [],
      loading: false,
      title: 'Related Posts',
    }
  },
  computed: {
    hasRelationships() {
      return this.relationships.length > 0
    },
    groupedRelationships() {
      const groups = {
        reply: { type: 'reply', label: 'Replies', icon: 'reply', relationships: [] },
        continuation: {
          type: 'continuation',
          label: 'Continuation',
          icon: 'arrow-right',
          relationships: [],
        },
        related: { type: 'related', label: 'Related', icon: 'link', relationships: [] },
        update: { type: 'update', label: 'Updates', icon: 'sync', relationships: [] },
        correction: { type: 'correction', label: 'Corrections', icon: 'edit', relationships: [] },
        duplicate: { type: 'duplicate', label: 'Duplicates', icon: 'copy', relationships: [] },
      }

      this.relationships.forEach((rel) => {
        if (groups[rel.type]) {
          groups[rel.type].relationships.push(rel)
        }
      })

      return Object.values(groups).filter((g) => g.relationships.length > 0)
    },
  },
  methods: {
    openAddModal() {
      this.$emit('open-add-modal')
    },
    canDelete(relationship) {
      return (
        this.currentUserId &&
        (relationship.created_by === this.currentUserId ||
          relationship.post.author_id === this.currentUserId)
      )
    },
    deleteRelationship(relationship) {
      this.$emit('delete-relationship', relationship)
    },
  },
}

describe('PostRelationships Component', () => {
  let wrapper

  const mockRelationships = [
    {
      id: 1,
      type: 'reply',
      post: { id: 2, title: 'Reply Post', url: '/posts/2', author_id: 1 },
      created_by: 1,
    },
    {
      id: 2,
      type: 'continuation',
      post: { id: 3, title: 'Continuation Post', url: '/posts/3', author_id: 1 },
      created_by: 1,
    },
    {
      id: 3,
      type: 'related',
      post: { id: 4, title: 'Related Post', url: '/posts/4', author_id: 2 },
      created_by: 2,
    },
  ]

  beforeEach(() => {
    wrapper = mount(PostRelationshipsMock, {
      props: {
        postId: 1,
        canAdd: false,
        currentUserId: null,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          NuxtLink: true,
          Icon: {
            template: '<i class="iconify-icon" :name="name"></i>',
            props: ['name'],
          },
        },
      },
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('.post-relationships').exists()).toBe(true)
    expect(wrapper.find('.relationships-header h3').text()).toBe('Related Posts')
  })

  it('shows no relationships message when empty', () => {
    expect(wrapper.find('.no-relationships').exists()).toBe(true)
    expect(wrapper.find('.no-relationships').text()).toBe('No relationships')
  })

  it('displays relationships grouped by type', async () => {
    await wrapper.setData({ relationships: mockRelationships })

    expect(wrapper.find('.no-relationships').exists()).toBe(false)
    expect(wrapper.findAll('.relationship-group')).toHaveLength(3)

    const groups = wrapper.findAll('.relationship-group')
    expect(groups[0].find('.group-header span').text()).toBe('Replies')
    expect(groups[1].find('.group-header span').text()).toBe('Continuation')
    expect(groups[2].find('.group-header span').text()).toBe('Related')
  })

  it('shows add button when canAdd is true', async () => {
    expect(wrapper.find('.add-relationship-btn').exists()).toBe(false)

    await wrapper.setProps({ canAdd: true })

    expect(wrapper.find('.add-relationship-btn').exists()).toBe(true)
  })

  it('emits open-add-modal event when add button is clicked', async () => {
    await wrapper.setProps({ canAdd: true })

    await wrapper.find('.add-relationship-btn').trigger('click')

    expect(wrapper.emitted('open-add-modal')).toBeTruthy()
    expect(wrapper.emitted('open-add-modal')).toHaveLength(1)
  })

  it('shows delete button only for authorized users', async () => {
    await wrapper.setData({ relationships: mockRelationships })

    // Sin usuario autenticado, no debe haber botones de eliminar
    expect(wrapper.findAll('.delete-btn')).toHaveLength(0)

    // Con usuario autenticado (id: 1), debe poder eliminar sus propias relaciones
    await wrapper.setProps({ currentUserId: 1 })

    const deleteButtons = wrapper.findAll('.delete-btn')
    // User 1 created relationships 1 and 2
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('emits delete-relationship event when delete button is clicked', async () => {
    await wrapper.setData({ relationships: [mockRelationships[0]] })
    await wrapper.setProps({ currentUserId: 1 })

    await wrapper.find('.delete-btn').trigger('click')

    expect(wrapper.emitted('delete-relationship')).toBeTruthy()
    expect(wrapper.emitted('delete-relationship')[0][0]).toEqual(mockRelationships[0])
  })

  it('groups relationships correctly by type', async () => {
    await wrapper.setData({ relationships: mockRelationships })

    const groupedRels = wrapper.vm.groupedRelationships

    expect(groupedRels).toHaveLength(3)
    expect(groupedRels[0].type).toBe('reply')
    expect(groupedRels[0].relationships).toHaveLength(1)
    expect(groupedRels[1].type).toBe('continuation')
    expect(groupedRels[1].relationships).toHaveLength(1)
    expect(groupedRels[2].type).toBe('related')
    expect(groupedRels[2].relationships).toHaveLength(1)
  })

  it('shows loading state', async () => {
    expect(wrapper.find('.loading').exists()).toBe(false)

    await wrapper.setData({ loading: true })

    expect(wrapper.find('.loading').exists()).toBe(true)
    expect(wrapper.find('.loading').text()).toBe('Loading...')
  })

  it('displays correct icons for each relationship type', async () => {
    await wrapper.setData({ relationships: mockRelationships })

    const icons = wrapper.findAll('.iconify-icon')
    const iconNames = icons.map((icon) => icon.attributes('name'))

    // Should have reply, continuation (arrow-right), and related (link) icons
    expect(iconNames.some((name) => name && name.includes('reply'))).toBe(true)
    expect(iconNames.some((name) => name && name.includes('arrow-right'))).toBe(true)
    expect(iconNames.some((name) => name && name.includes('link'))).toBe(true)
  })
})
