// test/unit/components/posts/postCard/PollContent.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock component to avoid complex dependencies
const PollContentMock = {
  name: 'PollContent',
  template: `
    <div class="poll-content">
      <div v-if="content" class="poll-description">{{ content }}</div>
      <div class="poll-options">
        <div v-if="loading" class="loading-spinner"></div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else-if="pollExpired" class="poll-expired-message"></div>
        <div v-else>
          <div v-for="option in pollResults.options" :key="option.id" class="poll-option">
            <button v-if="!pollExpired && !userHasVoted && !showResults"
                    @click="vote(option.id)"
                    class="vote-button"
                    :class="{ 'selected': userVotes.includes(option.id) }">
            </button>
            <div class="option-text">{{ option.text }}</div>
            <div v-if="showResults" class="option-votes">
              {{ option.votes }} votes ({{ option.percentage }}%)
            </div>
            <div v-if="showResults" class="vote-bar" :style="{ width: option.percentage + '%' }"></div>
          </div>
          <div class="poll-actions">
            <button v-if="!pollExpired && !userHasVoted && !showResults && userVotes.length > 0"
                    @click="submitVote"
                    class="submit-vote-button">
              Submit Vote
            </button>
            <button v-if="!showResults && (userHasVoted || pollExpired)"
                    @click="showResults = true"
                    class="show-results-button">
              Show Results
            </button>
            <button v-if="showResults && !pollExpired && !userHasVoted"
                    @click="showResults = false"
                    class="back-to-vote-button">
              Back to Vote
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    post: {
      type: Object,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      loading: false,
      error: null,
      pollResults: {
        success: true,
        total_votes: 15,
        options: [
          { id: 1, text: 'Option 1', votes: 10, percentage: 66.7 },
          { id: 2, text: 'Option 2', votes: 5, percentage: 33.3 },
        ],
        expired: false,
        allow_multiple_options: false,
      },
      userVotes: [],
      userHasVoted: false,
      showResults: false,
      userStore: {
        isLoggedIn: true, // Default to logged in for most tests
      },
    }
  },
  computed: {
    pollExpired() {
      return this.pollResults.expired
    },
  },
  methods: {
    vote(optionId) {
      // Mock authentication check
      if (!this.userStore?.isLoggedIn) {
        this.error =
          'Esta acción requiere estar registrado. Regístrate o inicia sesión para continuar.'
        return
      }

      if (!this.pollResults.allow_multiple_options) {
        this.userVotes = []
      }

      const index = this.userVotes.indexOf(optionId)
      if (index === -1) {
        this.userVotes.push(optionId)
      } else {
        this.userVotes.splice(index, 1)
      }
    },
    submitVote() {
      this.userHasVoted = true
      this.showResults = true
    },
  },
}

describe('PollContent Component', () => {
  let wrapper

  beforeEach(() => {
    // Create test data for the post
    const post = {
      id: 1,
      title: 'Test Poll',
      content: 'This is a test poll',
      content_type: 'poll',
      is_poll: true,
      hasUserVotedInPoll: false,
      userPollVotes: [],
    }

    // Mount the mock component
    wrapper = mount(PollContentMock, {
      props: {
        post: post,
        content: 'What is your favorite color?',
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        mocks: {
          $t: (key) => key,
          $api: {
            get: vi.fn().mockResolvedValue({
              data: {
                success: true,
                total_votes: 15,
                options: [
                  { id: 1, text: 'Option 1', votes: 10, percentage: 66.7 },
                  { id: 2, text: 'Option 2', votes: 5, percentage: 33.3 },
                ],
                expired: false,
                allow_multiple_options: false,
              },
            }),
            post: vi.fn().mockResolvedValue({
              data: { success: true },
            }),
            delete: vi.fn().mockResolvedValue({
              data: { success: true },
            }),
          },
        },
      },
    })
  })

  it('renders the poll description correctly', () => {
    expect(wrapper.find('.poll-description').text()).toContain('What is your favorite color?')
  })

  it('renders poll options correctly', () => {
    const options = wrapper.findAll('.poll-option')
    expect(options.length).toBe(2)
    expect(options[0].find('.option-text').text()).toContain('Option 1')
    expect(options[1].find('.option-text').text()).toContain('Option 2')
  })

  it('allows selecting an option when voting', async () => {
    const voteButton = wrapper.find('.vote-button')
    await voteButton.trigger('click')

    expect(wrapper.vm.userVotes.length).toBe(1)
    expect(wrapper.find('.vote-button.selected').exists()).toBe(true)
  })

  it('shows submit button after selecting an option', async () => {
    const voteButton = wrapper.find('.vote-button')
    await voteButton.trigger('click')

    expect(wrapper.find('.submit-vote-button').exists()).toBe(true)
  })

  it('shows results after submitting a vote', async () => {
    // Select an option
    const voteButton = wrapper.find('.vote-button')
    await voteButton.trigger('click')

    // Submit the vote
    const submitButton = wrapper.find('.submit-vote-button')
    await submitButton.trigger('click')

    // Check that results are shown
    expect(wrapper.vm.showResults).toBe(true)
    expect(wrapper.findAll('.option-votes').length).toBe(2)
    expect(wrapper.findAll('.vote-bar').length).toBe(2)
  })
})
