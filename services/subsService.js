/**
 * Service for interacting with the subs API
 */
export default {
  /**
   * Get a list of subs
   * @param {Object} api - API instance
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.category - Category (featured, trending, popular)
   * @param {boolean} params.my_subs - Only show subs the user is a member of
   * @param {number} params.per_page - Number of subs per page
   * @param {number} params.page - Page number
   * @returns {Promise<Object>} - List of subs
   */
  async getSubs(api, params = {}) {
    try {
      const response = await api.posts.getPosts({ sub: true, ...params })
      return response.data
    } catch (error) {
      console.error('Error fetching subs', error)
      throw error
    }
  },

  /**
   * Get a specific sub by name or ID
   * @param {Object} api - API instance
   * @param {string|number} nameOrId - Name or ID of the sub
   * @returns {Promise<Object>} - Sub details
   */
  async getSub(api, nameOrId) {
    try {
      const response = await api.get(`/subs/${nameOrId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching sub details', error)
      throw error
    }
  },

  /**
   * Get posts from a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {Object} params - Query parameters
   * @param {string} params.sort - Sort by (new, top, comments)
   * @param {string} params.direction - Sort direction (asc, desc)
   * @param {number} params.per_page - Number of posts per page
   * @param {number} params.page - Page number
   * @returns {Promise<Object>} - List of posts
   */
  async getSubPosts(api, subId, params = {}) {
    try {
      const response = await api.get(`/subs/${subId}/posts`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching sub posts', error)
      throw error
    }
  },

  /**
   * Create a new sub
   * @param {Object} api - API instance
   * @param {Object} data - Sub data
   * @returns {Promise<Object>} - Created sub
   */
  async createSub(api, data) {
    try {
      const response = await api.post('/subs', data)
      return response.data
    } catch (error) {
      console.error('Error creating sub', error)
      throw error
    }
  },

  /**
   * Update a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {Object} data - Sub data
   * @returns {Promise<Object>} - Updated sub
   */
  async updateSub(api, subId, data) {
    try {
      const response = await api.put(`/subs/${subId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating sub', error)
      throw error
    }
  },

  /**
   * Delete a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @returns {Promise<Object>} - Response
   */
  async deleteSub(api, subId) {
    try {
      const response = await api.delete(`/subs/${subId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting sub', error)
      throw error
    }
  },

  /**
   * Join a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {string} message - Optional message for private sub requests
   * @returns {Promise<Object>} - Response
   */
  async joinSub(api, subId, message = '') {
    try {
      const response = await api.post(`/subs/${subId}/join`, { message })
      return response.data
    } catch (error) {
      console.error('Error joining sub', error)
      throw error
    }
  },

  /**
   * Leave a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @returns {Promise<Object>} - Response
   */
  async leaveSub(api, subId) {
    try {
      const response = await api.post(`/subs/${subId}/leave`)
      return response.data
    } catch (error) {
      console.error('Error leaving sub', error)
      throw error
    }
  },

  /**
   * Get rules of a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @returns {Promise<Object>} - List of rules
   */
  async getSubRules(api, subId) {
    try {
      const response = await api.get(`/subs/${subId}/rules`)
      return response.data
    } catch (error) {
      console.error('Error fetching sub rules', error)
      throw error
    }
  },

  /**
   * Create a membership request
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - Created request
   */
  async createMembershipRequest(api, subId, data) {
    try {
      const response = await api.post(`/subs/${subId}/membership-requests`, data)
      return response.data
    } catch (error) {
      console.error('Error creating membership request', error)
      throw error
    }
  },

  /**
   * Get pending posts for moderation
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @returns {Promise<Object>} - List of pending posts
   */
  async getPendingPosts(api, subId) {
    try {
      const response = await api.get(`/subs/${subId}/pending-posts`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending posts', error)
      throw error
    }
  },

  /**
   * Approve a pending post
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {number} postId - ID of the post
   * @returns {Promise<Object>} - Response
   */
  async approvePost(api, subId, postId) {
    try {
      const response = await api.post(`/subs/${subId}/posts/${postId}/approve`)
      return response.data
    } catch (error) {
      console.error('Error approving post', error)
      throw error
    }
  },

  /**
   * Reject a pending post
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {number} postId - ID of the post
   * @returns {Promise<Object>} - Response
   */
  async rejectPost(api, subId, postId) {
    try {
      const response = await api.post(`/subs/${subId}/posts/${postId}/reject`)
      return response.data
    } catch (error) {
      console.error('Error rejecting post', error)
      throw error
    }
  },

  /**
   * Get pending membership requests for a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @returns {Promise<Object>} - List of pending requests
   */
  async getMembershipRequests(api, subId) {
    try {
      const response = await api.get(`/subs/${subId}/membership-requests`)
      return response.data
    } catch (error) {
      console.error('Error fetching membership requests', error)
      throw error
    }
  },

  /**
   * Approve a membership request
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {number} userId - ID of the user
   * @returns {Promise<Object>} - Response
   */
  async approveMembershipRequest(api, subId, userId) {
    try {
      const response = await api.post(`/subs/${subId}/membership-requests/${userId}/approve`)
      return response.data
    } catch (error) {
      console.error('Error approving membership request', error)
      throw error
    }
  },

  /**
   * Reject a membership request
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {number} userId - ID of the user
   * @returns {Promise<Object>} - Response
   */
  async rejectMembershipRequest(api, subId, userId) {
    try {
      const response = await api.post(`/subs/${subId}/membership-requests/${userId}/reject`)
      return response.data
    } catch (error) {
      console.error('Error rejecting membership request', error)
      throw error
    }
  },

  /**
   * Get members of a sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @returns {Promise<Object>} - List of members
   */
  async getMembers(api, subId) {
    try {
      const response = await api.get(`/subs/${subId}/members`)
      return response.data
    } catch (error) {
      console.error('Error fetching members', error)
      throw error
    }
  },

  /**
   * Remove a member from the sub
   * @param {Object} api - API instance
   * @param {number} subId - ID of the sub
   * @param {number} userId - ID of the user to remove
   * @returns {Promise<Object>} - Response
   */
  async removeMember(api, subId, userId) {
    try {
      const response = await api.delete(`/subs/${subId}/members/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error removing member', error)
      throw error
    }
  },
}
