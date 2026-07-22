// URL de Google Apps Script (Coloca tu URL de Apps Script cuando esté lista)
const API_URL = "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT";

// 1. Manejador de Generación de QR para Pruebas
document.addEventListener('DOMContentLoaded', () => {
    const btnGenerar = document.getElementById('btn-generar');
    if (btnGenerar) {
        btnGenerar.addEventListener('click', generarQR);
        generarQR(); // Generar uno por defecto al cargar
    }

    // 2. Inicializar Escáner de Cámara QR
    iniciarCamara();
});

function generarQR() {
    const dniInput = document.getElementById('test-dni').value || "70123456";
    const canvas = document.getElementById('qr-canvas');
    
    if (window.QRious) {
        new QRious({
            element: canvas,
            value: dniInput,
            size: 160,
            foreground: '#00f2fe',
            background: '#0a0e17'
        });
    }
}

// 3. Inicialización ultra segura de la Cámara
function iniciarCamara() {
    if (typeof Html5QrcodeScanner !== 'undefined') {
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 200, height: 200 } }, 
            false
        );
        scanner.render(onScanSuccess, onScanError);
    } else {
        console.error("Librería Html5QrcodeScanner no cargada.");
        document.getElementById('reader').innerHTML = "<p style='color:red; text-align:center;'>Error al cargar el motor de cámara.</p>";
    }
}

// 4. Qué hacer cuando la cámara lee un código QR
function onScanSuccess(decodedText) {
    const hora = new Date().toLocaleTimeString();

    // Actualizar recuadro de estado
    document.getElementById('result-badge').className = "result-badge success";
    document.getElementById('result-badge').innerText = "¡CÓDIGO ESCANEADO!";
    document.getElementById('res-nombre').innerText = "Código DNI: " + decodedText;
    document.getElementById('res-msg').innerText = "Registro procesado con éxito.";
    document.getElementById('res-hora').innerText = "Hora: " + hora;

    // Agregar a la tabla
    const tabla = document.getElementById('attendance-table-body');
    const nuevaFila = `
        <tr>
            <td>${hora}</td>
            <td>${decodedText}</td>
            <td><span style="color:#00e676; font-weight:bold;">REGISTRADO</span></td>
        </tr>
    `;
    tabla.insertAdjacentHTML('afterbegin', nuevaFila);

    // Enviar a Google Apps Script en segundo plano
    if (API_URL && API_URL.startsWith("http")) {
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni: decodedText })
        }).catch(e => console.log("Enviado en modo pruebas local."));
    }
}

function onScanError(error) {
    // Análisis de fotogramas continuo
}
