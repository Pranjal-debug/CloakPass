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
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '🛡️' : '⚠️'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
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
    passesListContainer.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 40px 0;">No access passes issued yet. Mint your first pass above!</div>`;
    return;
  }

  passesListContainer.innerHTML = passes.map(pass => `
    <div class="pass-ticket">
      <div class="pass-header">
        <div>
          <span class="pass-id">${pass.id}</span>
          <h3 class="pass-title">${pass.title}</h3>
          <p class="pass-holder">Holder: ${pass.holderName}</p>
        </div>
        <span class="pass-status ${pass.isRedeemed ? 'status-redeemed' : 'status-active'}">
          ${pass.isRedeemed ? 'Redeemed / Nullified' : 'Active / Valid'}
        </span>
      </div>

      <div class="pass-details-box">
        <div class="detail-row">
          <span class="detail-label">Merkle Leaf (Commitment):</span>
          <span class="detail-val" title="${pass.commitment}">0x${pass.commitment.slice(0, 16)}...</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Private Secret (Witness):</span>
          <span class="detail-val" style="color: var(--secondary);" title="Keep this private!">0x${pass.secret.slice(0, 16)}... (Protected)</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Issued Date:</span>
          <span class="detail-val">${new Date(pass.issuedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        ${!pass.isRedeemed ? `
          <button class="btn btn-secondary btn-full auto-fill-btn" data-secret="${pass.secret}" data-salt="${pass.salt}">
            ⚡ Verify at Gate
          </button>
        ` : `
          <button class="btn btn-secondary btn-full" disabled style="opacity: 0.5;">
            ✓ Used on Ledger
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
      showToast('Loaded pass credentials into Zero-Knowledge Gate!');
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
    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Select from your unredeemed passes:</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${passes.map(p => `
        <button type="button" class="btn btn-secondary quick-pass-pill" data-secret="${p.secret}" data-salt="${p.salt}" style="font-size: 12px; padding: 6px 12px;">
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
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

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
    walletBtn.classList.remove('btn-secondary');
    walletBtn.classList.add('btn-primary');
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
      // Lace not detected: offer simulated Preprod wallet
      console.log('Lace extension not detected. Connecting simulated client...');
      activeAccount = await laceConnector.connectSimulation('preprod');
      showToast('Connected in Preprod Simulation Mode (Lace API v4)!');
    }

    walletStatusText.textContent = activeAccount.name;
    walletAddressPill.textContent = `${activeAccount.unshieldedAddress.slice(0, 10)}...${activeAccount.unshieldedAddress.slice(-6)}`;
    walletAddressPill.style.display = 'inline-block';
    walletBtn.classList.remove('btn-primary');
    walletBtn.classList.add('btn-secondary');
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
  issueBtn.innerHTML = `<span>⏳ Committing to Ledger...</span>`;

  try {
    const newPass = await contractService.issuePass(title, holder);
    showToast(`Pass ${newPass.id} issued successfully on Midnight!`);

    if (issueResultBox) {
      issueResultBox.style.display = 'block';
      issueResultBox.innerHTML = `
        <div class="pass-ticket" style="margin-top: 20px; border-color: var(--primary);">
          <div class="pass-header">
            <div>
              <span class="pass-id">${newPass.id}</span>
              <h3 class="pass-title">${newPass.title}</h3>
              <p class="pass-holder">Issued to: ${newPass.holderName}</p>
            </div>
            <span class="pass-status status-active">Active Leaf #${newPass.leafIndex}</span>
          </div>

          <div class="pass-details-box">
            <div class="detail-row">
              <span class="detail-label">Public Merkle Commitment:</span>
              <span class="detail-val">0x${newPass.commitment.slice(0, 20)}...</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Private Witness Secret:</span>
              <span class="detail-val" style="color: var(--secondary);">0x${newPass.secret.slice(0, 20)}...</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Private Salt:</span>
              <span class="detail-val" style="color: var(--secondary);">0x${newPass.salt.slice(0, 20)}...</span>
            </div>
          </div>

          <div style="background: rgba(139, 92, 246, 0.1); border: 1px dashed var(--secondary); border-radius: var(--radius-sm); padding: 12px; font-size: 12px; margin-bottom: 12px;">
            🔒 <strong>Privacy Assurance:</strong> Your <code>secret</code> and <code>salt</code> are kept 100% off-chain on your device. Only the commitment hash was written to the Midnight public ledger!
          </div>

          <button class="btn btn-primary btn-full auto-fill-btn" data-secret="${newPass.secret}" data-salt="${newPass.salt}">
            ⚡ Verify &amp; Redeem at Zero-Knowledge Gate
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
    issueBtn.innerHTML = `<span>⚡ Issue Pass into Merkle Tree</span>`;
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
  redeemBtn.innerHTML = `<span>🔒 Synthesizing ZK Proof &amp; Checking Root...</span>`;

  try {
    const receipt: RedemptionReceipt = await contractService.redeemPass(secret, salt);
    showToast(`Verification Passed! Nullifier recorded on Midnight Preprod.`);

    // Show modal or receipt
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🛡️</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff;">Access Granted! (ZK Verified)</h2>
          <p style="font-size: 13px; color: var(--text-muted);">Midnight Zero-Knowledge Circuit Executed Successfully</p>
        </div>

        <div class="pass-details-box" style="margin-bottom: 20px;">
          <div class="detail-row">
            <span class="detail-label">Disclosed Nullifier:</span>
            <span class="detail-val" style="color: var(--primary);">${receipt.nullifier.slice(0, 18)}...</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Preprod Block Height:</span>
            <span class="detail-val">#${receipt.blockHeight}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Proof Synthesis Time:</span>
            <span class="detail-val">${receipt.proofTimeMs} ms</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction Hash:</span>
            <span class="detail-val">${receipt.txHash.slice(0, 18)}...</span>
          </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent-emerald); border-radius: var(--radius-sm); padding: 12px; font-size: 12px; margin-bottom: 20px;">
          ✓ <strong>Soundness &amp; Privacy:</strong> The nullifier was revealed to prevent double-admission, while your secret identity remained 100% confidential.
        </div>

        <button class="btn btn-primary btn-full modal-close-btn">
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
    redeemBtn.innerHTML = `<span>🛡️ Prove &amp; Redeem Pass</span>`;
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

  // Check if wallet already present
  if (laceConnector.isInstalled()) {
    console.log('[CloakPass] Lace extension detected!');
  }
});
