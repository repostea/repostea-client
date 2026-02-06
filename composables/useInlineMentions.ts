import { ref, nextTick, type Ref } from 'vue'
import { useNuxtApp } from '#app'

interface User {
  id: number
  username: string
  avatar?: string
  is_guest?: boolean
}

interface Comment {
  id: number
  user?: User
  replies?: Comment[]
}

export function useInlineMentions(
  content: Ref<string>,
  textareaRef: Ref<HTMLTextAreaElement | null>,
  postAuthor?: Ref<User | null>,
  availableComments?: Ref<Comment[]>
) {
  const { $api } = useNuxtApp()

  const searchedUsers = ref<User[]>([])
  const isSearchingUsers = ref(false)
  const showInlineMentions = ref(false)
  const mentionStartPos = ref(0)
  const mentionDropdownLeft = ref(0)
  const mentionDropdownTop = ref(0)
  const selectedUserIndex = ref(0)

  function getCursorCoordinates(textarea: HTMLTextAreaElement, position: number) {
    const div = document.createElement('div')
    const style = window.getComputedStyle(textarea)

    const properties = [
      'boxSizing',
      'width',
      'height',
      'overflowX',
      'overflowY',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'fontSizeAdjust',
      'lineHeight',
      'fontFamily',
      'textAlign',
      'textTransform',
      'textIndent',
      'textDecoration',
      'letterSpacing',
      'wordSpacing',
      'tabSize',
      'whiteSpace',
      'wordBreak',
      'wordWrap',
    ]

    properties.forEach((prop) => {
      ;(div.style as any)[prop] = (style as any)[prop]
    })

    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'
    div.style.wordWrap = 'break-word'

    document.body.appendChild(div)

    const textBeforeCursor = textarea.value.substring(0, position)
    div.textContent = textBeforeCursor

    const span = document.createElement('span')
    span.textContent = textarea.value.substring(position) || '.'
    div.appendChild(span)

    const coordinates = {
      top: span.offsetTop,
      left: span.offsetLeft,
      height: parseInt(style.lineHeight),
    }

    document.body.removeChild(div)

    return coordinates
  }

  function getRelevantUsersFromComments(): User[] {
    const uniqueUsers = new Map<number, User>()

    if (postAuthor?.value && !postAuthor.value.is_guest) {
      uniqueUsers.set(postAuthor.value.id, {
        id: postAuthor.value.id,
        username: postAuthor.value.username,
        avatar: postAuthor.value.avatar,
      })
    }

    if (availableComments?.value && availableComments.value.length > 0) {
      function extractUsers(comments: Comment[]) {
        for (const comment of comments) {
          if (comment.user && !comment.user.is_guest) {
            uniqueUsers.set(comment.user.id, {
              id: comment.user.id,
              username: comment.user.username,
              avatar: comment.user.avatar,
            })
          }
          if (comment.replies && comment.replies.length > 0) {
            extractUsers(comment.replies)
          }
        }
      }
      extractUsers(availableComments.value)
    }

    return Array.from(uniqueUsers.values()).slice(0, 10)
  }

  async function handleTextareaInput(textarea: HTMLTextAreaElement) {
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.value.substring(0, cursorPos)
    const match = textBeforeCursor.match(/@(\w*)$/)

    if (match) {
      const searchQuery = match[1]
      const atPosition = cursorPos - match[0].length
      mentionStartPos.value = atPosition + 1

      const coords = getCursorCoordinates(textarea, atPosition)
      mentionDropdownLeft.value = coords.left
      mentionDropdownTop.value = coords.top + coords.height + 5

      if (searchQuery.length >= 1) {
        try {
          isSearchingUsers.value = true
          const response = await $api.users.searchUsers(searchQuery)
          searchedUsers.value = response.data?.data || response.data || []
          showInlineMentions.value = searchedUsers.value.length > 0
          selectedUserIndex.value = 0
        } catch (error) {
          console.error('Error searching for users:', error)
          searchedUsers.value = []
          showInlineMentions.value = false
        } finally {
          isSearchingUsers.value = false
        }
      } else {
        const relevantUsers = getRelevantUsersFromComments()
        if (relevantUsers.length > 0) {
          searchedUsers.value = relevantUsers
          showInlineMentions.value = true
          selectedUserIndex.value = 0
        } else {
          showInlineMentions.value = false
        }
      }
    } else {
      showInlineMentions.value = false
    }
  }

  function handleKeydown(event: KeyboardEvent): boolean {
    if (!showInlineMentions.value) return false

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedUserIndex.value = Math.min(
        selectedUserIndex.value + 1,
        searchedUsers.value.length - 1
      )
      return true
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedUserIndex.value = Math.max(selectedUserIndex.value - 1, 0)
      return true
    } else if (event.key === 'Enter' && searchedUsers.value.length > 0) {
      event.preventDefault()
      selectUser(searchedUsers.value[selectedUserIndex.value])
      return true
    } else if (event.key === 'Escape') {
      event.preventDefault()
      showInlineMentions.value = false
      return true
    }
    return false
  }

  function selectUser(user: User) {
    const textarea = textareaRef.value
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.value.substring(0, mentionStartPos.value)
    const textAfterCursor = content.value.substring(cursorPos)

    content.value = textBeforeCursor + user.username + ' ' + textAfterCursor

    nextTick(() => {
      const newCursorPos = textBeforeCursor.length + user.username.length + 1
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })

    showInlineMentions.value = false
    searchedUsers.value = []
  }

  return {
    searchedUsers,
    isSearchingUsers,
    showInlineMentions,
    mentionDropdownLeft,
    mentionDropdownTop,
    selectedUserIndex,
    handleTextareaInput,
    handleKeydown,
    selectUser,
  }
}
