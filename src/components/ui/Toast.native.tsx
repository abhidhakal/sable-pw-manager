import { Alert } from 'react-native'

/** 
 * Mobile implementation of toast using native Alert.
 * This ensures common store logic (vaultStore) doesn't crash on mobile.
 */
export const toast = {
  success: (msg: string) => {
    // success is usually just a silent success or small notification
    // but for now Alert is safest cross-platform.
    console.log('[Sable Mobile] Success:', msg)
    // Alert.alert('Success', msg)
  },
  error: (msg: string) => {
    Alert.alert('Error', msg)
  },
  warning: (msg: string) => {
    Alert.alert('Warning', msg)
  },
  info: (msg: string) => {
    console.log('[Sable Mobile] Info:', msg)
  },
}

export function ToastContainer() {
  return null // No container needed for native alerts
}
