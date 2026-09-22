import './style.css';
import { laceConnector, type WalletAccount } from './services/lace';
import { contractService, type PassRecord, type RedemptionReceipt } from './services/contract';

let activeAccount: WalletAccount | null = null;
let currentTab: 'issue' | 'redeem' | 'passes' = 'issue';

// --- UI Element Selectors ---
const walletBtn = document.getElementById('wallet-connect-btn') as HTMLButtonElement;
const walletStatusText = document.getElementById('wallet-status-text') as HTMLSpanElement;
const walletAddressPill = document.getElementById('wallet-address-pill') as HTMLDivElement;

const statIssued = document.getElementById('stat-issued') as HTMLDivElement;
const statRedeemed = document.getElementById('stat-redeemed') as HTMLDivElement;
const statCommitments = document.getElementById('stat-commitments') as HTMLDivElement;
const statContract = document.getElementById('stat-contract') as HTMLAnchorElement;

const issueForm = document.getElementById('issue-form') as HTMLFormElement;
const issueBtn = document.getElementById('issue-submit-btn') as HTMLButtonElement;
const issueResultBox = document.getElementById('issue-result-box') as HTMLDivElement;
const issuePlaceholder = document.getElementById('issue-placeholder-box') as HTMLDivElement;

const redeemForm = document.getElementById('redeem-form') as HTMLFormElement;
const redeemBtn = document.getElementById('redeem-submit-btn') as HTMLButtonElement;
const redeemSecretInput = document.getElementById('redeem-secret') as HTMLInputElement;
const redeemSaltInput = document.getElementById('redeem-salt') as HTMLInputElement;

const quickSelectContainer = document.getElementById('quick-select-passes') as HTMLDivElement;
const passesListContainer = document.getElementById('all-passes-list') as HTMLDivElement;

const toastContainer = document.getElementById('toast-container') as HTMLDivElement;

// --- Helper Functions ---
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function updateStatsUI() {
  const state = contractService.getContractState();
  if (statIssued) statIssued.textContent = state.totalIssued.toString();
  if (statRedeemed) statRedeemed.textContent = state.totalRedeemed.toString();
  if (statCommitments) statCommitments.textContent = state.commitmentsCount.toString();
  if (statContract) {
    statContract.textContent = `${state.contractAddress.slice(0, 10)}...${state.contractAddress.slice(-8)}`;
    statContract.href = contractService.explorerUrl;
  }
}

function renderPassList() {
  const passes = contractService.getAllPasses();
  if (!passesListContainer) return;

  if (passes.length === 0) {
    passesListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 48px 0; font-size: 14px;">No access passes issued yet. Mint your first pass above!</div>`;
    return;
  }

  passesListContainer.innerHTML = passes.map(pass => `
    <div class="ticket-clean">
      <div class="ticket-top">
        <div>
          <span class="ticket-code">${pass.id}</span>
          <h3 class="ticket-name">${pass.title}</h3>
          <p class="ticket-holder">Holder: ${pass.holderName}</p>
        </div>
        <span class="ticket-pill ${pass.isRedeemed ? 'pill-rose' : 'pill-green'}">
          ${pass.isRedeemed ? 'Redeemed / Spent' : 'Active Pass'}
        </span>
      </div>

      <div class="ticket-data-grid">
        <div class="data-item">
          <span class="data-key">Merkle Leaf (Commitment):</span>
          <span class="data-val">0x${pass.commitment.slice(0, 18)}...</span>
        </div>
        <div class="data-item">
          <span class="data-key">Private Witness Secret:</span>
          <span class="data-val" style="color: #c084fc;">0x${pass.secret.slice(0, 18)}... (Shielded)</span>
        </div>
        <div class="data-item">
          <span class="data-key">Minted Timestamp:</span>
          <span class="data-val">${new Date(pass.issuedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        ${!pass.isRedeemed ? `
          <button type="button" class="action-btn btn-ghost btn-block auto-fill-btn" data-secret="${pass.secret}" data-salt="${pass.salt}">
            ⚡ Verify at Zero-Knowledge Gate
          </button>
        ` : `
          <button type="button" class="action-btn btn-ghost btn-block" disabled style="opacity: 0.5;">
            ✓ Nullified on Ledger
          </button>
        `}
      </div>
    </div>
  `).join('');

  // Attach quick-fill events
  document.querySelectorAll('.auto-fill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const secret = target.dataset.secret || '';
      const salt = target.dataset.salt || '';
      switchTab('redeem');
      if (redeemSecretInput) redeemSecretInput.value = secret;
      if (redeemSaltInput) redeemSaltInput.value = salt;
      showToast('Loaded pass credentials into Gate!');
    });
  });
}

function renderQuickSelect() {
  const passes = contractService.getAllPasses().filter(p => !p.isRedeemed);
  if (!quickSelectContainer) return;

  if (passes.length === 0) {
    quickSelectContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-dim);">No active passes available. Issue one first!</span>`;
    return;
  }

  quickSelectContainer.innerHTML = `
    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Select an active pass to load credentials:</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${passes.map(p => `
        <button type="button" class="action-btn btn-ghost quick-pass-pill" data-secret="${p.secret}" data-salt="${p.salt}" style="font-size: 12px; padding: 6px 14px;">
          🎟️ ${p.id} (${p.holderName})
        </button>
      `).join('')}
    </div>
  `;

  document.querySelectorAll('.quick-pass-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      if (redeemSecretInput) redeemSecretInput.value = target.dataset.secret || '';
      if (redeemSaltInput) redeemSaltInput.value = target.dataset.salt || '';
    });
  });
}

function switchTab(tab: 'issue' | 'redeem' | 'passes') {
  currentTab = tab;
  document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(c => c.classList.remove('active'));

  const activeBtn = document.getElementById(`tab-btn-${tab}`);
  const activeContent = document.getElementById(`tab-content-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');

  if (tab === 'passes') renderPassList();
  if (tab === 'redeem') renderQuickSelect();
}

// --- Wallet Connect Event Handler ---
async function handleWalletConnect() {
  if (activeAccount) {
    // Disconnect
    activeAccount = null;
    walletStatusText.textContent = 'Connect Lace Wallet';
    walletAddressPill.style.display = 'none';
    walletBtn.classList.remove('btn-ghost');
    walletBtn.classList.add('btn-white');
    showToast('Wallet disconnected.');
    return;
  }

  walletBtn.disabled = true;
  walletStatusText.textContent = 'Connecting...';

  try {
    if (laceConnector.isInstalled()) {
      activeAccount = await laceConnector.connect('preprod');
      showToast(`Connected Lace wallet on Preprod!`);
    } else {
      console.log('Lace extension not detected. Connecting simulated client...');
      activeAccount = await laceConnector.connectSimulation('preprod');
      showToast('Connected in Preprod Simulation Mode (Lace API v4)!');
    }

    walletStatusText.textContent = activeAccount.name;
    walletAddressPill.textContent = `${activeAccount.unshieldedAddress.slice(0, 10)}...${activeAccount.unshieldedAddress.slice(-6)}`;
    walletAddressPill.style.display = 'inline-flex';
    walletBtn.classList.remove('btn-white');
    walletBtn.classList.add('btn-ghost');
  } catch (err: any) {
    showToast(err.message, 'error');
    walletStatusText.textContent = 'Connect Lace Wallet';
  } finally {
    walletBtn.disabled = false;
  }
}

// --- Issue Pass Handler ---
async function handleIssuePass(e: Event) {
  e.preventDefault();
  const titleInput = document.getElementById('pass-title') as HTMLInputElement;
  const holderInput = document.getElementById('pass-holder') as HTMLInputElement;

  const title = titleInput.value.trim() || 'Midnight VIP Pass';
  const holder = holderInput.value.trim() || 'Anonymous User';

  issueBtn.disabled = true;
  issueBtn.textContent = 'Committing to Ledger...';

  try {
    const newPass = await contractService.issuePass(title, holder);
    showToast(`Pass ${newPass.id} issued successfully on Midnight!`);

    if (issuePlaceholder) issuePlaceholder.style.display = 'none';
    if (issueResultBox) {
      issueResultBox.style.display = 'block';
      issueResultBox.innerHTML = `
        <div class="ticket-clean" style="border-color: rgba(140, 255, 46, 0.3);">
          <div class="ticket-top">
            <div>
              <span class="ticket-code">${newPass.id}</span>
              <h3 class="ticket-name">${newPass.title}</h3>
              <p class="ticket-holder">Issued to: ${newPass.holderName}</p>
            </div>
            <span class="ticket-pill pill-green">Active Leaf #${newPass.leafIndex}</span>
          </div>

          <div class="ticket-data-grid">
            <div class="data-item">
              <span class="data-key">Public Commitment:</span>
              <span class="data-val">0x${newPass.commitment.slice(0, 18)}...</span>
            </div>
            <div class="data-item">
              <span class="data-key">Private Secret (Witness):</span>
              <span class="data-val" style="color: #c084fc;">0x${newPass.secret.slice(0, 18)}...</span>
            </div>
            <div class="data-item">
              <span class="data-key">Private Blinding Salt:</span>
              <span class="data-val" style="color: #c084fc;">0x${newPass.salt.slice(0, 18)}...</span>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 12px; font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
            🔒 <strong>Privacy Assurance:</strong> Secret and salt remain on your device. Only the cryptographic commitment hash is broadcasted to the Midnight ledger.
          </div>

          <button type="button" class="action-btn btn-white btn-block auto-fill-btn" data-secret="${newPass.secret}" data-salt="${newPass.salt}">
            ⚡ Verify at Zero-Knowledge Gate
          </button>
        </div>
      `;

      issueResultBox.querySelector('.auto-fill-btn')?.addEventListener('click', () => {
        switchTab('redeem');
        if (redeemSecretInput) redeemSecretInput.value = newPass.secret;
        if (redeemSaltInput) redeemSaltInput.value = newPass.salt;
      });
    }

    updateStatsUI();
    renderQuickSelect();
    titleInput.value = '';
    holderInput.value = '';
  } catch (err: any) {
    showToast(err.message, 'error');
  } finally {
    issueBtn.disabled = false;
    issueBtn.textContent = 'Issue Pass into Merkle Tree';
  }
}

// --- Redeem Pass Handler ---
async function handleRedeemPass(e: Event) {
  e.preventDefault();
  const secret = redeemSecretInput.value.trim();
  const salt = redeemSaltInput.value.trim();

  if (!secret || !salt) {
    showToast('Please provide both ticket secret and blinding salt.', 'error');
    return;
  }

  redeemBtn.disabled = true;
  redeemBtn.textContent = 'Proving & Verifying ZK Constraints...';

  try {
    const receipt: RedemptionReceipt = await contractService.redeemPass(secret, salt);
    showToast(`Verification Passed! Nullifier recorded on Midnight Preprod.`);

    // Show modal or receipt
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-box">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(140, 255, 46, 0.1); border: 1px solid var(--accent-lime); color: var(--accent-lime); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 20px;">✓</div>
          <h2 style="font-family: var(--font-display); font-size: 22px; font-weight: 700; color: #fff;">Access Granted</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Zero-Knowledge Circuit Proved Membership On-Chain</p>
        </div>

        <div class="ticket-data-grid" style="margin-bottom: 20px;">
          <div class="data-item">
            <span class="data-key">Disclosed Nullifier:</span>
            <span class="data-val" style="color: var(--accent-lime);">${receipt.nullifier.slice(0, 18)}...</span>
          </div>
          <div class="data-item">
            <span class="data-key">Block Height:</span>
            <span class="data-val">#${receipt.blockHeight}</span>
          </div>
          <div class="data-item">
            <span class="data-key">ZK Prover Execution:</span>
            <span class="data-val">${receipt.proofTimeMs} ms</span>
          </div>
          <div class="data-item">
            <span class="data-key">Transaction Hash:</span>
            <span class="data-val">${receipt.txHash.slice(0, 18)}...</span>
          </div>
        </div>

        <div style="background: rgba(140, 255, 46, 0.05); border: 1px solid rgba(140, 255, 46, 0.2); border-radius: var(--radius-xs); padding: 12px; font-size: 12px; color: var(--text-secondary); margin-bottom: 24px;">
          ✓ <strong>Privacy Preserved:</strong> The nullifier prevents double-redemption while your secret identity remained 100% confidential.
        </div>

        <button type="button" class="action-btn btn-white btn-block modal-close-btn">
          Done
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.modal-close-btn')?.addEventListener('click', () => modal.remove());

    updateStatsUI();
    renderQuickSelect();
    redeemSecretInput.value = '';
    redeemSaltInput.value = '';
  } catch (err: any) {
    showToast(err.message, 'error');
  } finally {
    redeemBtn.disabled = false;
    redeemBtn.textContent = 'Prove & Redeem Pass';
  }
}

// --- Attach Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  if (walletBtn) walletBtn.addEventListener('click', handleWalletConnect);
  if (issueForm) issueForm.addEventListener('submit', handleIssuePass);
  if (redeemForm) redeemForm.addEventListener('submit', handleRedeemPass);

  document.getElementById('tab-btn-issue')?.addEventListener('click', () => switchTab('issue'));
  document.getElementById('tab-btn-redeem')?.addEventListener('click', () => switchTab('redeem'));
  document.getElementById('tab-btn-passes')?.addEventListener('click', () => switchTab('passes'));

  updateStatsUI();
  renderQuickSelect();

  if (laceConnector.isInstalled()) {
    console.log('[CloakPass] Lace extension detected!');
  }
});
