// Core Listeners
document.addEventListener('DOMContentLoaded', () => {
    const customerInput = document.getElementById('customerInput');
    
    // Auto-resize and auto-parse on input
    customerInput.addEventListener('input', () => {
        autoResizeTextarea(customerInput);
        updateParsedDisplay(customerInput.value);
    });
    
    // Generate on Ctrl+Enter
    customerInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            generateConfig(e);
        }
    });

    // Generate Button explicit event listener
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateConfig);
    }

    // Initialize display with empty
    updateParsedDisplay('');
});

// Auto-Expand Textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = '150px'; // Reset to min-height
    const scrollHeight = textarea.scrollHeight;
    if (scrollHeight > 150) {
        textarea.style.height = (scrollHeight + 2) + 'px';
    }
}

// Live Parsed Data Extraction
function updateParsedDisplay(text) {
    const data = parseCustomerData(text);
    document.getElementById('disp_id').innerText = data.id || '--';
    document.getElementById('disp_name').innerText = data.fullName || '--';
    document.getElementById('disp_phone').innerText = data.phone || '--';
    document.getElementById('disp_order').innerText = data.project || '--';
}

function parseCustomerData(text) {
    const result = {
        id: 'N/A',
        name: 'N/A',
        fullName: 'N/A',
        phone: 'N/A',
        number: 'N/A',
        username: '',
        password: '',
        project: '',
        room: ''
    };

    if (!text) return result;

    // ID
    const idMatch = text.match(/^\s*(?:CID\s*\/|C)?ID\s*[:.]?\s*([^\n\r]+)/im);
    if (idMatch) {
        let idVal = idMatch[1].trim();
        const doubleIdMatch = idVal.match(/^ID\s*[:.]?\s*(.+)/i);
        if (doubleIdMatch) idVal = doubleIdMatch[1].trim();
        result.id = idVal;
    }

    // Project / Order Code (e.g. TD0350)
    const projectMatch = text.match(/Project\s*[:.\uFF1A]?\s*([^\n\r]+)/i);
    if (projectMatch) result.project = projectMatch[1].trim();
    if (!result.project) {
        const projectSpaceMatch = text.match(/Project\s+([A-Za-z0-9][A-Za-z0-9 ]{0,20})/i);
        if (projectSpaceMatch) result.project = projectSpaceMatch[1].trim();
    }
    if (!result.project) {
        const telcotechMatch = text.match(/(Telcotech\s*-\s*[A-Z0-9]+)/i);
        if (telcotechMatch) result.project = telcotechMatch[1].replace(/\s+/g, '');
    }

    // Name Extraction
    const firstNameMatch = text.match(/^\s*First\s*Name\s*[:.]?\s*([^\n\r]+)/im);
    const lastNameMatch = text.match(/^\s*(?:Last\s*Name|Surname)\s*[:.]?\s*([^\n\r]+)/im);

    if (firstNameMatch && lastNameMatch) {
        result.fullName = firstNameMatch[1].trim() + ' ' + lastNameMatch[1].trim();
    } else if (lastNameMatch) {
        result.fullName = lastNameMatch[1].trim();
    } else {
        const nameLineMatch = text.match(/^\s*Name\b\s*[:.]?\s*([^\n\r]+)/im);
        if (nameLineMatch) {
            result.fullName = nameLineMatch[1].trim();
        }
    }

    if (result.fullName !== 'N/A') {
        let cleanName = result.fullName;
        const parenIndex = cleanName.indexOf('(');
        if (parenIndex !== -1) cleanName = cleanName.substring(0, parenIndex).trim();
        const words = cleanName.trim().split(/\s+/);
        result.name = words[words.length - 1]; // Extract last word
    }

    // Phone parsing using shared utility
    result.phone = normalizePhoneNumber(text);

    // Password parse fallback
    const passwordMatch = text.match(/Password\s*[:.]?\s*([^\s|]+)/i);
    if (passwordMatch) result.password = passwordMatch[1].trim();
    
    if (result.password && (result.phone === 'N/A' || result.phone === '')) {
        result.phone = normalizePhoneNumber(result.password);
    }

    return result;
}



// Configuration Generator Engine
function generateConfig(event) {
    if (event) event.preventDefault();
    console.log("Generate button clicked");
    
    const rawText = document.getElementById('customerInput').value;
    const data = parseCustomerData(rawText);
    
    const macRaw = document.getElementById('macInput').value;
    const connectionTypeEl = document.getElementById('connectionType');
    const connectionType = connectionTypeEl ? connectionTypeEl.value : '';
    const packageType = document.getElementById('packageType').value;
    const interfaceStr = document.getElementById('interfaceInput').value;
    
    // Format MAC
    const macStripped = macRaw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const macClean = macStripped.slice(-8);
    
    // VLAN from Package Mode (For Command)
    const pkgVlanMap = {
        '@fiberlink': 67,
        '@todayhome': 67,
        '@todayfiber': 63,
        '@todayplus': 67,
        '@sf': 64
    };
    const commandVlan = pkgVlanMap[packageType] || 67;

    // VLAN from Connection Type (For TCT)
    let tctVlan = 'N/A';
    if(connectionType === 'PPPoE') tctVlan = '2422';
    if(connectionType === 'Static IP') tctVlan = '2423';

    // ONU interface parse
    let onuId = '??';
    if (/^\d+$/.test(interfaceStr.trim())) {
        onuId = interfaceStr.trim();
    } else {
        const onuIdMatch = interfaceStr.match(/:(\d+)$/);
        if (onuIdMatch) onuId = onuIdMatch[1];
    }
    
    // Build Username
    let username = `${macClean}${packageType}`;
    if (dnsEnabled) {
        username = `${macClean}N${packageType}`;
    }

    // Build DNS Line
    let dnsLine = '';
    if (dnsEnabled && data.fullName !== 'N/A') {
        let dnsName = data.fullName;
        const parenIdx = dnsName.indexOf('(');
        if (parenIdx !== -1) dnsName = dnsName.substring(0, parenIdx).trim();
        dnsName = dnsName.replace(/^(Ms|Mr|Mrs|Dr|Miss)\.?\s*/i, '');
        dnsName = dnsName.toLowerCase().replace(/[.\s]+/g, '');
        dnsLine = `\nDNS : ${dnsName}.todayddns.com`;
    }

    // ==========================================
    // 1. GENERATE USER INFO
    // ==========================================
    const footerInfo = data.project && data.project !== 'N/A' ? data.project : '';
    const preConfigStatus = isPreConfig(customerRaw);

    let outUser = preConfigStatus ? `Done Pre-config Bong. Please help test!\n\n` : `Done Bong. Please help test!\n\n`;
    outUser += `ID: ${data.id}\n`;
    outUser += `Name: ${data.fullName}\n`;
    
    if(ipcamEnabled) {
        const ipAddress = document.getElementById('ipInput').value.trim();
        const portNum = document.getElementById('portInput').value.trim();
        const ipParts = ipAddress.split('.');
        const gateway = (ipParts.length === 4) ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1` : 'N/A';
        outUser += `IP :${ipAddress}\n`;
        outUser += `Sub : 255.255.252.0\n`;
        outUser += `GW : ${gateway}\n`;
        outUser += `Port : ${portNum}\n\n`;
        outUser += `IP view: 103.216.48.130`;
    } else {
        outUser += `Username: ${username}\n`;
        outUser += `Password: ${data.phone}${dnsLine}`;
    }
    
    if(footerInfo) outUser += `\n\n${footerInfo}-TCT`;
    outUser += `\n\nThank you, Bong.`;

    // ==========================================
    // 2. GENERATE COMMAND OUTPUT
    // ==========================================
    let outCmd = '';
    if (onuId !== '??') {
        let descLabel = `${data.project && data.project !== 'N/A' ? data.project : data.id}-${data.name}`;
        
        outCmd = `onu ${onuId} description ${descLabel}\n`;
        outCmd += `onu ${onuId} ctc eth 1 vlan pvid ${commandVlan} pri 0\n`;
        outCmd += `onu ${onuId} ctc eth 1 vlan mode tag`;

        if(ipcamEnabled) {
            outCmd += `\n\nonu ${onuId} ctc eth 2 phy_ctrl enable\n`;
            outCmd += `onu ${onuId} ctc eth 2 policy cir 10240 cbs 1024 ebs 1024 \n`;
            outCmd += `onu ${onuId} ctc eth 2 rate_limit cir 10240 pir 1024 \n`;
            outCmd += `onu ${onuId} ctc eth 2 vlan pvid 420 pri 0\n`;
            outCmd += `onu ${onuId} ctc eth 2 vlan mode tag`;
        }
    } else {
        outCmd = `Please specify a valid ONU ID (e.g., EPON0/1:36)`;
    }

    // Apply to UI
    const userInfoEl = document.getElementById('userInfoOutput') || document.getElementById('output_userInfo');
    const commandEl = document.getElementById('commandOutput') || document.getElementById('output_commandOut');
    
    if (userInfoEl) {
        userInfoEl.innerText = outUser;
        userInfoEl.value = outUser;
    }
    if (commandEl) {
        commandEl.innerText = outCmd;
        commandEl.value = outCmd;
    }
    copyInterface();
}

// Reset Logic
function resetAll() {
    // Clear Input
    document.getElementById('customerInput').value = '';
    document.getElementById('customerInput').style.height = '150px';
    document.getElementById('macInput').value = '';
    document.getElementById('interfaceInput').value = 'EPON0/1:';
    
    // Selects
    document.getElementById('connectionType').selectedIndex = 0;
    document.getElementById('packageType').selectedIndex = 0;
    document.getElementById('interfacePrefix').selectedIndex = 0;

    // Toggles
    if(ipcamEnabled) toggleIpcam();
    if(dnsEnabled) toggleDns();

    // Text Display
    updateParsedDisplay('');

    // Outputs
    const userInfoEl = document.getElementById('userInfoOutput') || document.getElementById('output_userInfo');
    if (userInfoEl) {
        userInfoEl.innerText = '';
        userInfoEl.value = '';
    }
    const commandEl = document.getElementById('commandOutput') || document.getElementById('output_commandOut');
    if (commandEl) {
        commandEl.innerText = '';
        commandEl.value = '';
    }
    const tctGroupEl = document.getElementById('output_tctGroup');
    if (tctGroupEl) tctGroupEl.value = '';
}

// Global Copy Engine
function copyOutput(elementId, btnElement) {
    const area = document.getElementById(elementId);
    area.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();

    const toast = document.getElementById('toast');
    toast.classList.add('toast-show');
    setTimeout(() => { toast.classList.remove('toast-show'); }, 2000);
}

function copyInterface() {
    const interfaceInput = document.getElementById('interfaceInput');
    if(interfaceInput && interfaceInput.value) {
        navigator.clipboard.writeText(interfaceInput.value)
            .then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('toast-show');
                setTimeout(() => { toast.classList.remove('toast-show'); }, 2000);
            })
            .catch(err => {
                console.error("Failed to copy text: ", err);
            });
    }
}

// Theme Toggle Logic
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.className;
    const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    
    html.className = newTheme;
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('ispTheme', newTheme);
}

// Interface Helper
function updateInterfaceInput() {
    const prefix = document.getElementById('interfacePrefix').value;
    const input = document.getElementById('interfaceInput');
    const numberPart = input.value.replace(/(EPON|GPON)(\/0:|0\/1:)/gi, '').trim();
    input.value = prefix + numberPart;
    input.focus();
}

// ==========================================
// TOGGLES
// ==========================================

let ipcamEnabled = false;
function toggleIpcam() {
    ipcamEnabled = !ipcamEnabled;
    const fields = document.getElementById('ipcamFields');
    const dot = document.getElementById('ipcamDot');
    
    if(ipcamEnabled) {
        fields.classList.remove('hidden');
        dot.style.transform = 'translateX(20px)';
        dot.style.backgroundColor = 'var(--toggle-on)';
    } else {
        fields.classList.add('hidden');
        dot.style.transform = 'translateX(0px)';
        dot.style.backgroundColor = 'var(--toggle-off)';
        document.getElementById('ipInput').value = '';
        document.getElementById('portInput').value = '';
    }
}

let dnsEnabled = false;
function toggleDns() {
    dnsEnabled = !dnsEnabled;
    const dot = document.getElementById('dnsDot');
    
    if(dnsEnabled) {
        dot.style.transform = 'translateX(20px)';
        dot.style.backgroundColor = 'var(--toggle-on)';
    } else {
        dot.style.transform = 'translateX(0px)';
        dot.style.backgroundColor = 'var(--toggle-off)';
    }
}

