// Core Listeners
document.addEventListener('DOMContentLoaded', () => {
    const customerInput = document.getElementById('customerInput');
    
    // Auto-resize and auto-parse on input
    customerInput.addEventListener('input', () => {
        autoResizeTextarea(customerInput);
        updateParsedDisplay(customerInput.value);
        
        // Auto-select package type
        const text = customerInput.value;
        const packageSelect = document.getElementById('packageType');
        const detectedPkg = autoDetectPackage(text);
        if (detectedPkg && packageSelect) {
            packageSelect.value = detectedPkg;
        }
    });

function autoDetectPackage(text) {
    if (!text) return null;

    // Extract explicit Package line if present
    const pkgMatch = text.match(/Package\s*[:.]?\s*([^\n\r]+)/i);
    const targetText = pkgMatch ? pkgMatch[1] : text;

    // Helper to evaluate text
    const matchTarget = (str) => {
        if (/giga/i.test(str)) return '@gigaedge';
        if (/mega/i.test(str)) return '@megaedge';
        if (/biz/i.test(str)) return '@bizedge';
        if (/fiber\s*link|fiberlink|link[- ]light/i.test(str)) return '@fiberlink';
        if (/home/i.test(str)) return '@todayhome';
        if (/wifi/i.test(str) && !/router|rental/i.test(str)) return '@todaywifi';
        if (/\bbbi\b/i.test(str)) return '@bbi';
        if (/simply/i.test(str) || /\bsf\b/i.test(str)) return '@sf';
        if (/plus/i.test(str)) return '@todayplus';
        if (/fiber/i.test(str)) return '@todayfiber';
        return null;
    };

    // First check explicit Package line
    const result = matchTarget(targetText);
    if (result) return result;

    // Fallback to full text if Package line didn't yield a match
    if (pkgMatch) {
        return matchTarget(text);
    }

    return null;
}
    
    // Generate on Ctrl+Enter
    customerInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            generateConfig(e);
        }
    });

    // MAC Input auto-detect PON and ONU
    const macInput = document.getElementById('macInput');
    if (macInput) {
        macInput.addEventListener('input', () => {
            const rawVal = macInput.value;
            const parsed = parseMacAndOnuInput(rawVal);
            const interfaceInput = document.getElementById('interfaceInput');

            if ((parsed.ponInfo || parsed.onuId) && interfaceInput) {
                let currentVal = interfaceInput.value.trim();
                let prefix = 'EPON0/1:';
                if (parsed.ponInfo) {
                    prefix = parsed.ponInfo;
                } else if (currentVal.includes(':')) {
                    prefix = currentVal.substring(0, currentVal.indexOf(':') + 1);
                }
                
                let targetOnu = parsed.onuId;
                if (!targetOnu) {
                    const onuMatch = currentVal.match(/:(\d+)$/);
                    if (onuMatch) targetOnu = onuMatch[1];
                }

                if (targetOnu) {
                    interfaceInput.value = `${prefix}${targetOnu}`;
                } else if (parsed.ponInfo) {
                    interfaceInput.value = `${prefix}`;
                }
            }
        });
    }

    // Initialize display with empty
    updateParsedDisplay('');
});

function parseMacAndOnuInput(rawVal) {
    if (!rawVal) return { cleanMac: '', ponInfo: null, onuId: null };

    let ponInfo = null;
    let onuId = null;

    // Check for PON / EPON / GPON X/Y pattern
    const ponMatch = rawVal.match(/\b(G?EPON|PON)\s*(\d+\/\d+)/i);
    if (ponMatch) {
        const type = ponMatch[1].toUpperCase() === 'GPON' ? 'GPON' : 'EPON';
        const slotPort = ponMatch[2];
        ponInfo = `${type}${slotPort}:`;
    }

    // Check for ONU X pattern or :X pattern
    const onuMatch = rawVal.match(/\bONU\s*[:#]?\s*(\d+)/i) || rawVal.match(/:(\d+)\b/);
    if (onuMatch) {
        onuId = onuMatch[1];
    }

    // Extract clean MAC address by stripping PON and ONU tokens first
    let textForMac = rawVal;
    if (ponMatch) textForMac = textForMac.replace(ponMatch[0], '');
    if (onuMatch) textForMac = textForMac.replace(onuMatch[0], '');

    const macMatch = textForMac.match(/(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/) || 
                     textForMac.match(/[0-9A-Fa-f]{12}/) || 
                     textForMac.match(/(?:[0-9A-Fa-f]{2}\s*){6}/);

    let cleanMac = '';
    if (macMatch) {
        cleanMac = macMatch[0].trim();
    } else {
        cleanMac = textForMac.replace(/[^a-zA-Z0-9]/g, '');
    }

    return { cleanMac, ponInfo, onuId };
}

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
        site: '',
        phone: 'N/A',
        number: 'N/A',
        username: '',
        password: '',
        project: '',
        room: '',
        aid: ''
    };

    if (!text) return result;

    // ID (stop at 'Name' keyword if on the same line)
    const idMatch = text.match(/^\s*(?:CID\s*\/|C)?ID\s*[:.]?\s*([^\n\r]+)/im);
    if (idMatch) {
        let idVal = idMatch[1].trim();
        const doubleIdMatch = idVal.match(/^ID\s*[:.]?\s*(.+)/i);
        if (doubleIdMatch) idVal = doubleIdMatch[1].trim();
        // Trim at 'Name' keyword if ID and Name share the same line
        const nameIdx = idVal.search(/\s+Name\s*[:.]?\s/i);
        if (nameIdx !== -1) idVal = idVal.substring(0, nameIdx).trim();
        result.id = idVal;
    }

    // Project / Order Code (e.g. order : 186352 or TD0350)
    const orderMatch = text.match(/(?:order|order\s*id)\s*[:.\uFF1A]?\s*([^\n\r]+)/i);
    if (orderMatch) result.project = orderMatch[1].trim();

    if (!result.project) {
        const projectMatch = text.match(/Project\s*[:.\uFF1A]?\s*([^\n\r]+)/i);
        if (projectMatch) result.project = projectMatch[1].trim();
    }
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

    // Fallback: extract inline name from "ID: 12345 Name: John Doe" format
    if (result.fullName === 'N/A') {
        const inlineNameMatch = text.match(/ID\s*[:.]?\s*\S+\s+Name\s*[:.]?\s*([^\n\r]+)/im);
        if (inlineNameMatch) {
            result.fullName = inlineNameMatch[1].trim();
        }
    }

    // Fallback: check next line after ID if Name label is absent
    if (result.fullName === 'N/A' && idMatch) {
        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(idMatch[0]) || (idVal && lines[i].includes(idVal))) {
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !/^(?:contact|address|note|order|phone|cid|id|password)\s*[:.]/i.test(nextLine)) {
                        result.fullName = nextLine;
                        break;
                    }
                }
            }
        }
    }

    if (result.fullName !== 'N/A') {
        let cleanName = result.fullName;
        // Extract site identifier from parentheses (e.g. "(Site C)" → "Site-C")
        const siteMatch = cleanName.match(/\(([^)]+)\)/);
        if (siteMatch) {
            result.site = siteMatch[1].trim().replace(/\s+/g, '-');
        }
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

    // AID number (e.g. AID17330)
    const aidMatch = text.match(/(AID\d+)/i);
    if (aidMatch) result.aid = aidMatch[1].toUpperCase();

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
    const parsedMac = parseMacAndOnuInput(macRaw);
    const macTargetStr = parsedMac.cleanMac || macRaw;
    const macStripped = macTargetStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const macClean = macStripped.slice(-8);
    
    // VLAN from Package Mode (For Command)
    const pkgVlanMap = {
        '@fiberlink': 67,
        '@todayhome': 67,
        '@todayfiber': 63,
        '@todayplus': 67,
        '@sf': 64,
        '@todaywifi': 66,
        '@bbi': 61,
        '@gigaedge': 64,
        '@megaedge': 64,
        '@bizedge': 64
    };
    const commandVlan = pkgVlanMap[packageType] || 67;

    // VLAN from Connection Type (For TCT)
    let tctVlan = 'N/A';
    if(connectionType === 'PPPoE') tctVlan = '2422';
    if(connectionType === 'Static IP') tctVlan = '2423';

    // ONU interface parse
    let onuId = '??';
    const cleanInterfaceStr = interfaceStr.trim();
    if (cleanInterfaceStr) {
        if (cleanInterfaceStr.includes(':')) {
            const parts = cleanInterfaceStr.split(':');
            onuId = parts[parts.length - 1].trim();
        } else if (cleanInterfaceStr.includes('/')) {
            const parts = cleanInterfaceStr.split('/');
            onuId = parts[parts.length - 1].trim();
        } else {
            onuId = cleanInterfaceStr;
        }
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
    const isNewPackage = packageType === '@todaywifi' || packageType === '@bbi';
    const preConfigStatus = isPreConfig(rawText);
    const headerLine = preConfigStatus ? `Done Pre-config Bong\n\n` : `Done active please help confirm service\n\n`;
    const footerLine = preConfigStatus ? `Thank you, Bong.` : `Thank you.`;
    const orderLine = data.project && data.project !== 'N/A' ? `Order : ${data.project}\n` : '';

    let outUser = headerLine;
    outUser += `ID: ${data.id}\n`;
    outUser += `Name: ${data.fullName}\n`;
    
    if (ipcamEnabled) {
        const ipAddress = document.getElementById('ipInput').value.trim();
        const portNum = document.getElementById('portInput').value.trim();
        const ipParts = ipAddress.split('.');
        const gateway = (ipParts.length === 4) ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.1` : 'N/A';
        outUser += `IP :${ipAddress}\n`;
        outUser += `Sub : 255.255.252.0\n`;
        outUser += `GW : ${gateway}\n`;
        outUser += `Port : ${portNum}\n\n`;
        outUser += `IP view: 103.216.48.130\n`;
    } else {
        outUser += `Username: ${username}\n`;
        outUser += `Password: ${data.phone}${dnsLine}\n`;
        if (data.aid) outUser += `${data.aid}\n`;
    }
    
    if (orderLine) outUser += `${orderLine}`;
    outUser += `\n${footerLine}`;

    // ==========================================
    // 2. GENERATE COMMAND OUTPUT
    // ==========================================
    let outCmd = '';
    if (onuId !== '??') {
        if (vpnEnabled) {
            // VPN MODE — works for all package types
            const vpnName = data.site || data.name;
            let descLabel = `${data.id}-${vpnName}`;
            const vpnVlan = document.getElementById('vpnVlanInput').value.trim() || commandVlan;
            const vpnSpeed = parseFloat(document.getElementById('vpnSpeedInput').value) || 0;
            const baseValue = vpnSpeed * 1024;
            const policyCir = baseValue;
            const rateLimitCir = baseValue;

            outCmd = `onu ${onuId} description ${descLabel}\n`;
            outCmd += `onu ${onuId} ctc eth 1 policy cir ${policyCir} cbs 1024 ebs 1024\n`;
            outCmd += `onu ${onuId} ctc eth 1 rate_limit cir ${rateLimitCir} pir 1024\n`;
            outCmd += `onu ${onuId} ctc eth 1 vlan pvid ${vpnVlan} pri 0\n`;
            outCmd += `onu ${onuId} ctc eth 1 vlan mode tag`;
        } else if (isNewPackage) {
            let descLabel = `${data.id}-${data.name}`;
            outCmd = `onu ${onuId} description ${descLabel}\n`;
            outCmd += `onu ${onuId} ctc eth 1 vlan pvid ${commandVlan} pri 0\n`;
            outCmd += `onu ${onuId} ctc eth 1 vlan mode tag`;
        } else {
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

    if (typeof saveTicketToHistory === 'function') {
        saveTicketToHistory({
            id: data.id,
            name: data.fullName || data.name,
            mode: 'MAIN',
            ticketText: rawText,
            mac: macInputVal,
            connectionType: connectionType,
            packageType: packageType,
            onuId: onuId,
            interfacePrefix: document.getElementById('interfacePrefix') ? document.getElementById('interfacePrefix').value : 'EPON0/1:'
        });
    }
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
    if(vpnEnabled) toggleVpn();

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

let vpnEnabled = false;
function toggleVpn() {
    vpnEnabled = !vpnEnabled;
    const fields = document.getElementById('vpnFields');
    const dot = document.getElementById('vpnDot');

    if(vpnEnabled) {
        fields.classList.remove('hidden');
        dot.style.transform = 'translateX(20px)';
        dot.style.backgroundColor = 'var(--toggle-on)';
    } else {
        fields.classList.add('hidden');
        dot.style.transform = 'translateX(0px)';
        dot.style.backgroundColor = 'var(--toggle-off)';
        document.getElementById('vpnVlanInput').value = '';
        document.getElementById('vpnSpeedInput').value = '';
    }
}
