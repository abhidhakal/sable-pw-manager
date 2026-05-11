export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
}

/**
 * Generate a cryptographically random password.
 * Uses crypto.getRandomValues() for true randomness.
 */
export function generateRandomPassword(options: PasswordOptions): string {
  let charset = ''

  if (options.uppercase) charset += CHAR_SETS.uppercase
  if (options.lowercase) charset += CHAR_SETS.lowercase
  if (options.numbers) charset += CHAR_SETS.numbers
  if (options.symbols) charset += CHAR_SETS.symbols

  // Fallback to all characters if nothing is selected
  if (charset.length === 0) {
    charset = CHAR_SETS.lowercase + CHAR_SETS.uppercase + CHAR_SETS.numbers
  }

  const length = Math.max(4, Math.min(128, options.length))
  const randomValues = crypto.getRandomValues(new Uint32Array(length))
  let password = ''

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }

  // Ensure at least one character from each selected set
  const required: string[] = []
  if (options.uppercase) required.push(getRandomChar(CHAR_SETS.uppercase))
  if (options.lowercase) required.push(getRandomChar(CHAR_SETS.lowercase))
  if (options.numbers) required.push(getRandomChar(CHAR_SETS.numbers))
  if (options.symbols) required.push(getRandomChar(CHAR_SETS.symbols))

  // Replace first N characters with required chars, then shuffle
  const chars = password.split('')
  for (let i = 0; i < required.length && i < chars.length; i++) {
    chars[i] = required[i]
  }

  // Fisher-Yates shuffle using crypto random
  const shuffleRandom = crypto.getRandomValues(new Uint32Array(chars.length))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffleRandom[i] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

function getRandomChar(charset: string): string {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]
  return charset[randomValue % charset.length]
}

/** Calculate password strength score (0-4) */
export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 14) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  score = Math.min(4, score)

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = ['#D96C5F', '#D96C5F', '#D6A84F', '#7FAE82', '#7FAE82']

  return { score, label: labels[score], color: colors[score] }
}
