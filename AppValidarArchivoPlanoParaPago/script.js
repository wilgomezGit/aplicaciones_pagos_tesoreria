let fileContent = '';
let fileName = '';

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
        fileName = file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
            fileContent = e.target.result;
            document.getElementById('processButton').disabled = false;
        };
        reader.readAsText(file);
        document.getElementById('fileName').textContent = `Archivo cargado: ${fileName}`;
    } else {
        alert('Por favor, selecciona un archivo de texto (.txt).');
    }
});

document.getElementById('processButton').addEventListener('click', function() {
    if (!fileContent) {
        alert('Por favor cargue un archivo.');
        return;
    }
    validateFileContent(fileContent);
});

document.getElementById('clearButton').addEventListener('click', function() {
    document.getElementById('fileInput').value = '';
    document.getElementById('output').textContent = '';
    document.getElementById('fileName').textContent = 'No hay archivos seleccionados';
    document.getElementById('validationMessage').textContent = '';
    fileContent = '';
    document.getElementById('processButton').disabled = true;
});

function validateFileContent(content) {
    const lines = content.split(/\r\n|\n/);

    // ✅ Solo permite: letras, números, espacios, ñÑ, -, /, \ y :
    const allowedRegex = /^[a-zA-Z0-9ñÑ\s\/\\:\-]+$/;

    let output = '';
    let hasErrors = false;

    lines.forEach((line, index) => {
        const lineNumber = index + 1;

        if (line.length === 0) {
            return; // aceptar línea vacía
        }

        if (!allowedRegex.test(line)) {
            hasErrors = true;
            // buscar y mostrar exactamente qué caracteres son inválidos
            const invalidChars = [...line].filter(ch => !allowedRegex.test(ch));
            const invalidDesc = invalidChars.map(ch => `"${describeChar(ch)}"`).join(', ');

            output += `<div><span class="highlight">Línea ${lineNumber}:</span> "${escapeHtml(line)}" → ❌ Caracteres inválidos: ${invalidDesc}</div>`;
        }
    });

    document.getElementById('output').innerHTML = output || '<small>✅ No se encontraron caracteres inválidos.</small>';

    if (hasErrors) {
        document.getElementById('validationMessage').textContent = '⚠️ Se encontraron errores en el archivo. Corrige los caracteres inválidos antes de continuar.';
        document.getElementById('validationMessage').style.color = 'red';
    } else {
        document.getElementById('validationMessage').textContent = '✅ Archivo correcto. ¡Listo para cargar en BANCOLOMBIA!';
        document.getElementById('validationMessage').style.color = 'green';
    }
}

// Escapa HTML para evitar inyección en el output
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Devuelve descripción legible del carácter
function describeChar(ch) {
    if (ch === ' ') return 'espacio';
    if (ch === '\t') return 'tabulación';
    if (ch === '\r') return 'retorno de carro';
    const code = ch.charCodeAt(0);
    const printable = escapeHtml(ch);
    if (printable.trim() !== '') return printable;
    return `U+${code.toString(16).toUpperCase()}`;
}

function goToHome() {
    window.location.href = "../index.html";
}
