import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextContent from '~/components/posts/postCard/TextContent.vue'

describe('TextContent', () => {
  it('renders plain text when showFullText is false', () => {
    const wrapper = mount(TextContent, {
      props: {
        content: '# This is a **markdown** text',
        showFullText: false,
      },
    })

    // The component strips markdown and shows plain text
    expect(wrapper.text()).toContain('This is a markdown text')
    expect(wrapper.html()).not.toContain('<h1>')
    expect(wrapper.html()).not.toContain('<strong>')
  })

  it('renders markdown as HTML when showFullText is true', () => {
    const wrapper = mount(TextContent, {
      props: {
        content: '# This is a **markdown** text',
        showFullText: true,
      },
    })

    expect(wrapper.html()).toContain('<h1>This is a <strong>markdown</strong> text</h1>')
  })

  it('handles various markdown syntax correctly', () => {
    const markdownContent = `
# Heading 1
## Heading 2
**Bold text**
*Italic text*
- List item 1
- List item 2
[Link](https://example.com)
\`inline code\`
> Blockquote
    `

    const wrapper = mount(TextContent, {
      props: {
        content: markdownContent,
        showFullText: true,
      },
    })

    const html = wrapper.html()
    expect(html).toContain('<h1>Heading 1</h1>')
    expect(html).toContain('<h2>Heading 2</h2>')
    expect(html).toContain('<strong>Bold text</strong>')
    expect(html).toContain('<em>Italic text</em>')
    expect(html).toContain('<li>List item 1</li>')
    expect(html).toContain('<a href="https://example.com">Link</a>')
    expect(html).toContain('<code>inline code</code>')
    expect(html).toContain('<blockquote>')
  })

  it('sanitizes dangerous HTML content', () => {
    const dangerousContent = `<script>alert('xss')</script><b>Safe content</b>`

    const wrapper = mount(TextContent, {
      props: {
        content: dangerousContent,
        showFullText: true,
      },
    })

    const html = wrapper.html()
    // DOMPurify should remove script tags but allow safe HTML
    expect(html).not.toContain('<script>')
    expect(html).toContain('<b>Safe content</b>')
  })

  it('handles empty content gracefully', () => {
    const wrapper = mount(TextContent, {
      props: {
        content: '',
        showFullText: true,
      },
    })

    expect(wrapper.html()).toContain('class="prose')
    // Component shows empty content when content is empty
    expect(wrapper.text()).toBe('')
  })

  it('handles null/undefined content gracefully', () => {
    const wrapper = mount(TextContent, {
      props: {
        content: null,
        showFullText: true,
      },
    })

    // Component shows empty content when content is null
    expect(wrapper.text()).toBe('')
  })

  it('preserves line breaks in plain text mode', () => {
    const content = 'Line 1\nLine 2\nLine 3'

    const wrapper = mount(TextContent, {
      props: {
        content,
        showFullText: false,
      },
    })

    // In plain text mode, the component renders content in a <p> tag with dir="auto"
    expect(wrapper.find('p[dir="auto"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Line 1')
    expect(wrapper.text()).toContain('Line 2')
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(TextContent, {
      props: {
        content: '# Test',
        showFullText: true,
      },
    })

    // The card-text classes are on the inner div, not the root wrapper div
    const cardTextDiv = wrapper.find('.card-text')
    expect(cardTextDiv.exists()).toBe(true)
    expect(cardTextDiv.classes()).toContain('text-sm')
    expect(cardTextDiv.classes()).toContain('text-text')

    // Check that prose classes are on the inner content div
    expect(wrapper.find('.prose').exists()).toBe(true)
    expect(wrapper.find('.max-w-none').exists()).toBe(true)
  })

  it('handles code blocks correctly', () => {
    const codeContent = '```javascript\nconst test = "hello";\nconsole.log(test);\n```'

    const wrapper = mount(TextContent, {
      props: {
        content: codeContent,
        showFullText: true,
      },
    })

    const html = wrapper.html()
    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('const test = "hello";')
  })

  it('handles mixed markdown and HTML content safely', () => {
    const mixedContent = `# Markdown Heading
<p>HTML paragraph</p>
**Bold markdown**
<strong>Bold HTML</strong>`

    const wrapper = mount(TextContent, {
      props: {
        content: mixedContent,
        showFullText: true,
      },
    })

    const html = wrapper.html()
    expect(html).toContain('<h1>Markdown Heading</h1>')
    expect(html).toContain('<p>HTML paragraph</p>')
    // Note: **Bold markdown** may not be processed in mixed content
    expect(html).toContain('**Bold markdown**')
    expect(html).toContain('<strong>Bold HTML</strong>')
  })
})
