// GLAN Configuration Generator Engine

function generateGlanConfig(event) {
    if (event) event.preventDefault();
    console.log("GLAN Generate button clicked");

    const id = document.getElementById('glanId').value.trim();
    const name = document.getElementById('glanName').value.trim();
    const ip = document.getElementById('glanIp').value.trim();

    if (!id || !name || !ip) {
        alert("Please fill in all input fields (ID, Name, IP).");
        return;
    }

    // Process Gateway from IP
    let gw = "1.1.1.1";
    const ipParts = ip.split('.');
    if (ipParts.length === 4) {
        gw = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1`;
    }

    // 1. SHOW AND CONFIG OUTPUT
    let configOut = `Show\n\n`;
    configOut += `sho running-config | section ${ip}\n`;
    configOut += `sho ip arp vrf VH-2-GW ${ip}\n\n`;
    configOut += `Config\n\n`;
    configOut += `ip access-list extended acl-${id}-CAMMA\n`;
    configOut += `permit ip any host ${ip}\n`;
    configOut += `permit ip host ${ip} any\n`;
    configOut += `exit\n\n`;
    configOut += `class-map match-all cl-${id}-CAMMA\n`;
    configOut += `match access-group name acl-${id}-CAMMA\n`;
    configOut += `exit\n\n`;
    configOut += `policy-map IP-Base-GLAN-306\n`;
    configOut += `class cl-${id}-CAMMA\n`;
    configOut += `police rate 471859200\n`;
    configOut += `end`;

    // 2. GROUP MESSAGE OUTPUT
    let groupOut = `Done bong please test :\n\n`;
    groupOut += `ID: ${id}\n`;
    groupOut += `Name: ${name}\n\n`;
    groupOut += `IP: ${ip}\n`;
    groupOut += `Subnet: 255.255.255.128\n`;
    groupOut += `Gw: ${gw}\n\n`;
    groupOut += `Dns1: 103.216.51.193\n`;
    groupOut += `Dns2: 103.216.48.1\n\n`;
    groupOut += `Thank you.`;

    // Apply to UI
    const configEl = document.getElementById('glanConfigOutput');
    const groupEl = document.getElementById('glanGroupOutput');

    if (configEl) {
        configEl.value = configOut;
        configEl.innerText = configOut;
    }
    if (groupEl) {
        groupEl.value = groupOut;
        groupEl.innerText = groupOut;
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
