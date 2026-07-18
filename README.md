<div align="center">
  <img src="./frontend/public/logo.png" alt="SnapQuest Logo" width="200" height="200" />

  # 📸 SnapQuest

  **AI-Powered Decentralized Scavenger Hunt on GenLayer**

  [![GenLayer](https://img.shields.io/badge/Network-GenLayer_Bradbury-blueviolet.svg)](#)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](#)
  [![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue.svg)](#)
  [![Smart Contract](https://img.shields.io/badge/Contract-Intelligent%20Python-yellow.svg)](#)

  <p align="center">
    SnapQuest transforms the world into a massive, verifiable scavenger hunt using <b>GenLayer's Intelligent Contracts</b>. Complete real-world visual objectives, let AI-powered validators judge your photos in consensus, and earn decentralized bounties automatically.
  </p>
</div>

---

## 🌟 The Vision

SnapQuest pushes the boundaries of what's possible on-chain by leveraging GenLayer's GenVM and non-deterministic equivalence principle. 

Instead of traditional oracles or manual human verification, **SnapQuest uses Large Language Models as decentralized validators**. When a hunter submits a photo to claim a bounty, GenLayer's leader and validator nodes pull the image, interpret it against the quest's prompt, and reach consensus on whether the objective was met—executing payouts autonomously if the photo is compliant!

## ✨ Key Features

- **🤖 Intelligent Validation:** Uses GenLayer's LLM consensus to analyze images and determine if a photo matches the quest prompt (e.g., "Find a yellow fire hydrant").
- **💰 Autonomous Escrow & Bounties:** Quest masters deposit bounties in GenLayer's native token. Approved hunters are paid instantly via GenVM's native transfer wrapper.
- **⚡ Non-Deterministic Execution:** Powered by `gl.nondet.exec_prompt` and strictly validated by leader-validator equivalence logic.
- **🛡️ Robust Error Handling:** Graceful failure modes handling LLM hallucinations, external transient network issues, and consensus disagreements.
- **🎨 Modern Frontend:** Sleek, high-performance Vite + React application providing a frictionless Web3 experience.

---

## 🏗 Architecture & Equivalence Principle

SnapQuest relies on **GenLayer's Equivalence Principle**. Here's how a submission flows through the protocol:

1. **Submission:** A hunter submits a photo URL for an active Quest via the `submit_photo` method.
2. **Leader Execution (`leader_fn`):** The GenLayer Leader node fetches the image and feeds it to an LLM with a strict evaluation prompt. The LLM returns a JSON verdict (`{"compliant": true/false}`).
3. **Validator Verification (`validator_fn`):** The network validators repeat the process independently. The verification logic checks if the validators' `compliant` booleans match the leader's boolean.
4. **Consensus & Payout:** If consensus is achieved and the photo is compliant, the escrow is unlocked and funds are transferred instantly.

---

## 🏆 GenLayer Points Portal Submission

This project is prepared for the **GenLayer Points Portal** and adheres strictly to the official submission guidelines.

### Category: Projects & Milestones (20-4000 pts)
**Project Title:** SnapQuest MVP  
**Description:** A complete, full-stack decentralized scavenger hunt demonstrating real-world utility of GenLayer's Intelligent Contracts and visual AI validation.

- **Live App (Vercel):** `[Insert Vercel URL Here]`
- **Explorer/Studio Link:** [View on GenLayer Studio](https://studio.genlayer.com/contracts?import-contract=[Insert Deployed Address Here])
- **Source Code:** [GitHub Repository](https://github.com/Dark-Brain07/snapquest)

### Category: Tools & Infrastructure (50-2500 pts)
#### SnapQuest Intelligent Contract
**Title:** SnapQuest Validator Contract  
**Description:** A native Python Intelligent Contract showcasing complex image ingestion, non-deterministic evaluation handling, and automated fund distribution on GenLayer.

- **Contract Address:** `[Insert Deployed Address Here]`
- **Explorer/Studio Link:** [View on GenLayer Studio](https://studio.genlayer.com/contracts?import-contract=[Insert Deployed Address Here])
- **Source Code:** [`contracts/snapquest.py`](./contracts/snapquest.py)

*(Note: Replace the placeholders above once deployed to Bradbury Testnet).*

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.11+ (for local contract testing)
- A GenLayer Web3 Wallet extension

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/SnapQuest.git
   cd SnapQuest
   ```

2. **Setup the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The app will launch at `http://localhost:5173`.

### Smart Contract Deployment
To deploy the `snapquest.py` contract to the GenLayer Bradbury testnet, use the [GenLayer Studio](https://studio.genlayer.com) or the GenLayer CLI. 
Ensure you pass the required `gl.Contract` constructor arguments if prompted, and verify the `Depends` string on line 1 is intact.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <i>Built with ❤️ for the GenLayer Ecosystem</i>
</div>
