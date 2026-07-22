// URL de la Apps Script Publicada (CONFIGURAR CON TU URL REAL)
const API_URL = "https://script.google.com/macros/s/AKfycbxD3ry_PqhTz6Bw4UGlwpWP7P5addQTVS9OSRwcdBMbDAcKSN1Jvcu6y_kZtS7-iEO8/exec";

let isScanning = false;

// 1. Inicialización de Cámara y Escáner QR
window.addEventListener('DOMContentLoaded', () => {
    let html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
});

// 2. Evento cuando la cámara detecta un QR
function onScanSuccess(decodedText) {
    if (isScanning) return; // Evitar disparos múltiples en simultáneo
    isScanning = true;

    showStatus("Procesando marca con servidor...");

    // Enviar petición POST a Google Apps Script
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: decodedText })
    })
        .then(res => res.json())
        .then(data => {
            renderResult(data, decodedText);
            setTimeout(() => { isScanning = false; hideStatus(); }, 3000); // Cooldown de 3 segundos
        })
        .catch(err => {
            renderResult({ status: 'error', message: 'Error de red o servidor no responde.' }, decodedText);
            setTimeout(() => { isScanning = false; hideStatus(); }, 3000);
        });
}

function onScanFailure(error) {
    // Escaneo continuo
}

// 3. Renderizado de Resultados en la Pantalla
function renderResult(data, dni) {
    const card = document.getElementById('scan-result-card');
    const badge = document.getElementById('result-badge');
    const resNombre = document.getElementById('res-nombre');
    const resRol = document.getElementById('res-rol');
    const resHora = document.getElementById('res-hora');
    const resMsg = document.getElementById('res-msg');

    card.classList.remove('hidden');

    if (data.status === 'success') {
        badge.innerText = data.estado;
        badge.className = "result-badge " + (data.estado === 'A TIEMPO' ? 'atiempo' : 'tardanza');
        resNombre.innerText = data.nombre;
        resRol.innerText = `${data.rol} - ${data.programa}`;
        resHora.innerText = `Hora: ${data.hora}`;
        resMsg.innerText = data.message;

        agregarFilaTabla(data.hora, dni, data.nombre, data.programa, data.estado);
        playAudioFeedback(true);

    } else {
        badge.innerText = "DENEGADO";
        badge.className = "result-badge error";
        resNombre.innerText = "No Registrado";
        resRol.innerText = "N/A";
        resHora.innerText = "";
        resMsg.innerText = data.message;
        playAudioFeedback(false);
    }
}

// 4. Agregar a la Tabla Visual en Vivo
function agregarFilaTabla(hora, dni, nombre, programa, estado) {
    const tabla = document.getElementById('attendance-table-body');
    const claseBadge = estado === 'A TIEMPO' ? 'atiempo' : 'tardanza';

    const nuevaFila = `
        <tr>
            <td>${hora}</td>
            <td>${dni}</td>
            <td>${nombre}</td>
            <td>${programa}</td>
            <td><span class="result-badge ${claseBadge}" style="font-size:0.7rem; padding:2px 8px;">${estado}</span></td>
        </tr>
    `;
    tabla.insertAdjacentHTML('afterbegin', nuevaFila);
}

// 5. Probador de QR en Pantalla
function generarQRPrueba() {
    const dni = document.getElementById('test-dni').value;
    if (!dni) { alert("Ingrese un DNI"); return; }

    new QRious({
        element: document.getElementById('qr-canvas'),
        value: dni,
        size: 180,
        foreground: '#00f2fe',
        backgroundAlpha: 0
    });
}

// 6. Efectos de Sonido Sintetizados (Web Audio API)
function playAudioFeedback(success) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = success ? 880 : 220; // Agudo para éxito, grave para error
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) { }
}

function showStatus(msg) {
    const st = document.getElementById('scan-status');
    st.innerText = msg;
    st.classList.remove('hidden');
}

function hideStatus() {
    document.getElementById('scan-status').classList.add('hidden');
}
