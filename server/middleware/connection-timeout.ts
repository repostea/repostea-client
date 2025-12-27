import { defineEventHandler } from 'h3'

/**
 * Server middleware to handle connection timeouts
 * Sets appropriate timeout values and ensures long-running requests
 * don't lead to connection aborts
 */
export default defineEventHandler((event) => {
  // Set a reasonable timeout for the server request (2 minutes)
  const TIMEOUT_MS = 120000

  // Access the underlying Node.js request and response objects
  const req = event.node.req
  const res = event.node.res

  // Set timeout on the server response
  res.setTimeout(TIMEOUT_MS, () => {
    // Only end the response if it hasn't been sent yet
    if (!res.writableEnded) {
      res.statusCode = 503
      res.end('Service Unavailable: Request timeout')
    }
  })

  // Set keep-alive headers to maintain the connection
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Keep-Alive', 'timeout=120')

  // Handle client disconnection gracefully
  req.on('close', () => {
    // Client disconnected - no action needed as client is already gone
  })
})
