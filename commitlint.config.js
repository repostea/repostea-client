export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Very relaxed rules for agile development
    'type-enum': [0], // Disable type validation
    'subject-case': [0], // Allow any case format
    'subject-full-stop': [0], // Don't require final period
    'subject-empty': [0], // Allow empty subjects
    'subject-max-length': [0], // No length limit
    'subject-min-length': [0], // No minimum length
    'header-max-length': [0], // No header limit
    'body-leading-blank': [0], // Optional body
    'body-max-line-length': [0], // No line length limit in body
    'footer-leading-blank': [0], // Optional footer
    'scope-empty': [0], // Optional scope
    'scope-case': [0], // Any scope format
    'type-empty': [0], // Optional type
    'type-case': [0], // Any type format
  },
}
