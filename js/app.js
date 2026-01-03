import { CronosService } from './cronos.js';
import { CharityAgent } from './agent.js';

class App {
    constructor() {
        this.cronos = new CronosService();
        this.agent = new CharityAgent(this.cronos, this);

        // UI Elements
        this.chatHistory = document.getElementById('chat-history');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.connectBtn = document.getElementById('connect-btn');
        this.walletStatus = document.getElementById('wallet-status');
        this.walletAddressDisplay = document.getElementById('wallet-address');
        this.txMonitor = document.getElementById('tx-monitor');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCharityList();

        // Check if already connected (optional, skipping for simple demo flow)
    }

    setupEventListeners() {
        this.connectBtn.addEventListener('click', () => this.handleConnect());

        this.sendBtn.addEventListener('click', () => this.handleUserMessage());

        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });
    }

    async handleConnect() {
        try {
            const address = await this.cronos.connectWallet();
            this.updateWalletUI(address);
            this.addBotMessage(`Welcome! Wallet connected: ${this.cronos.formatAddress(address)}`);
        } catch (error) {
            console.error(error);
            alert("⚠️ Connection Failed:\n" + error.message);

            // Also log to chat for visibility
            this.addBotMessage("I couldn't connect to your wallet. " + error.message);
        }
    }

    updateWalletUI(address) {
        this.connectBtn.classList.add('hidden');
        this.walletStatus.classList.remove('hidden');
        this.walletAddressDisplay.innerText = this.cronos.formatAddress(address);
    }

    async handleUserMessage() {
        const text = this.userInput.value.trim();
        if (!text) return;

        // User Message
        this.addUserMessage(text);
        this.userInput.value = '';

        // Bot Thinking Simulator
        await this.delay(600);

        // Get Response
        const response = await this.agent.processMessage(text);
        this.addBotMessage(response.text);

        // Handle Actions
        if (response.action === 'SHOW_PAYMENT_CARD') {
            this.addPaymentCard(response.payload);
        } else if (response.action === 'HIGHLIGHT_VERIFY') {
            this.highlightVerificationPanel(response.payload);
        } else if (response.action === 'SHOW_DETAILS') {
            // If the agent finds a match, show it in the right panel
            this.highlightVerificationPanel(response.payload);
        }
    }

    renderCharityList(categoryFilter = 'All') {
        const infoSection = document.querySelector('.info-section');
        const existingList = document.getElementById('charity-list-container');
        if (existingList) existingList.remove();

        const listContainer = document.createElement('div');
        listContainer.id = 'charity-list-container';
        listContainer.className = 'glass-panel charity-list';

        // Filter Buttons HTML
        const categories = ['All', 'Environment', 'Health', 'Education', 'Animals', 'Tech', 'Arts'];
        let filterHtml = '<div class="filter-row">';
        categories.forEach(cat => {
            const activeClass = cat === categoryFilter ? 'active' : '';
            filterHtml += `<button class="filter-chip ${activeClass}" data-cat="${cat}">${cat}</button>`;
        });
        filterHtml += '</div>';

        listContainer.innerHTML = `
            <h3>Verified Causes</h3>
            ${filterHtml}
            <div class="list-scroll"></div>
        `;

        const scrollArea = listContainer.querySelector('.list-scroll');

        // Filter Logic
        const filtered = categoryFilter === 'All'
            ? this.agent.registry
            : this.agent.registry.filter(c => c.category === categoryFilter);

        filtered.forEach(charity => {
            const card = document.createElement('div');
            card.className = 'charity-card';
            card.innerHTML = `
                <div class="charity-icon">${charity.icon}</div>
                <div class="charity-info">
                    <div class="charity-name">${charity.name}</div>
                    <div class="charity-cat">${charity.category}</div>
                </div>
                <div class="charity-action">➜</div>
            `;

            card.addEventListener('click', () => {
                this.handleCharitySelection(charity);
            });

            scrollArea.appendChild(card);
        });

        // Add Event Listeners to Chips
        listContainer.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.renderCharityList(e.target.dataset.cat);
            });
        });

        infoSection.prepend(listContainer);
    }

    handleCharitySelection(charity) {
        // Update Agent State
        this.agent.selectedCharity = charity;
        this.agent.state = "CONFIRM_CHARITY";

        // Show Verification Panel for this charity
        this.highlightVerificationPanel(charity);

        // Send simulated message to chat
        this.addUserMessage(`I'm interested in ${charity.name}`);

        // Trigger Agent response manually
        this.addBotMessage(`Excellent choice! **${charity.name}** is a verified entity on Cronos. \n\n${charity.description}\n\nWould you like to donate?`);
    }

    highlightVerificationPanel(charity = null) {
        // If a charity is provided, update the verification card details
        if (charity) {
            const panel = document.querySelector('.info-card'); // Identity Verification Panel
            if (panel) {
                // Restore if hidden or create new if missing? 
                // For simplicity, we assume the identity card is there but might be hidden by list.
                // Let's make sure it's visible or update it.

                // Update DOM elements
                panel.querySelector('.value.mono').innerText = this.cronos.formatAddress(charity.address);
                // panel.querySelector('.value:nth-child(2)').innerText = charity.id; // Selector might be brittle
                const rows = panel.querySelectorAll('.detail-row .value');
                if (rows[0]) rows[0].innerText = charity.id;

                // Flash effect
                panel.style.transition = "box-shadow 0.3s";
                panel.style.boxShadow = "0 0 20px var(--success)";
                setTimeout(() => { panel.style.boxShadow = "none"; }, 2000);
            }
        }
    }

    addPaymentCard(payload) {
        const div = document.createElement('div');
        div.className = 'message bot';

        // Tier Logic
        const tierClass = payload.tier ? `tier-${payload.tier.toLowerCase()}` : '';
        const tierBadge = payload.tier === 'VIP' ? '<span class="badg-vip">👑 TOP TIER</span>' : '<span class="badg-402">HTTP 402</span>';

        // HTML for 402 Payment Card
        div.innerHTML = `
            <div class="avatar">AI</div>
            <div class="payment-card ${tierClass}">
                <div class="payment-header">
                    <span>Payment Required</span>
                    ${tierBadge}
                </div>
                <div class="payment-body">
                    <div class="pay-row">
                        <span class="pay-label">Beneficiary</span>
                        <span class="pay-value">${payload.charity.name}</span>
                    </div>
                    <div class="pay-row">
                        <span class="pay-label">Amount</span>
                        <span class="pay-value amount">${payload.amount} CRO</span>
                    </div>
                    <div class="pay-row">
                        <span class="pay-label">Status</span>
                        <span class="pay-value pending">Unpaid</span>
                    </div>
                </div>
                <button class="btn-pay">Pay Invoice</button>
            </div>
        `;

        this.chatHistory.appendChild(div);
        this.scrollToBottom();

        // Add Click Listener to the specific button
        const btn = div.querySelector('.btn-pay');
        btn.addEventListener('click', () => {
            this.initiateDonation(payload.charity.address, payload.amount, div);
        });
    }

    async initiateDonation(address, amount, cardElement) {
        if (!this.cronos.signer) {
            this.addBotMessage("Please connect your wallet first to donate!");
            await this.handleConnect();
            if (!this.cronos.signer) return; // Still not connected
        }

        const btn = cardElement.querySelector('.btn-pay');
        const statusEl = cardElement.querySelector('.pay-value.pending');

        try {
            btn.innerText = "Processing...";
            btn.disabled = true;

            const tx = await this.cronos.sendDonation(address, amount);

            // Update Card UI to "Processing"
            if (statusEl) {
                statusEl.className = "pay-value processing";
                statusEl.innerText = "Verifying...";
            }

            this.addTxToMonitor(tx.hash, "Pending");

            // Verify
            const receipt = await this.cronos.verifyTransaction(tx.hash);

            if (receipt && receipt.status === 1) {
                this.updateTxStatus(tx.hash, "Verified");
                // Update Card UI to "Paid"
                if (statusEl) {
                    statusEl.className = "pay-value success";
                    statusEl.innerText = "Paid & Verified";
                }
                btn.innerText = "Payment Complete";
                btn.classList.add('success');

                this.addBotMessage(`✅ Payment of ${amount} CRO to ${this.cronos.formatAddress(address)} has been verified on-chain!`);
            } else {
                this.updateTxStatus(tx.hash, "Failed");
                btn.innerText = "Retry Payment";
                btn.disabled = false;
                this.addBotMessage("❌ Transaction failed or was rejected.");
            }

        } catch (error) {
            console.error(error);
            btn.innerText = "Pay Invoice";
            btn.disabled = false;
            this.addBotMessage("⚠️ Donation cancelled or failed.");
        }
    }

    // UI Helpers
    addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user';
        div.innerHTML = `<div class="text">${this.escapeHtml(text)}</div><div class="avatar">U</div>`;
        this.chatHistory.appendChild(div);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = `<div class="avatar">AI</div><div class="text">${this.escapeHtml(text)}</div>`;
        this.chatHistory.appendChild(div);
        this.scrollToBottom();
    }

    addTxToMonitor(hash, status) {
        const shortHash = this.cronos.formatAddress(hash);
        const div = document.createElement('div');
        div.className = 'tx-item';
        div.id = `tx-${hash}`;
        div.innerHTML = `
            <span class="tx-hash">${shortHash}</span>
            <span class="tx-status status-${status.toLowerCase()}">${status}</span>
        `;

        // Remove empty state if present
        const empty = this.txMonitor.querySelector('.empty-state');
        if (empty) empty.remove();

        this.txMonitor.prepend(div);
    }

    updateTxStatus(hash, status) {
        const el = document.getElementById(`tx-${hash}`);
        if (el) {
            const statusSpan = el.querySelector('.tx-status');
            statusSpan.className = `tx-status status-${status.toLowerCase()}`;
            statusSpan.innerText = status;
        }
    }

    highlightVerificationPanel() {
        const panel = document.querySelector('.info-card');
        panel.style.transition = "box-shadow 0.3s";
        panel.style.boxShadow = "0 0 20px var(--success)";
        setTimeout(() => {
            panel.style.boxShadow = "none";
        }, 2000);
    }

    scrollToBottom() {
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
