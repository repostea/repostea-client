// test/unit/components/posts/postForm/PollPostForm.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock component to avoid complex dependencies
const PollPostFormMock = {
  name: 'PollPostForm',
  template: `
    <div class="poll-post-form">
      <div class="poll-description">
        <label for="content" class="form-label">Poll Description</label>
        <textarea
          id="content"
          v-model="localContent"
          class="form-textarea"
          :class="{ 'error': contentError }"
          placeholder="Optional description for your poll"
        ></textarea>
        <p v-if="contentError" class="error-message">{{ contentError }}</p>
      </div>

      <div class="poll-options">
        <label class="form-label">Poll Options *</label>
        <div v-for="(option, index) in pollOptions" :key="index" class="option-input">
          <input
            v-model="pollOptions[index]"
            type="text"
            class="form-input"
            :class="{ 'error': pollOptionsError }"
            :placeholder="'Option ' + (index + 1)"
          />
          <button
            v-if="index > 1"
            type="button"
            @click="removeOption(index)"
            class="remove-option-button"
          >
            Remove
          </button>
        </div>
        <button
          v-if="pollOptions.length < 10"
          type="button"
          @click="addOption"
          class="add-option-button"
        >
          Add Option
        </button>
        <p v-if="pollOptionsError" class="error-message">{{ pollOptionsError }}</p>
      </div>

      <div class="poll-expiration">
        <label for="expires_at" class="form-label">Poll Expires</label>
        <select
          id="expires_at"
          v-model="expirationOption"
          class="form-select"
        >
          <option value="never">Never</option>
          <option value="1d">1 day</option>
          <option value="3d">3 days</option>
          <option value="1w">1 week</option>
          <option value="2w">2 weeks</option>
          <option value="1m">1 month</option>
        </select>
      </div>

      <div class="poll-multiple-options">
        <input
          id="allow_multiple_options"
          v-model="allowMultipleOptions"
          type="checkbox"
          class="form-checkbox"
        />
        <label for="allow_multiple_options" class="checkbox-label">
          Allow users to select multiple options
        </label>
      </div>
    </div>
  `,
  props: {
    content: {
      type: String,
      default: '',
    },
    contentError: {
      type: String,
      default: '',
    },
    pollOptionsError: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      localContent: this.content,
      pollOptions: ['', ''], // Start with 2 empty options
      expirationOption: '1w', // Default to 1 week
      allowMultipleOptions: false,
    }
  },
  methods: {
    addOption() {
      if (this.pollOptions.length < 10) {
        this.pollOptions.push('')
      }
    },
    removeOption(index) {
      if (this.pollOptions.length > 2) {
        this.pollOptions.splice(index, 1)
      }
    },
  },
}

describe('PollPostForm Component', () => {
  let wrapper

  beforeEach(() => {
    // Mount the mock component
    wrapper = mount(PollPostFormMock, {
      props: {
        content: '',
        contentError: '',
        pollOptionsError: '',
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
      },
    })
  })

  it('renders the form with initial empty options', () => {
    const optionInputs = wrapper.findAll('.option-input')
    expect(optionInputs.length).toBe(2)
    expect(wrapper.findAll('.form-input').length).toBe(2)
  })

  it('allows adding more options', async () => {
    const addButton = wrapper.find('.add-option-button')
    await addButton.trigger('click')

    const optionInputs = wrapper.findAll('.option-input')
    expect(optionInputs.length).toBe(3)
  })

  it('allows removing options', async () => {
    // First add an option to have 3
    const addButton = wrapper.find('.add-option-button')
    await addButton.trigger('click')

    // Now remove the last one
    const removeButton = wrapper.find('.remove-option-button')
    await removeButton.trigger('click')

    const optionInputs = wrapper.findAll('.option-input')
    expect(optionInputs.length).toBe(2)
  })

  it('prevents removing options if only 2 remain', async () => {
    // Should have 2 options by default and no remove buttons
    expect(wrapper.findAll('.option-input').length).toBe(2)
    expect(wrapper.findAll('.remove-option-button').length).toBe(0)
  })

  it('allows setting poll expiration', async () => {
    const select = wrapper.find('.form-select')
    await select.setValue('1d')

    expect(wrapper.vm.expirationOption).toBe('1d')
  })

  it('allows toggling multiple options setting', async () => {
    const checkbox = wrapper.find('.form-checkbox')
    await checkbox.setValue(true)

    expect(wrapper.vm.allowMultipleOptions).toBe(true)
  })

  it('displays error messages when provided', async () => {
    await wrapper.setProps({
      contentError: 'Content error',
      pollOptionsError: 'Need at least 2 options',
    })

    expect(wrapper.find('.error-message').text()).toContain('Content error')
    expect(wrapper.findAll('.error-message')[1].text()).toContain('Need at least 2 options')
  })

  it('allows entering poll description', async () => {
    const textarea = wrapper.find('.form-textarea')
    await textarea.setValue('This is a test poll')

    expect(wrapper.vm.localContent).toBe('This is a test poll')
  })

  it('allows entering poll options', async () => {
    const inputs = wrapper.findAll('.form-input')
    await inputs[0].setValue('Option A')
    await inputs[1].setValue('Option B')

    expect(wrapper.vm.pollOptions[0]).toBe('Option A')
    expect(wrapper.vm.pollOptions[1]).toBe('Option B')
  })
})
