# Circle Chat - Frontend Application

This repository contains the React frontend for Circle Chat, a secure, real-time messaging platform. It is engineered to provide a seamless and highly responsive user experience, featuring a zero-knowledge cross-platform encryption architecture, optimized infinite scrolling, and instant WebSocket synchronization.

## Core Features

* **Zero-Knowledge Architecture (E2EE):** Implements robust client-side encryption powered by `libsodium-wrappers-sumo`. Messages and media are encrypted locally using `crypto_box_easy` (X25519-XSalsa20-Poly1305) before transmission, ensuring the server acts strictly as a blind relay and cannot read message payloads.
* **Master-Key Wrapping (Cross-Platform E2EE):** Solves the multi-device E2EE problem. The user's asymmetric private key is wrapped symmetrically on the client side using a key derived from their plain-text password via the **Argon2id** algorithm (`crypto_pwhash`). The raw private key never leaves the device, allowing secure cross-platform logins without losing chat history.
* **Ephemeral Session Security:** Raw private keys are unwrapped strictly into volatile `sessionStorage`. Keys are instantly destroyed upon tab closure or logout, preventing unauthorized local access and physical device vulnerabilities.
* **Real-Time Communication:** Powered by Socket.io for instantaneous message delivery, live typing indicators, and persistent online/offline user state tracking.
* **Cursor-Based Pagination:** Utilizes efficient cursor-based data fetching for smooth, glitch-free infinite scrolling through chat histories without rendering duplicates or dropping frames.
* **Secure Media Sharing:** Client-side processing and Base64 encryption of image buffers before securely interfacing with the backend for cloud storage.
* **Responsive UI:** Styled with Tailwind CSS to ensure a highly responsive, modern interface across all device form factors.

## Technology Stack

* **Build Tool:** Vite
* **Framework:** React
* **Cryptography:** libsodium-wrappers-sumo (Argon2id, SecretBox, Box)
* **Styling:** Tailwind CSS
* **Real-Time Client:** Socket.io-client
* **State Management & Routing:** React Context API and Axios
* **Hosting / Deployment:** Vercel