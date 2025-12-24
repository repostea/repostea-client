export const truncateText = (str, length = 30) => {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export const stripMarkdown = (content) => {
  if (!content) return ''
  
  return content
    .replace(/#{1,6}\s+/g, '')           // headers
    .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
    .replace(/\*(.+?)\*/g, '$1')         // italic
    .replace(/~~(.+?)~~/g, '$1')         // strikethrough
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // links
    .replace(/!\[.*?\]\(.+?\)/g, '')     // images
    .replace(/`(.+?)`/g, '$1')           // inline code
    .replace(/```[\s\S]+?```/g, '')      // code blocks
    .replace(/>\s+.+/g, '')              // blockquotes
    .replace(/^[\s]*[-*+]\s+/gm, '')     // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '')       // ordered lists
    .replace(/\n+/g, ' ')                // newlines to spaces
    .trim()
}

export const createExcerpt = (content, length = 300) => {
  const plainText = stripMarkdown(content)
  return truncateText(plainText, length)
}

// Renders only basic formatting: bold, italic, strikethrough
// Cleans everything else (links, images, lists, etc.)
export const renderBasicMarkdown = (content, length = 300) => {
  if (!content) return ''

  let text = content
    // Clean complex elements first
    .replace(/#{1,6}\s+/g, '')           // headers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // links -> solo texto
    .replace(/!\[.*?\]\(.+?\)/g, '')     // images
    .replace(/```[\s\S]+?```/g, '')      // code blocks
    .replace(/>\s+.+/g, '')              // blockquotes
    .replace(/^[\s]*[-*+]\s+/gm, '')     // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '')       // ordered lists
    .replace(/\n+/g, ' ')                // newlines to spaces
    .trim()

  // Truncate before converting to HTML
  if (text.length > length) {
    text = text.slice(0, length) + '...'
  }

  // Convert basic formatting to HTML
  // Order is important: most specific first
  text = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // bold
    .replace(/\*(.+?)\*/g, '<em>$1</em>')              // italic
    .replace(/~~(.+?)~~/g, '<del>$1</del>')            // strikethrough
    .replace(/`(.+?)`/g, '<code>$1</code>')            // inline code

  return text
}