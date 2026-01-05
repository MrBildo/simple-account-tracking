# Personal Account Manager (local-only)

Simple local CRUD tool to track accounts (credit cards, services, streaming, etc.) with a clean UI.

## Features

- **Accounts**: list + add/edit/delete
- **Overview**: totals + quick estimates (min payment + payoff estimate)
- **Passwords**: encrypted locally in-browser using Web Crypto (AES-GCM)
- **Local data**: stored in browser Local Storage as JSON
- **Import/export**:
  - Export JSON (includes encrypted passwords)
  - Export CSV (optionally include decrypted passwords if the vault is unlocked)
  - Import JSON (replaces current local data)

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Vault password / encryption note

This is “rudimentary local encryption” meant to prevent casual exposure in exported JSON.
If someone has access to your machine and browser profile, they may still be able to exfiltrate data—especially if you unlock the vault.

