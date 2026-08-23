/**
 * NOC History Utilities - Handles 1-Click Ticket Recall & Local Storage
 */

const HISTORY_KEY = 'noc_ticket_history';
const MAX_HISTORY = 15;

function getTicketHistory() {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error reading history:", e);
        return [];
    }
}

function saveTicketToHistory(item) {
    try {
        let history = getTicketHistory();
        // Remove duplicate if same ID and ticketText exists
        history = history.filter(h => !(h.id === item.id && h.ticketText === item.ticketText));
        
        // Add timestamp
        const now = new Date();
        item.time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        item.date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
        item.timestamp = now.getTime();

        history.unshift(item); // Add to top
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        updateHistoryBadge();
    } catch (e) {
        console.error("Error saving history:", e);
    }
}

function updateHistoryBadge() {
    const history = getTicketHistory();
    const badges = document.querySelectorAll('.history-count-badge');
    badges.forEach(b => {
        b.innerText = history.length;
    });
}

function clearTicketHistory() {
    if (confirm("Are you sure you want to clear all recent ticket history?")) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistoryList();
        updateHistoryBadge();
    }
}

function deleteHistoryItem(index) {
    let history = getTicketHistory();
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistoryList();
        updateHistoryBadge();
    }
}

function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        renderHistoryList();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function recallTicketItem(index) {
    const history = getTicketHistory();
    const item = history[index];
    if (!item) return;

    // 1. Switch infra mode if applicable (TCT vs MM) before populating dropdowns
    if (typeof setInfraMode === 'function' && (item.mode === 'TCT' || item.mode === 'MM')) {
        setInfraMode(item.mode);
    }

    // 2. Identify all input elements across all pages (infra-tct.html, index.html, glan.html)
    const ticketElem = document.getElementById('customerTicket') || document.getElementById('customerInput') || document.getElementById('glanInfo');
    const macElem = document.getElementById('macInput');
    const snElem = document.getElementById('snInput');
    const prodElem = document.getElementById('prodInput');
    const onuElem = document.getElementById('onuId') || document.getElementById('interfaceInput');
    const connTypeElem = document.getElementById('connectionType') || document.getElementById('glanValue');
    const pkgElem = document.getElementById('packageType');
    const prefixElem = document.getElementById('interfacePrefix');
    const ipElem = document.getElementById('glanIp') || document.getElementById('ipInput');

    // 3. Fill values
    if (ticketElem && item.ticketText) {
        ticketElem.value = item.ticketText;
        // Trigger input event to run auto-parse logic
        ticketElem.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof autoResize === 'function') autoResize(ticketElem);
        if (typeof autoExpand === 'function') autoExpand(ticketElem);
    }

    if (macElem && item.mac !== undefined) {
        macElem.value = item.mac;
        macElem.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (snElem && item.sn !== undefined) {
        snElem.value = item.sn;
        snElem.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (prodElem && item.prod !== undefined) {
        prodElem.value = item.prod;
        prodElem.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (onuElem && item.onuId !== undefined) {
        onuElem.value = item.onuId;
    }
    if (connTypeElem && item.connectionType) {
        connTypeElem.value = item.connectionType;
    }
    if (pkgElem && item.packageType) {
        pkgElem.value = item.packageType;
    }
    if (prefixElem && item.interfacePrefix) {
        prefixElem.value = item.interfacePrefix;
    }
    if (ipElem && item.ip) {
        ipElem.value = item.ip;
    }

    // 4. Trigger generation
    if (typeof executeGeneration === 'function') {
        executeGeneration();
    } else if (typeof generateConfig === 'function') {
        generateConfig();
    } else if (typeof generateGlanConfig === 'function') {
        generateGlanConfig();
    }

    // 5. Close modal
    closeHistoryModal();
}

function renderHistoryList() {
    const container = document.getElementById('historyListContainer');
    if (!container) return;

    const history = getTicketHistory();
    updateHistoryBadge();

    if (history.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-var-muted">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p class="text-sm font-bold uppercase tracking-wider">No Recent Ticket History</p>
                <p class="text-xs opacity-75 mt-1">Generated configs will automatically appear here for 1-click recall.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map((item, idx) => {
        const modeBadgeClass = item.mode === 'MM' 
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
            : (item.mode === 'TCT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40');
        
        return `
            <div class="noc-panel p-3.5 rounded border border-var-color flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-var-accent transition-all">
                <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${modeBadgeClass}">${item.mode || 'NOC'}</span>
                        <span class="text-sm font-bold text-var-main">ID: ${item.id || 'N/A'}</span>
                        <span class="text-xs text-var-secondary font-semibold">— ${item.name || 'Unknown'}</span>
                    </div>
                    <div class="flex items-center gap-3 text-[11px] text-var-muted font-mono flex-wrap">
                        <span>🕒 ${item.date || ''} ${item.time || ''}</span>
                        ${item.sn ? `<span>SN: ${item.sn}</span>` : ''}
                        ${item.mac ? `<span>MAC: ${item.mac}</span>` : ''}
                        ${item.connectionType ? `<span>VLAN: ${item.connectionType}</span>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="recallTicketItem(${idx})" class="noc-btn filled text-xs px-3 py-1.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Recall
                    </button>
                    <button onclick="deleteHistoryItem(${idx})" class="text-xs px-2.5 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-bold">
                        ✕
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    updateHistoryBadge();
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeHistoryModal();
    });
});
