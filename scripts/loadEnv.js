const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')

  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local not found at ${envPath}`)
  }

  const content = fs.readFileSync(envPath, 'utf8')

  for (const line of content.split('\n')) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.substring(0, eqIndex).trim()
    let value = trimmed.substring(eqIndex + 1).trim()

    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // Remove inline comments (but not URLs)
    if (!value.includes('http')) {
      const commentIndex = value.indexOf('#')
      if (commentIndex > 0) {
        value = value.substring(0, commentIndex).trim()
      }
    }

    process.env[key] = value
  }
}

loadEnv()
