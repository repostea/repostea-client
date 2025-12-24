import { defineEventHandler } from 'h3'

/**
 * Server middleware to handle connection timeouts
 * This middleware sets appropriate timeout values and ensures
 * that long-running requests don't lead to connection aborts
 */
export default defineEventHandler((event) => {
  // Set a reasonable timeout for the server request (2 minutes)
  const TIMEOUT_MS = 120000

  // Access the underlying Node.js request and response objects
  const req = event.node.req
  const res = event.node.res

  // Set timeout on the server response
  res.setTimeout(TIMEOUT_MS, () => {
    console.warn('Request timeout reached for:', req.url)

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
    if (!req.complete && !res.writableEnded) {
      console.warn('Client disconnected before response was complete:', req.url)
      // We don't need to end the response here as the client is already gone
    }
  })
})
