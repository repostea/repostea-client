export default {
  async getUserPosts(api, params = {}) {
    try {
      const userId = api.auth.getUserId()
      if (!userId) throw new Error('User not authenticated')

      const response = await api.posts.getPosts({
        user_id: userId,
        ...params,
      })
      return response.data
    } catch (error) {
      console.error('Error fetching user posts', error)
      throw error
    }
  },

  async updatePost(api, postId, postData) {
    try {
      const data = {}

      // Only include fields that are present in postData
      if (postData.title !== undefined) data.title = postData.title
      if (postData.content !== undefined) data.content = postData.content
      if (postData.body !== undefined && data.content === undefined) data.content = postData.body
      if (postData.url !== undefined) data.url = postData.url
      if (postData.thumbnail_url !== undefined) data.thumbnail_url = postData.thumbnail_url
      if (postData.image !== undefined && data.thumbnail_url === undefined)
        data.thumbnail_url = postData.image
      if (postData.content_type !== undefined) data.content_type = postData.content_type
      if (postData.media_provider !== undefined) data.media_provider = postData.media_provider
      if (postData.status !== undefined) data.status = postData.status
      if (postData.is_anonymous !== undefined) data.is_anonymous = postData.is_anonymous
      if (postData.is_original !== undefined) data.is_original = postData.is_original
      if (postData.is_nsfw !== undefined) data.is_nsfw = postData.is_nsfw
      if (postData.language_code !== undefined) data.language_code = postData.language_code
      if (postData.sub_id !== undefined) data.sub_id = postData.sub_id
      if (postData.should_federate !== undefined) data.should_federate = postData.should_federate

      if (postData.tags && postData.tags.length > 0) {
        data.tag_ids = postData.tags.map((tag) => (typeof tag === 'object' ? tag.id : tag))
      }

      if (postData.tag_ids && postData.tag_ids.length > 0) {
        data.tag_ids = postData.tag_ids
      }

      const response = await api.posts.updatePost(postId, data)
      // El API devuelve {data: {data: post}}, extraemos el post directamente
      return response.data.data || response.data
    } catch (error) {
      console.error('Error updating post', error)
      throw error
    }
  },

  async deletePost(api, postId) {
    try {
      const response = await api.posts.deletePost(postId)
      return response.data
    } catch (error) {
      console.error('Error deleting post', error)
      throw error
    }
  },

  canDeletePost(post) {
    return !post.comment_count || post.comment_count === 0
  },

  isPostOwner(post, userId) {
    return post.user && post.user.id === userId
  },
}
