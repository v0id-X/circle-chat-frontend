# Circle Chat - Frontend Application

This repository contains the React frontend for Circle Chat, a secure, real-time messaging platform. It is engineered to provide a seamless and highly responsive user experience, featuring client-side end-to-end encryption (E2EE), optimized infinite scrolling, and instant WebSocket synchronization.

## Core Features

* **End-to-End Encryption (E2EE):** Implements robust, zero-knowledge client-side encryption powered by `libsodium-wrappers`. Messages and media are encrypted locally using industry-standard cryptographic primitives before transmission, ensuring only the intended recipient can decrypt the payload.
* **Real-Time Communication:** Powered by Socket.io for instantaneous message delivery, live typing indicators, and persistent online/offline user state tracking.
* **Cursor-Based Pagination:** Utilizes efficient cursor-based data fetching for smooth, glitch-free infinite scrolling through chat histories without rendering duplicates or dropping frames.
* **Secure Media Sharing:** Client-side processing and transmission of image buffers, securely interfacing with the backend for cloud storage.
* **Responsive UI:** Styled with Tailwind CSS to ensure a highly responsive, modern interface across all device form factors.

## Technology Stack

* **Build Tool:** Vite
* **Framework:** React
* **Cryptography:** libsodium-wrappers
* **Styling:** Tailwind CSS
* **Real-Time Client:** Socket.io-client
* **State Management & Routing:** React Context API and Axios
* **Hosting / Deployment:** Vercel