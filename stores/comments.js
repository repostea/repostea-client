import { defineStore } from 'pinia'

export const useCommentsStore = defineStore('comments', {
  state: () => ({
    comments: [],
    currentComment: null,
    loading: false,
    error: null,
    meta: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 100,
    },
  }),

  actions: {
    async fetchComments(postId, page = 1, perPage = 100) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.comments.getPostComments(postId, {
          page,
          per_page: perPage,
        })

        this.comments = response.data.data.map((comment) => {
          // Ensure we have a valid ID for the comment
          const commentId = comment.id || comment._id || Date.now()

          // Generate hex_id if not provided by backend
          const hexId = comment.hex_id || commentId.toString(16)

          // Process vote details if needed
          let voteDetails = []
          if (comment.vote_details) {
            // Check if vote_details is an array (new format)
            if (Array.isArray(comment.vote_details)) {
              // Use the array directly
              voteDetails = [...comment.vote_details]
            }
            // Check if it's an object (old format)
            else if (typeof comment.vote_details === 'object') {
              Object.entries(comment.vote_details).forEach(([type, count]) => {
                const voteValue = count > 0 ? 1 : -1
                const absCount = Math.abs(count)

                for (let i = 0; i < absCount; i++) {
                  voteDetails.push({
                    user_id: null,
                    value: voteValue,
                    type: type === 'unspecified' ? null : type,
                  })
                }
              })
            }
          }

          return {
            ...comment,
            id: commentId,
            hex_id: hexId,
            votes: comment.votes || 0,
            userVote: comment.user_vote || null,
            userVoteType: comment.user_vote_type || null,
            voteDetails: voteDetails,
            voteStats: comment.vote_stats || null,
            isAnonymous: comment.is_anonymous || false,
            authorName: comment.author_name || null,
            parentId: comment.parent_id || null,
            children: this._formatReplies(comment.replies || [], comment.vote_stats ? true : false),
          }
        })

        this.comments = this._organizeCommentsHierarchy(this.comments)

        this.meta = {
          currentPage: response.data.meta.current_page,
          lastPage: response.data.meta.last_page,
          total: response.data.meta.total,
          perPage: response.data.meta.per_page,
        }

        return this.comments
      } catch (error) {
        this.error = error.response?.data?.message || 'Error loading comments'
        console.error('Error fetching comments:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    async createComment(postId, commentData) {
      this.loading = true
      this.error = null

      try {
        const { $api } = useNuxtApp()
        // Convert camelCase to snake_case for backend
        const backendData = { ...commentData }
        if (backendData.authorName !== undefined) {
          backendData.author_name = backendData.authorName
          delete backendData.authorName
        }
        if (backendData.parentId !== undefined) {
          backendData.parent_id = backendData.parentId
          delete backendData.parentId
        }
        const response = await $api.comments.createComment(postId, backendData)

        // Backend returns data in response.data.data (Laravel resource wrapper)
        const responseData = response.data.data || response.data

        // Ensure we have a valid ID for the new comment
        const newCommentId = responseData.id || responseData._id || Date.now()

        // Generate hex_id if not provided by backend
        const hexId = responseData.hex_id || newCommentId.toString(16)

        // Create the new comment object with the same formatting as fetchComments
        // IMPORTANT: Keep ALL fields from responseData using spread first
        const newComment = {
          ...responseData, // This includes user, created_at, etc.
          id: newCommentId,
          hex_id: hexId,
          votes: responseData.votes || 0,
          userVote: responseData.user_vote || null,
          userVoteType: responseData.user_vote_type || null,
          voteDetails: responseData.vote_details || [],
          voteStats: responseData.vote_stats || null,
          isAnonymous: responseData.is_anonymous || false,
          is_anonymous: responseData.is_anonymous || false, // Keep snake_case too
          authorName: responseData.author_name || null,
          author_name: responseData.author_name || null, // Keep snake_case too
          parentId: responseData.parent_id || null,
          parent_id: responseData.parent_id || null, // Keep snake_case too
          children: [],
          // Ensure user object exists
          user: responseData.user || null,
          // Ensure created_at exists
          created_at: responseData.created_at || new Date().toISOString(),
        }

        // Add the comment to the appropriate place in the tree
        if (newComment.parentId || newComment.parent_id) {
          // It's a reply - find the parent
          const parentId = newComment.parentId || newComment.parent_id

          const addReplyToParent = (comments, targetParentId, reply) => {
            for (const comment of comments) {
              if (comment.id === targetParentId || comment.id == targetParentId) {
                // Add to children
                if (!comment.children) comment.children = []
                comment.children.push(reply) // Add reply at the end (chronological order)
                return true
              }

              // Check in children recursively
              if (comment.children && addReplyToParent(comment.children, targetParentId, reply)) {
                return true
              }
            }
            return false
          }

          // Deep copy to force reactivity
          const commentsCopy = JSON.parse(JSON.stringify(this.comments))
          const added = addReplyToParent(commentsCopy, parentId, newComment)

          if (added) {
            this.comments = [...commentsCopy]
          } else {
            this.comments = [newComment, ...this.comments]
          }
        } else {
          this.comments = [...this.comments, newComment]
        }

        return newComment
      } catch (error) {
        this.error = error.response?.data?.message || 'Error submitting comment'
        throw error
      } finally {
        this.loading = false
      }
    },

    async voteComment(id, value, voteType = null) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const fingerprint = await this.generateFingerprint()
        const response = await $api.comments.voteComment(id, value, voteType, fingerprint)

        const commentsCopy = JSON.parse(JSON.stringify(this.comments))

        const updateCommentVote = (comments, commentId, responseData) => {
          for (const comment of comments) {
            if (comment.id === commentId) {
              // Update the total vote count
              comment.votes = responseData.stats?.votes_count || responseData.votes
              comment.userVote = responseData.user_vote
              comment.userVoteType = responseData.user_vote_type || voteType

              // Update detailed vote statistics - use server data directly
              if (responseData.stats) {
                comment.voteStats = responseData.stats
              }

              if (responseData.vote_details) {
                comment.voteDetails = responseData.vote_details
              }

              return true
            }

            if (comment.children && comment.children.length > 0) {
              if (updateCommentVote(comment.children, commentId, responseData)) {
                return true
              }
            }
          }
          return false
        }

        // Handle normalized ApiResponse format: { success, message, data }
        const responseData = response.data.data || response.data
        updateCommentVote(commentsCopy, id, responseData)
        this.comments = [...commentsCopy]

        return responseData
      } catch (error) {
        this.error = error.response?.data?.message || 'Error voting comment'
        console.error('Error voting comment:', error)
        throw error
      }
    },

    async unvoteComment(id) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const fingerprint = await this.generateFingerprint()
        const response = await $api.comments.unvoteComment(id, fingerprint)

        const commentsCopy = JSON.parse(JSON.stringify(this.comments))

        const updateCommentUnvote = (comments, commentId, responseData) => {
          for (const comment of comments) {
            if (comment.id === commentId) {
              // Update vote count
              comment.votes = responseData.stats?.votes_count || responseData.votes

              // Reset user's vote
              comment.userVote = null
              comment.userVoteType = null

              // Update statistics - use server data directly
              if (responseData.stats) {
                comment.voteStats = responseData.stats
              }

              return true
            }

            if (comment.children && comment.children.length > 0) {
              if (updateCommentUnvote(comment.children, commentId, responseData)) {
                return true
              }
            }
          }
          return false
        }

        // Handle normalized ApiResponse format: { success, message, data }
        const responseData = response.data.data || response.data
        updateCommentUnvote(commentsCopy, id, responseData)
        this.comments = [...commentsCopy]

        return responseData
      } catch (error) {
        this.error = error.response?.data?.message || 'Error unvoting comment'
        console.error('Error unvoting comment:', error)
        throw error
      }
    },

    findCommentById(commentId) {
      const findCommentInArray = (commentsArray) => {
        for (const comment of commentsArray) {
          if (comment.id === commentId) {
            return comment
          }

          if (comment.children && comment.children.length > 0) {
            const found = findCommentInArray(comment.children)
            if (found) return found
          }
        }
        return null
      }

      return findCommentInArray(this.comments)
    },

    // Add a comment directly to the store (for realtime updates)
    addComment(comment) {
      if (this.findCommentById(comment.id)) {
        return
      }

      // Format the comment to match the expected structure
      const formattedComment = {
        ...comment,
        id: comment.id,
        hex_id: comment.hex_id || comment.id.toString(16),
        votes: comment.votes || comment.votes_count || 0,
        userVote: comment.user_vote || null,
        userVoteType: comment.user_vote_type || null,
        voteDetails: comment.vote_details || [],
        voteStats: comment.vote_stats || null,
        isAnonymous: comment.is_anonymous || false,
        authorName: comment.author_name || null,
        parentId: comment.parent_id || null,
        children: comment.children || [],
      }

      // Add to the appropriate place in the tree
      if (formattedComment.parentId || formattedComment.parent_id) {
        // It's a reply - find the parent
        const parentId = formattedComment.parentId || formattedComment.parent_id

        // Deep copy to force reactivity
        const commentsCopy = JSON.parse(JSON.stringify(this.comments))
        const added = this._addReplyToComment(commentsCopy, parentId, formattedComment)

        if (added) {
          this.comments = [...commentsCopy]
        } else {
          this.comments = [...this.comments, formattedComment]
        }
      } else {
        this.comments = [...this.comments, formattedComment]
      }
    },

    async getCommentVoteStats(id) {
      this.error = null

      try {
        const { $api } = useNuxtApp()
        const response = await $api.comments.getCommentVoteStats(id)

        const updateStats = (comments, commentId, stats) => {
          for (let i = 0; i < comments.length; i++) {
            const comment = comments[i]

            if (comment.id === commentId) {
              comments[i] = {
                ...comment,
                voteStats: stats,
                votes: stats.votes_count,
              }
              return true
            }

            if (comment.children && comment.children.length > 0) {
              if (updateStats(comment.children, commentId, stats)) {
                return true
              }
            }
          }
          return false
        }

        const commentsCopy = JSON.parse(JSON.stringify(this.comments))
        const updated = updateStats(commentsCopy, id, response.data)

        if (updated) {
          this.comments = [...commentsCopy]
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error getting vote stats'
        console.error('Error getting vote stats:', error)
        throw error
      }
    },

    _formatReplies(replies, hasVoteStats = false) {
      if (!replies || !replies.length) return []

      return replies.map((reply) => {
        // Process vote details if needed
        let voteDetails = []
        if (reply.vote_details) {
          // Check if vote_details is an array (new format)
          if (Array.isArray(reply.vote_details)) {
            // Use the array directly
            voteDetails = [...reply.vote_details]
          }
          // Check if it's an object (old format)
          else if (typeof reply.vote_details === 'object') {
            Object.entries(reply.vote_details).forEach(([type, count]) => {
              const voteValue = count > 0 ? 1 : -1
              const absCount = Math.abs(count)

              for (let i = 0; i < absCount; i++) {
                voteDetails.push({
                  user_id: null,
                  value: voteValue,
                  type: type === 'unspecified' ? null : type,
                })
              }
            })
          }
        }

        // Ensure we have a valid ID for the reply
        const replyId = reply.id || reply._id || Date.now()

        // Generate hex_id if not provided by backend
        const hexId = reply.hex_id || replyId.toString(16)

        // Add essential properties that might be missing in the backend data
        // but are expected by the components

        // We need to transform snake_case properties from the backend to camelCase for the frontend
        // and provide default values for properties that might be missing or conditionally included
        // in the backend response.
        //
        // We keep the original properties from the reply object using the spread operator
        // because there might be other properties that are used elsewhere but not explicitly
        // listed here.
        return {
          ...reply,
          id: replyId,
          hex_id: hexId,
          votes: reply.votes || 0,
          userVote: reply.user_vote || null,
          userVoteType: reply.user_vote_type || null,
          voteDetails: voteDetails,
          voteStats: reply.vote_stats || null,
          isAnonymous: reply.is_anonymous || false,
          authorName: reply.author_name || null,
          parentId: reply.parent_id || null,
          children: this._formatReplies(reply.replies || [], hasVoteStats),
        }
      })
    },

    _organizeCommentsHierarchy(comments) {
      if (comments.every((c) => !c.parentId)) {
        return comments
      }

      const commentMap = {}
      const rootComments = []

      comments.forEach((comment) => {
        commentMap[comment.id] = { ...comment, children: comment.children || [] }
      })

      comments.forEach((comment) => {
        if (comment.parentId) {
          if (commentMap[comment.parentId]) {
            commentMap[comment.parentId].children.push(commentMap[comment.id])
          } else {
            rootComments.push(commentMap[comment.id])
          }
        } else {
          rootComments.push(commentMap[comment.id])
        }
      })

      return rootComments
    },

    _addReplyToComment(comments, parentId, reply) {
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i]

        if (comment.id === parentId) {
          if (!comment.children) {
            comment.children = []
          }
          comment.children.unshift(reply) // Add reply at the beginning
          return true
        }

        if (comment.children && comment.children.length > 0) {
          if (this._addReplyToComment(comment.children, parentId, reply)) {
            return true
          }
        }
      }

      return false
    },

    async generateFingerprint() {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = '#069'
        ctx.fillText('Browser fingerprint', 2, 15)
        const canvasData = canvas.toDataURL()

        return btoa(
          JSON.stringify({
            canvas: canvasData.slice(-50),
            screen: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
          })
        )
      } catch {
        // If canvas fingerprinting fails, fall back to a simpler fingerprint
        return btoa(navigator.userAgent + window.screen.width + window.screen.height)
      }
    },
  },
})
