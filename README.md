<p align="center">
  <img src="public/logo.png" alt="Sable" width="80" height="80" style="border-radius: 16px;" />
</p>

<h1 align="center">Sable Web</h1>

<p align="center">
  <strong>A zero-knowledge password manager that respects your privacy.</strong>
  <br />
  Your master password never leaves your browser. We never see your data.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-green" alt="AES-256-GCM" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase" alt="Firebase" />
</p>

---

## What is Sable?

Sable is a personal password vault with end-to-end encryption. All sensitive data — passwords, usernames, URLs, notes — is encrypted client-side before it ever touches the server. Firebase stores only ciphertext. Even if the database is compromised, your data remains unreadable without your master password.

## Features

🔐 **Zero-Knowledge Encryption** — AES-256-GCM with PBKDF2 key derivation (600K iterations)

🔑 **Password Generator** — Cryptographically random passwords with configurable length and character sets

📂 **Categories** — Organize credentials with custom categories, icons, and colors

🔍 **Instant Search** — Filter by title, username, or URL in real-time

📋 **Secure Clipboard** — Auto-clears copied passwords after 30 seconds

⏱️ **Auto-Lock** — Vault locks after 5 minutes of inactivity, wiping all decrypted data from memory

📥 **CSV Import** — Multi-step import wizard with column mapping and preview

🗑️ **Bulk Operations** — Multi-select and batch delete

⭐ **Favorites** — Pin frequently used credentials to the top

🛡️ **Rate Limiting** — Exponential backoff after failed unlock attempts

## Security Model

| Layer | Implementation |
|-------|---------------|
| Key Derivation | PBKDF2 · 600,000 iterations · SHA-256 |
| Encryption | AES-256-GCM · unique 12-byte IV per operation |
| Storage | Only ciphertext stored in Firestore |
| Master Password | Never stored, never transmitted |
| Session | 5-min inactivity lock · 4-hour max session |
| Clipboard | Auto-clear after 30 seconds |
| Auth | Firebase Auth with sanitized error messages (prevents account enumeration) |

## Tech Stack

- **Framework** — React 19 + TypeScript (strict)
- **Build** — Vite 8
- **Styling** — Tailwind CSS 4 (custom dark theme)
- **State** — Zustand 5
- **Forms** — React Hook Form + Zod
- **Routing** — React Router 7
- **Backend** — Firebase Auth + Cloud Firestore
- **Crypto** — Web Crypto API (native browser)
- **Icons** — Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Auth and Firestore enabled

### Installation

```bash
git clone https://github.com/your-username/sable.git
cd sable/web
npm install
```

### Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Add your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Setup

1. Enable **Authentication** → Email/Password provider
2. Enable **Cloud Firestore** in production mode
3. Deploy security rules:

```bash
npx firebase-tools deploy --only firestore:rules
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## How It Works

```
Sign Up → Setup Master Password → Unlock Vault → Use → Auto-Lock
```

1. **Sign up** with email/password (Firebase Auth)
2. **Create a master password** — a 256-bit AES key is derived via PBKDF2 and held in memory only
3. **Unlock** — enter master password to decrypt your vault
4. **Use** — add, view, edit, delete, search, and copy credentials
5. **Lock** — vault locks on inactivity or manual lock, wiping all decrypted data from memory

## Project Structure

```
src/
├── app/            Router configuration
├── components/
│   ├── ui/         Design system (Button, Input, Card, Modal, Badge, Toast...)
│   ├── layout/     App shell (Sidebar, AppLayout, AuthLayout)
│   ├── auth/       Auth guard and forms
│   ├── vault/      Vault components (list, detail, form, generator, import)
│   └── categories/ Category management
├── features/
│   ├── auth/       Firebase Auth service
│   ├── vault/      Vault + metadata Firestore services
│   └── categories/ Category Firestore service
├── lib/
│   ├── crypto.ts   Zero-knowledge encryption (AES-256-GCM + PBKDF2)
│   ├── clipboard.ts Secure clipboard with auto-clear
│   ├── firebase.ts Firebase initialization
│   ├── passwordGenerator.ts Crypto-random password generation
│   └── csvParser.ts CSV import parsing
├── stores/         Zustand state (authStore, vaultStore)
├── types/          TypeScript definitions
├── schemas/        Zod validation schemas
└── pages/          Route page components
```

## Roadmap

See [`docs/web-upgrade.md`](../docs/web-upgrade.md) for the full upgrade roadmap including:

- Password health dashboard (weak, reused, old, compromised)
- TOTP / 2FA code support
- Browser extension for autofill
- Encrypted export/backup
- Offline PWA support
- Secure sharing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
