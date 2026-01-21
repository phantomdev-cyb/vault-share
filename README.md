# VaultShare: Zero-Knowledge Secure File Exchange

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Security](https://img.shields.io/badge/Security-AES--256--GCM-green) ![Architecture](https://img.shields.io/badge/Architecture-Zero--Knowledge-orange)

## 🛡️ Project Overview
VaultShare is a military-grade file sharing application designed around a **Zero-Knowledge Architecture**. Unlike traditional cloud storage, the server (Supabase) never sees the unencrypted file or the decryption key.

All cryptographic operations occur **Client-Side** using the Web Crypto API. This ensures that even in the event of a total database compromise, user data remains mathematically inaccessible without the specific user-held password.

## 🔐 Security Architecture

### The "Trust No One" Protocol
1.  **Client-Side Encryption:** Files are encrypted in the browser using **AES-GCM (256-bit)** before network transmission.
2.  **Key Derivation:** Encryption keys are derived from user passwords using **PBKDF2** (SHA-256) with 100,000 iterations and a unique 16-byte random salt.
3.  **Encrypted Transport:** The server receives only a binary blob containing `[ Salt + IV + Ciphertext ]`.
4.  **Row Level Security (RLS):** Database policies strictly isolate metadata, ensuring users can only query their own records.

### Tech Stack
* **Core:** React 18 (Vite) + TypeScript
* **Styling:** Tailwind CSS (Dark Mode System)
* **Backend:** Supabase (PostgreSQL + Auth)
* **Cryptography:** Native Web Crypto API (No external crypto dependencies)

## 🚀 How to Run Locally

### Prerequisites
* Node.js v18+
* Supabase Account

### Installation
1.  Clone the repository:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/vault-share.git](https://github.com/YOUR_USERNAME/vault-share.git)
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    Create a `.env` file and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_ANON_KEY=your_key
    ```
4.  Start the Development Server:
    ```bash
    npm run dev
    ```

## ⚖️ Disclaimer
This project implements high-standard cryptographic primitives but is intended for educational and portfolio demonstration purposes.

---
*Architected by [Phantomdev]*