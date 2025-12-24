/**
 * Test to ensure all modals use Teleport to body
 *
 * Modals with `position: fixed` can break when inside elements with `transform`
 * property. Using `<Teleport to="body">` ensures modals always work correctly.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function getAllVueFiles(dir, files = []) {
  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip node_modules and .nuxt
      if (item !== 'node_modules' && item !== '.nuxt' && item !== '.output') {
        getAllVueFiles(fullPath, files)
      }
    } else if (item.endsWith('.vue')) {
      files.push(fullPath)
    }
  }

  return files
}

function findModalsWithoutTeleport(content, filePath) {
  const issues = []
  const lines = content.split('\n')

  // Track Teleport nesting
  let teleportDepth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1

    // Track Teleport opening tags
    if (line.includes('<Teleport') && line.includes('to="body"')) {
      teleportDepth++
    }

    // Track Teleport closing tags
    if (line.includes('</Teleport>')) {
      teleportDepth--
    }

    // Check for modal pattern: fixed inset-0 with v-if (which means it's a conditional modal overlay)
    // We only flag modals that have v-if (they are the root modal element, not inner backdrops)
    if (teleportDepth === 0 && line.includes('v-if=') && line.includes('class=')) {
      // Check if this line or next few lines have fixed inset-0
      const contextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(' ')

      if (
        contextLines.includes('fixed') &&
        contextLines.includes('inset-0') &&
        (contextLines.includes('bg-black') || contextLines.includes('bg-opacity'))
      ) {
        issues.push({
          file: filePath,
          line: lineNumber,
          message: 'Modal with "fixed inset-0" should be wrapped in <Teleport to="body">'
        })
      }
    }
  }

  return issues
}

describe('Modals must use Teleport', () => {
  it('all modals with fixed inset-0 should be wrapped in <Teleport to="body">', () => {
    const componentsDir = join(process.cwd(), 'components')
    const pagesDir = join(process.cwd(), 'pages')

    const allFiles = [
      ...getAllVueFiles(componentsDir),
      ...getAllVueFiles(pagesDir)
    ]

    const allIssues = []

    for (const file of allFiles) {
      const content = readFileSync(file, 'utf-8')
      const issues = findModalsWithoutTeleport(content, file)
      allIssues.push(...issues)
    }

    if (allIssues.length > 0) {
      const errorMessage = allIssues
        .map(issue => `  - ${issue.file}:${issue.line}\n    ${issue.message}`)
        .join('\n')

      expect.fail(
        `Found ${allIssues.length} modal(s) without Teleport:\n${errorMessage}\n\n` +
        'Modals with "position: fixed" can break when inside elements with "transform" property.\n' +
        'Wrap the modal with <Teleport to="body"> to fix this issue.'
      )
    }

    expect(allIssues).toHaveLength(0)
  })
})
