import { FUN_ADJECTIVES, FUN_NOUNS } from './funWords'

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

export type PasswordMode = 'random' | 'fun'

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 11,
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

function getRandomItem<T>(list: readonly T[]): T {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]
  return list[randomValue % list.length]
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Words are stored lowercase, so casing is derived from both toggles:
 * both on => Title Case, uppercase only => FULL CAPS, lowercase only (or
 * neither) => lowercase as-is.
 */
function applyCase(word: string, options: PasswordOptions): string {
  if (options.uppercase && options.lowercase) return capitalize(word)
  if (options.uppercase && !options.lowercase) return word.toUpperCase()
  return word
}

/**
 * Generate a memorable "fun" password: adjective + noun, with casing,
 * a digit suffix, and a separator driven by the same options used for
 * random mode (uppercase/lowercase => casing, numbers => digit suffix,
 * symbols => separator character). The arrangement of word order and
 * where the digits/separator land is itself randomized, so it doesn't
 * always read as the same "word-word#digits" template.
 */
export function generateFunPassword(options: PasswordOptions): string {
  const adjective = applyCase(getRandomItem(FUN_ADJECTIVES), options)
  const noun = applyCase(getRandomItem(FUN_NOUNS), options)

  const words = [adjective, noun]
  if (getRandomChar('01') === '1') words.reverse()
  const [w1, w2] = words

  const separator = options.symbols ? getRandomChar(CHAR_SETS.symbols) : ''

  let digits = ''
  if (options.numbers) {
    const digitCount = Math.max(2, Math.min(8, options.length))
    const randomValues = crypto.getRandomValues(new Uint32Array(digitCount))
    for (let i = 0; i < digitCount; i++) {
      digits += CHAR_SETS.numbers[randomValues[i] % CHAR_SETS.numbers.length]
    }
  }

  if (!digits) return `${w1}${separator}${w2}`

  const layouts = [
    () => `${w1}${separator}${w2}${digits}`,
    () => `${digits}${separator}${w1}${w2}`,
    () => `${w1}${digits}${separator}${w2}`,
    () => `${w1}${separator}${digits}${separator}${w2}`,
    () => `${w1}${separator}${w2}${separator}${digits}`,
  ]

  return getRandomItem(layouts)()
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
