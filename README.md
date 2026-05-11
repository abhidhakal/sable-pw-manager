# Vault — Personal Password Manager

A zero-knowledge personal password vault built with React, TypeScript, and Firebase. Your master password never leaves your browser — all sensitive data is encrypted client-side with AES-256-GCM before being stored in Firestore.

## Security Architecture

- **Key Derivation**: PBKDF2 with 600,000 iterations (SHA-256) derives a 256-bit AES key from your master password
- **Encryption**: AES-256-GCM with a unique 12-byte IV per encryption operation
- **Zero Knowledge**: Firebase only stores ciphertext — no plaintext passwords, usernames, URLs, or notes
- **Master Password**: Never stored, never transmitted — used only locally to derive the encryption key
- **Auto-lock**: Vault locks after 5 minutes of inactivity, wiping all decrypted data from memory
- **Clipboard Security**: Copied passwords are automatically cleared from clipboard after 30 seconds

## Tech Stack

- React 19 + Vite 6
- TypeScript (strict mode)
- Firebase Auth + Cloud Firestore
- Zustand (state management)
- React Hook Form + Zod (form validation)
- React Router v7
- Tailwind CSS v4
- Lucide React (icons)
- Web Crypto API

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd pw-manager
npm install
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password provider
4. Enable **Cloud Firestore** → Start in production mode
5. Register a Web App and copy the config values

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase config:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore security rules

Copy `firestore.rules` to your Firebase project via the Firebase Console or CLI:

```bash
npx firebase-tools deploy --only firestore:rules
```

### 5. Run the app

```bash
npm run dev
```

## App Flow

1. **Sign Up** → Create an account with email/password (Firebase Auth)
2. **Setup Vault** → Create a master password (never stored anywhere)
3. **Unlock** → Enter master password to derive encryption key and decrypt vault items
4. **Use** → Add, view, edit, delete, search, and copy password items
5. **Lock** → Vault locks on inactivity, logout, or manual lock — all decrypted data is wiped

## Project Structure

```
src/
  app/           → Router configuration
  components/
    ui/          → Reusable UI primitives (Button, Input, Card, Modal, etc.)
    layout/      → App shell (Sidebar, Header, AuthLayout)
    auth/        → Auth forms and guards
    vault/       → Vault-specific components
    categories/  → Category components
  features/
    auth/        → Firebase Auth service
    vault/       → Vault Firestore services
    categories/  → Category Firestore service
  lib/
    crypto.ts    → Zero-knowledge encryption module
    clipboard.ts → Clipboard with auto-clear
    firebase.ts  → Firebase initialization
    passwordGenerator.ts → Crypto-random password generator
  stores/        → Zustand state management
  types/         → TypeScript type definitions
  schemas/       → Zod validation schemas
  pages/         → Route page components
```

## License

MIT
