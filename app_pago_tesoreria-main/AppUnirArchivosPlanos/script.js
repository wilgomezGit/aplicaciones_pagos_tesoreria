let files = [];

const fileInput = document.getElementById('fileInput');
const combineButton = document.getElementById('combineButton');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const downloadLink = document.getElementById('downloadLink');

/* CUANDO SE SELECCIONAN ARCHIVOS */
fileInput.addEventListener('change', () => {
    files = []; // 👈 limpiamos archivos anteriores
    fileList.innerHTML = "";
    downloadLink.style.display = "none";

    if (fileInput.files.length === 0) {
        combineButton.disabled = true;
        fileCount.textContent = "No hay archivos seleccionados";
        return;
    }

    Array.from(fileInput.files).forEach(file => {
        files.push(file);
        const li = document.createElement('li');
        li.textContent = file.name;
        fileList.appendChild(li);
    });

    fileCount.textContent = `${files.length} archivo(s) seleccionados`;
    combineButton.disabled = false; // 👈 AQUÍ se habilita el botón
});

/* UNIR ARCHIVOS */
combineButton.addEventListener('click', async () => {
    if (files.length === 0) {
        alert("Primero selecciona archivos.");
        return;
    }

    combineButton.disabled = true;
    combineButton.textContent = "Procesando...";

    let combinedText = '';

    for (const file of files) {
        const text = await file.text();
        combinedText += text.trimEnd() + '\n';
    }

    const blob = new Blob([combinedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    downloadLink.href = url;
    downloadLink.download = "archivos_unidos.txt";
    downloadLink.textContent = "⬇ Descargar Archivo Unificado";
    downloadLink.style.display = "inline-block";

    combineButton.textContent = "Unir Archivos";
    combineButton.disabled = false;
});

const clearButton = document.getElementById('clearButton');

clearButton.addEventListener('click', () => {
    // Limpiar variables
    files = [];

    // Limpiar input file
    fileInput.value = "";

    // Limpiar lista
    fileList.innerHTML = "";

    // Ocultar descarga
    downloadLink.style.display = "none";
    downloadLink.href = "";

    // Reset texto
    fileCount.textContent = "No hay archivos seleccionados";

    // Deshabilitar botón unir
    combineButton.disabled = true;
});

function goToHome() {
    window.location.href = "../index.html";
}