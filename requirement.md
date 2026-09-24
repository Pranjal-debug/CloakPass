# Midnight Lunar Challenge — Requirements & Submission Matrix

This document provides a comprehensive, structured breakdown of all requirements, evaluation criteria, and submission checklists for **Level 1 (New Moon)**, **Level 2 (Waxing Crescent)**, and **Level 3 (First Quarter)**, mapped directly to the **CloakPass** implementation.

---

## 📊 Master Verification & Status Matrix

| Level & Phase | Mission / Focus | Passing Requirements | Commit Target | CloakPass Status | Key Verification Artifacts |
|---|---|---|:---:|:---:|---|
| **🌑 Level 1: New Moon** | Toolchain, Compact contract, Preprod deployment, initial idea | 6 criteria | 5+ | ✅ **COMPLETE** | `contract/cloakpass.compact`, `contract/managed/cloakpass/`, Preprod address, `README.md` |
| **🌒 Level 2: Waxing Crescent** | Frontend UI wiring, Lace wallet on Preprod, observable privacy | 5 criteria | 8+ | ✅ **COMPLETE** | `frontend/`, Lace v4 connector, ZK gate redemption, live interactive UI |
| **🌓 Level 3: First Quarter** | Production-grade dApp, tests, CI/CD, Problem Statement selection | 5 criteria | 10+ | ✅ **COMPLETE** | `.github/workflows/ci.yml`, 15/15 tests, vault export/import, `SUBMISSION_THE_TURN.md` |

---

## 🌑 Level 1 — New Moon: Setup & First Contract

> *"In the new moon, the sky holds the moon entirely in shadow — present, but unseen. That is where you begin. You stand up your toolchain, write your first contract in Compact, and deploy to Preview/Preprod. Nothing is public yet, and nothing needs to be."*

### 🎯 Mission
Toolchain set up, first Compact contract written and deployed on Preview/Preprod, plus an initial idea.

### 📚 Learning Objectives
- Installing the Midnight toolchain (Compact compiler, proof server, Node 22, Docker).
- Writing a Compact contract with public ledger state and private witnesses.
- Using `disclose()` deliberately to control what becomes public.
- Compiling to ZK circuits and deploying to Preprod.

### ✅ Requirements to Pass
1. **Toolchain Installed & Compiles**:
   - Compact compiler installed (`v0.34.0`).
   - Contract compiles cleanly via `compact compile`.
2. **Passing Test Suite**:
   - Automated unit tests validating contract compilation, circuit generation, and witness isolation.
3. **Managed Directory Present**:
   - Generated `contract/managed/` containing both ZKIR circuits (`.zkir`) and proving/verifying cryptographic keys (`.prover`, `.verifier`).
4. **Deployed to Preprod/Preview with Visible Contract Address**:
   - Contract deployed on-chain with verifiable contract address recorded.
5. **Initial Product Idea**:
   - One short paragraph drafted in `README.md` explaining the product value proposition.
6. **Commit Milestone**:
   - Minimum **5 meaningful commits** in git history.

### 📋 Level 1 Submission Checklist
- [x] **Public GitHub Repository with README.md**: [https://github.com/Pranjal-debug/CloakPass](https://github.com/Pranjal-debug/CloakPass)
- [x] **Setup Instructions**: Step-by-step local instructions in `README.md` (`npm install`, `npm run compile`, `npm test`, `npm run deploy:preprod`).
- [x] **Screenshot: Compile Output**: Visual log showing circuits synthesized (`issue_pass`, `redeem_pass`) saved in `docs/screenshots/compile_output.svg`.
- [x] **Screenshot: Deployed Contract Address**: Visual log showing deployment receipt (`027f4783f43e98f143856aee0a308b95a6471bda6892012d5b84933be7ba5c0a2b`) in `docs/screenshots/deployment_output.svg`.
- [x] **Public State vs. Private Witness Section**: Detailed architectural breakdown in `README.md` explaining off-chain witnesses vs. on-chain ledger variables and the deliberate role of `disclose()`.
- [x] **Initial Product Idea Paragraph**: Documented under `## 🚀 Initial Product Idea` in `README.md`.
- [x] **Git History**: 5+ Conventional Commits.

---

## 🌒 Level 2 — Waxing Crescent: Frontend Integration

> *"The first thread of light. You wire your contract to a real frontend and bring Lace onto Preprod. For the first time your work has a face the world can glimpse — a thin, deliberate crescent. Most of it still rests in shadow; you have simply chosen to reveal the edge."*

### 🎯 Mission
Contract wired to a frontend UI, with Lace connected on Preprod.

### 📚 Learning Objectives
- Midnight.js SDK and the DApp connector API (v4).
- Connecting and disconnecting the Lace wallet on Preprod.
- Calling a circuit from the frontend and handling the cryptographic result.
- Managing local private state and deploying to Preprod.

### ✅ Requirements to Pass
1. **Lace Wallet Connect / Disconnect**:
   - Implemented via `window.midnight.mnLace` with CAIP-372 multi-wallet discovery and Preprod simulation fallback.
2. **Circuit Called Successfully from Frontend**:
   - Pass minting (`issue_pass`) and Zero-Knowledge Gate redemption (`redeem_pass`) triggered directly from user UI interactions.
3. **Observable Privacy Behavior (Proven Without Being Shown)**:
   - Prover verifies Merkle membership of a pass without revealing leaf index, secret key, or wallet address.
   - Prover discloses only a domain-separated single-use nullifier `SHA256("cloakpass:nullify:" || secret)` to prevent double-spending while leaving identity 100% unlinked.
4. **Verifiable Preprod Contract Address**:
   - Contract live at `027f4783f43e98f143856aee0a308b95a6471bda6892012d5b84933be7ba5c0a2b`.
5. **Commit Milestone**:
   - Minimum **8 meaningful commits** in git history.

### 📋 Level 2 Submission Checklist
- [x] **Public GitHub Repository with README**: Updated repository with frontend architecture.
- [x] **Live Demo Link**: Local dev server (`http://localhost:5173/`) and deployable static bundle in `dist/frontend/`.
- [x] **Deployed Preprod Contract Address**: `027f4783f43e98f143856aee0a308b95a6471bda6892012d5b84933be7ba5c0a2b` (verifiable on Midnight Preprod indexer and explorer).
- [x] **Demo Evidence / Screenshots**: Visual record of wallet connection, pass issuance, and zero-knowledge gate admission verification.
- [x] **README Documenting Privacy Claim**: Documented under `## 🔒 Midnight Architectural Model` and `frontend/src/style.css` Nouva privacy grid.
- [x] **Git History**: 8+ Conventional Commits.

---

## 🌓 Level 3 — First Quarter: Production-Grade dApp & The Turn

> *"Half light, half shadow — the truest picture of Midnight itself. Your dApp hardens into something production-grade: tests, CI/CD, a polished build. Exactly half the moon is lit, and exactly as much of your app is disclosed as you decide."*

### 🎯 Mission
A polished, production-grade dApp with tests and CI/CD, plus a chosen problem from the provided list.

### 📚 Learning Objectives
- Designing a dApp around selective disclosure.
- Writing comprehensive contract and application test suites.
- Setting up automated CI/CD pipelines (compilation, typechecking, tests on every push).
- Scoping a formal product proposal against official Midnight problem tracks.

### 💡 Provided Idea List & CloakPass Selection
Official choices from the Midnight specification:
1. *Private Voting* — anonymous ballots with publicly verifiable tallies.
2. *Age / Eligibility Gate* — prove a threshold without revealing the underlying value.
3. *Private Allowlist Access* — prove membership without revealing identity.
4. **Confidential Credentials** — **prove a credential is valid without disclosing it (SELECTED CATEGORY)**.
5. *Sealed-Bid Auction* — private bids, verifiable winner.
6. *Private Payroll / Splits* — distribute funds without exposing amounts.
7. *Anonymous Feedback / Survey* — verifiable participation, private responses.

> **Selected Category**: **Identity/credentials** (`Confidential Credentials` & `Private Allowlist Access`).  
> **Formulation**: *Privacy-Preserving Access Control & Sybil-Resistant Verification (Proof of Entitlement Without Identity Exposure)*.

### ✅ Requirements to Pass
1. **Fully Functional dApp Meaningfully Using Midnight's Privacy Model**:
   - Dual-state execution with off-chain witness derivation and on-chain Merkle root validation.
   - Production hardening: JSON credential vault export/import, one-click key clipboard copier, gate file ingestion, and Preprod Activity Log with live receipt proofs.
2. **Minimum 3 Tests Passing**:
   - **15 tests passing** in Vitest (`src/test/cloakpass.test.ts` [10 tests] + `src/test/integration.test.ts` [5 tests]).
   - **11 tests passing** in zero-dependency runner (`scripts/test-runner.mjs`).
3. **CI/CD Pipeline Running**:
   - GitHub Actions workflow [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) validating:
     - Proving keys & ZKIR artifacts presence
     - TypeScript typecheck (`npm run typecheck`)
     - Core test runner (`npm test`)
     - Vitest suite (`npx vitest run`)
     - Production frontend bundle build (`npm run build:frontend`)
4. **Approved Idea Submitted from the Provided Idea List**:
   - Comprehensive submission specification file: [`SUBMISSION_THE_TURN.md`](file:///SUBMISSION_THE_TURN.md).
5. **Commit Milestone**:
   - Minimum **10 meaningful commits** in git history (Currently 10+ conventional commits).

### 📋 Level 3 Submission Checklist
- [x] **Public GitHub Repository with Complete README**: Up-to-date documentation with badges, phases table, and structure.
- [x] **Live Demo Link / Production Bundle**: Production bundle compiled in `dist/frontend/`; runs on any static host or locally via `npm run preview:frontend`.
- [x] **Screenshot / Output: Test Suite (3+ Passing)**: 15/15 tests passing across lifecycle and unit suites.
- [x] **CI/CD Badge / Workflow File**: `.github/workflows/ci.yml` present with GitHub Actions badge in `README.md`.
- [x] **Demo Recording / Walkthrough**: Documented walkthrough and screenshot flows in `walkthrough.md`.
- [x] **README "Privacy Model" Section (What an Observer Learns vs. Cannot Learn)**:
  - **What an observer CAN learn**: Total passes issued, total passes redeemed, public Merkle tree root, disclosed single-use nullifiers, timestamp, and block height.
  - **What an observer CANNOT learn**: Holder identity, wallet address, leaf position/index in tree, private ticket secret, blinding salt, or correlation between a minted pass and a redeemed pass.
- [x] **Product Proposal Submitted for Approval**: Formal specification documented in `SUBMISSION_THE_TURN.md`.
- [x] **Git History**: 10+ Conventional Commits.

---

## 📈 Git Commit History Audit (10+ Commits)

```
1e68948 docs(submission): add official Idea Submission specification for The Turn and update status
e1bc6e5 feat(frontend): add credential vault export/import, receipts activity log, and production hardening
e88c1c2 test(integration): add E2E cryptographic lifecycle and nullifier constraint tests
fcf693f ci: add GitHub Actions workflow for typecheck, tests, and build
78ac990 style(frontend): redesign UI with clean, light, Nouva-inspired dark aesthetic
03c773b feat(frontend): integrate CloakPass with Lace DApp Connector and interactive ZK UI
53896bf docs(readme): add product idea, public vs private state documentation, and deployment guides
a7bfdd1 test(contract): add comprehensive test suite for CloakPass circuits and state transitions
47a11de build(compiler): compile compact contract and generate managed ZK circuits and keys
2627e78 feat(contract): implement CloakPass compact contract with public state and private witnesses
d426305 chore(setup): initialize project structure, toolchain wrapper and configs
```

---

## 🚀 Quick Commands for Evaluation

```bash
# 1. Typecheck the entire project
npm run typecheck

# 2. Run the full test suites (Vitest + Integration tests)
npx vitest run

# 3. Run standalone core test runner
npm test

# 4. Build frontend production bundle
npm run build:frontend

# 5. Launch local development server
npm run dev
```
