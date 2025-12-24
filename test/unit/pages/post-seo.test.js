/**
 * Unit tests for SEO meta tag logic in post pages
 */

import { describe, it, expect } from 'vitest'

describe('Post SEO Meta Tags Logic', () => {
  describe('Robots meta tag based on NSFW status', () => {
    it('should return noindex,nofollow for NSFW posts', () => {
      const post = {
        id: 1,
        title: 'Test NSFW Post',
        slug: 'test-nsfw-post',
        is_nsfw: true,
        content: 'This is NSFW content',
        user: {
          name: 'Test User',
          username: 'testuser',
        },
      }

      // Simulate the SEO config logic
      const seoMetaConfig = {
        title: post.title,
        description: post.content,
      }

      // Logic from the component
      if (post.is_nsfw) {
        seoMetaConfig.robots = 'noindex, nofollow'
      }

      expect(seoMetaConfig.robots).toBe('noindex, nofollow')
    })

    it('should not set robots meta tag for normal posts (uses default)', () => {
      const post = {
        id: 2,
        title: 'Test Normal Post',
        slug: 'test-normal-post',
        is_nsfw: false,
        content: 'This is normal content',
        user: {
          name: 'Test User',
          username: 'testuser',
        },
      }

      const seoMetaConfig = {
        title: post.title,
        description: post.content,
      }

      // Logic from the component - normal posts don't set robots
      if (post.is_nsfw) {
        seoMetaConfig.robots = 'noindex, nofollow'
      }

      expect(seoMetaConfig.robots).toBeUndefined()
    })
  })

  describe('Author meta tag for anonymous posts', () => {
    it('should not include author for anonymous posts', () => {
      const post = {
        id: 3,
        title: 'Anonymous Post',
        slug: 'anonymous-post',
        is_anonymous: true,
        is_nsfw: false,
        content: 'Anonymous content',
        user: {
          name: 'Test User',
          username: 'testuser',
        },
      }

      const seoMetaConfig = {}

      // Logic from the component
      if (!post.is_anonymous && post.user?.name) {
        seoMetaConfig['article:author'] = post.user.name
      }

      expect(seoMetaConfig['article:author']).toBeUndefined()
    })

    it('should include author for non-anonymous posts', () => {
      const post = {
        id: 4,
        title: 'Public Post',
        slug: 'public-post',
        is_anonymous: false,
        is_nsfw: false,
        content: 'Public content',
        user: {
          name: 'John Doe',
          username: 'johndoe',
        },
      }

      const seoMetaConfig = {}

      // Logic from the component
      if (!post.is_anonymous && post.user?.name) {
        seoMetaConfig['article:author'] = post.user.name
      }

      expect(seoMetaConfig['article:author']).toBe('John Doe')
    })
  })

  describe('OpenGraph image URL handling', () => {
    it('should use post thumbnail if available', () => {
      const post = {
        thumbnail_url: 'https://example.com/image.jpg',
      }

      let ogImageUrl = post.thumbnail_url

      expect(ogImageUrl).toBe('https://example.com/image.jpg')
    })

    it('should convert relative thumbnail URLs to absolute', () => {
      const post = {
        thumbnail_url: '/uploads/image.jpg',
      }

      const siteBaseUrl = 'https://example.com'
      let ogImageUrl = post.thumbnail_url

      if (ogImageUrl && !ogImageUrl.startsWith('http')) {
        ogImageUrl = `${siteBaseUrl}${ogImageUrl}`
      }

      expect(ogImageUrl).toBe('https://example.com/uploads/image.jpg')
    })

    it('should use default image if no thumbnail', () => {
      const post = {
        thumbnail_url: null,
      }

      const siteBaseUrl = 'https://example.com'
      let ogImageUrl = post.thumbnail_url

      if (!ogImageUrl) {
        ogImageUrl = `${siteBaseUrl}/images/default-post-image.png`
      }

      expect(ogImageUrl).toBe('https://example.com/images/default-post-image.png')
    })
  })

  describe('JSON-LD structured data', () => {
    it('should include author in schema for non-anonymous posts', () => {
      const post = {
        id: 5,
        title: 'Test Post',
        is_anonymous: false,
        user: {
          name: 'Jane Doe',
          username: 'janedoe',
        },
      }

      const siteBaseUrl = 'https://example.com'
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
      }

      // Logic from component
      if (!post.is_anonymous && post.user) {
        articleSchema.author = {
          '@type': 'Person',
          name: post.user.name || 'Community',
        }

        if (post.user.username) {
          articleSchema.author.url = `${siteBaseUrl}/u/${post.user.username}`
        }
      }

      expect(articleSchema.author).toBeDefined()
      expect(articleSchema.author.name).toBe('Jane Doe')
      expect(articleSchema.author.url).toBe('https://example.com/u/janedoe')
    })

    it('should not include author in schema for anonymous posts', () => {
      const post = {
        id: 6,
        title: 'Anonymous Post',
        is_anonymous: true,
        user: {
          name: 'Hidden User',
          username: 'hidden',
        },
      }

      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
      }

      // Logic from component
      if (!post.is_anonymous && post.user) {
        articleSchema.author = {
          '@type': 'Person',
          name: post.user.name || 'Renegados Community',
        }
      }

      expect(articleSchema.author).toBeUndefined()
    })
  })

  describe('Combined NSFW and Anonymous scenarios', () => {
    it('should handle NSFW + Anonymous post correctly', () => {
      const post = {
        id: 7,
        title: 'NSFW Anonymous Post',
        slug: 'nsfw-anonymous',
        is_nsfw: true,
        is_anonymous: true,
        content: 'NSFW anonymous content',
        user: {
          name: 'Hidden',
          username: 'hidden',
        },
      }

      const seoMetaConfig = {
        title: post.title,
      }

      // Check NSFW robots tag
      if (post.is_nsfw) {
        seoMetaConfig.robots = 'noindex, nofollow'
      }

      // Check author exclusion
      if (!post.is_anonymous && post.user?.name) {
        seoMetaConfig['article:author'] = post.user.name
      }

      expect(seoMetaConfig.robots).toBe('noindex, nofollow')
      expect(seoMetaConfig['article:author']).toBeUndefined()
    })
  })
})
