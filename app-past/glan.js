// GLAN Configuration Generator Engine

function generateGlanConfig(event) {
    if (event) event.preventDefault();
    console.log("GLAN Generate button clicked");

    const infoRaw = document.getElementById('glanInfo').value.trim();
    const ip = document.getElementById('glanIp').value.trim();
    
    // Default values
    let id = "0000";
    let name = "Unknown";

    // Detect if input is a multi-line ticket or single line shorthand
    let aid = "";
    if (infoRaw.includes('\n') || infoRaw.includes(':')) {
        // Ticket Style Parsing
        const idMatch = infoRaw.match(/^\s*(?:CID\s*\/|C)?ID\s*[:.]?\s*([^\n\r]+)/im);
        if (idMatch) id = idMatch[1].trim();

        const nameLineMatch = infoRaw.match(/^\s*Name\b\s*[:.]?\s*([^\n\r]+)/im);
        if (nameLineMatch) {
            name = nameLineMatch[1].trim();
            // Clean name (remove parenthesis)
            const parenIndex = name.indexOf('(');
            if (parenIndex !== -1) name = name.substring(0, parenIndex).trim();
        }

        // Parse AID number (e.g. AID17330)
        const aidMatch = infoRaw.match(/\bAID\d+\b/i);
        if (aidMatch) aid = aidMatch[0].toUpperCase();
    } else {
        // Shorthand Parsing (ID Name)
        const infoMatch = infoRaw.match(/^(\d+)\s*(.*)$/);
        if (infoMatch) {
            id = infoMatch[1];
            name = infoMatch[2].trim() || "Unknown";
        } else if (infoRaw.length > 0) {
            name = infoRaw;
        }
    }


    // New Manual Overrides with Defaults
    const manualSubnet = document.getElementById('glanSubnet').value.trim();
    const manualGw = document.getElementById('glanGw').value.trim();
    const glanValue = document.getElementById('glanValue').value.trim() || "306";

    // Subnet Default
    const subnet = manualSubnet || "255.255.255.128";

    // Process Gateway from IP if not manually provided
    let gw = manualGw;
    if (!manualGw && ip) {
        const ipParts = ip.split('.');
        if (ipParts.length === 4) {
            gw = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`;
        }
    }
    if (!gw) gw = "1.1.1.1"; // Hard fallback


    // Extract last word from name for config suffix
    const nameParts = name.split(/\s+/).filter(p => p.length > 0);
    const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1].toLowerCase() : "camma";

    // 1. SHOW AND CONFIG OUTPUT
    let configOut = `Show\n\n`;
    configOut += `sho running-config | section ${ip}\n`;
    configOut += `sho ip arp vrf VH-2-GW ${ip}\n\n`;
    configOut += `Config\n\n`;
    configOut += `ip access-list extended acl-${id}-${lastName}\n`;
    configOut += `permit ip any host ${ip}\n`;
    configOut += `permit ip host ${ip} any\n`;
    configOut += `exit\n\n`;
    configOut += `class-map match-all cl-${id}-${lastName}\n`;
    configOut += `match access-group name acl-${id}-${lastName}\n`;
    configOut += `exit\n\n`;
    configOut += `policy-map IP-Base-GLAN-${glanValue}\n`;
    configOut += `class cl-${id}-${lastName}\n`;
    configOut += `police rate 471859200\n`;
    configOut += `end`;

    // 2. GROUP MESSAGE OUTPUT
    let groupOut = `Done bong please test :\n\n`;
    groupOut += `ID: ${id}\n`;
    groupOut += `Name: ${name}\n\n`;
    groupOut += `IP: ${ip}\n`;
    groupOut += `Subnet: ${subnet}\n`;
    groupOut += `Gw: ${gw}\n\n`;
    groupOut += `Dns1: 103.216.51.193\n`;
    groupOut += `Dns2: 103.216.48.1\n`;
    if (aid) groupOut += `\n${aid}\n`;
    groupOut += `\nThank you.`;

    // Apply to UI
    const configEl = document.getElementById('glanConfigOutput');
    const groupEl = document.getElementById('glanGroupOutput');

    if (configEl) {
        configEl.value = configOut;
        configEl.innerText = configOut;
        if (typeof autoExpand === "function") autoExpand(configEl);
    }
    if (groupEl) {
        groupEl.value = groupOut;
        groupEl.innerText = groupOut;
        if (typeof autoExpand === "function") autoExpand(groupEl);
    }
}

// Global Copy Engine (Reuses same logic from script.js)
function copyOutput(elementId, btnElement) {
    const area = document.getElementById(elementId);
    area.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();

    const toast = document.getElementById('toast');
    toast.classList.add('toast-show');
    setTimeout(() => { toast.classList.remove('toast-show'); }, 2000);
}
