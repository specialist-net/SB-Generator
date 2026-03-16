// Shared Speed Calculator Logic
let speedEnabled = false;

function toggleSpeed() {
    speedEnabled = !speedEnabled;
    const fields = document.getElementById('speedCalculatorFields');
    const dot = document.getElementById('speedDot');

    if (speedEnabled) {
        if (fields) fields.classList.remove('hidden');
        if (dot) {
            dot.style.transform = 'translateX(20px)';
            dot.style.backgroundColor = 'var(--toggle-on)';
        }
    } else {
        if (fields) fields.classList.add('hidden');
        if (dot) {
            dot.style.transform = 'translateX(0px)';
            dot.style.backgroundColor = 'var(--toggle-off)';
        }
        const speedInput = document.getElementById('speedInput');
        const speedOutput = document.getElementById('speedOutput');
        if (speedInput) speedInput.value = '';
        if (speedOutput) speedOutput.value = '';
    }
}

function calculateSpeed() {
    const speedInput = document.getElementById('speedInput');
    const outputField = document.getElementById('speedOutput');
    if (!speedInput || !outputField) return;

    const rawValue = speedInput.value;
    if (!rawValue || rawValue <= 0) {
        outputField.value = '';
        return;
    }

    const speed = parseFloat(rawValue);
    const policeRate = speed * 1048576;
    const burst = Math.round(policeRate * 0.10625);
    outputField.value = `${speed} police rate ${policeRate} burst ${burst} peak-burst ${burst}`;
}
