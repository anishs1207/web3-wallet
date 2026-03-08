# 🌌 Vaulta: Next-Gen Web3 Web Wallet

Vaulta is a high-performance, aesthetically pleasing, and secure web-based wallet for **Solana** and **Ethereum**. Built with **Next.js 15**, **React 19**, and a premium design system, Vaulta provides a seamless experience for managing cross-chain assets directly in your browser.

![Vaulta Banner](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop)

## ✨ Features

- **🛡️ Secure Seed Phrase Management**: Generate a 12 or 24-word BIP39 mnemonic. All keys are derived locally and never leave your device.
- **⛓️ Cross-Chain Support**: Manage both **Solana (◎)** and **Ethereum (Ξ)** accounts within a single interface.
- **📥 Multiple Import Options**:
  - Import existing wallets via **Seed Phrase**.
  - Import individual accounts using **Private Keys** (Base58 for Solana, Hex for Ethereum).
- **🔄 Jupiter Swap Integration**: Swap Solana tokens instantly with the best prices via the Jupiter Aggregator (Supports Mainnet tokens like USDC, USDT, JUP, etc.).
- **📡 Multi-Network Support**:
  - **Solana**: Mainnet-Beta, Devnet, Testnet.
  - **Ethereum**: Mainnet, Sepolia (Testnet).
- **💎 Premium UI/UX**:
  - **Glassmorphism Design**: Beautiful, frosted-glass components with subtle gradients.
  - **Dark Mode Optimized**: Built for creators and developers who prefer dark, sleek interfaces.
  - **Real-time Balances**: Fast, accurate balance fetching for native assets and popular SPL/ERC-20 tokens.
- **🚀 One-Click Transactions**: Easily send assets to any address with real-time validation.

## 🛠️ Technology Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Web3 Libraries**:
  - [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
  - [ethers.js v6](https://docs.ethers.org/v6/)
  - [@solana/spl-token](https://github.com/solana-labs/solana-program-library)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Security**: [tweetnacl](https://github.com/dchest/tweetnacl-js), [bip39](https://github.com/bitcoinjs/bip39), [ed25519-hd-key](https://github.com/albeu569/ed25519-hd-key)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- NPM or PNPM

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anishs1207/web-wallet.git
   cd web-wallet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

- **Creating a Wallet**: Click "New Wallet", save your 12-word recovery phrase safely, and verify it to access your derived accounts.
- **Importing a Wallet**: Select "Import Wallet" and paste your recovery phrase.
- **Swapping Tokens**: If you are on Solana Mainnet, click the "Swap" button on any account to use the Jupiter interface.
- **Switching Networks**: Use the network selector at the header of each chain section to toggle between Mainnet and Testnets.

## 🗺️ Roadmap

- [ ] Support for **Polygon** and **Base** networks.
- [ ] **Transaction History** (Activity Log) for each account.
- [ ] **NFT Gallery** to view collectibles.
- [ ] Browser extension version.
- [ ] Hardware wallet (Ledger/Trezor) integration.

## ⚠️ Safety Warning

Vaulta is a client-side wallet. Your private keys and seed phrases are stored **only** in your browser's local storage. If you clear your browser data or lose your seed phrase, you will lose access to your funds. **Always backup your seed phrase!**

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Anish](https://github.com/anishs1207)