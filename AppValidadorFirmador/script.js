function goToHome() {
    window.location.href = '../index.html';
}

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// --- REGLAS CONTABLES ---
const validationRules = [
    { type: 'CE', aux: ['23802504','25050101','25050201'], bank: '5521-2' },
    { type: 'EK', aux: ['23802538','25051101','25051201'], bank: '6986-6' },
    { type: 'CJ', aux: ['28640515'], bank: '1140-2' },
    { type: 'EE', aux: ['28681615', '28681605', '28681609'], bank: '8862-7' },
    { type: 'EE', aux: ['28681610'], bank: '1806-1' },
    { type: 'EG', aux: ['28681620'], bank: '3404-4' },
    { type: 'CV', aux: ['28610511'], bank: '1305-2' },
    { type: 'EO', aux: ['23802518'], bank: '0462-3' },
    { type: 'CEX', aux: ['23802509'], bank: '0337-9' },
    { type: 'ICE', aux: ['23802505','25050101','25050201'], bank: '0634-3' },
    { type: 'RCE', aux: ['23802527','25050901','25051001'], bank: '6462-9' },
    { type: 'CL', aux: ['28959506'], bank: '0240-9' },
    { type: 'CD', aux: ['28959507'], bank: '0151-4' },
    { type: 'CEC', aux: ['23802511'], bank: '5521-2' },
    { type: 'CER', aux: ['23802510'], bank: '5521-2' },
    { type: 'CSU', aux: ['23802512', '23802534'], bank: '5346-1' }
];

// --- ESTADO DE LA APLICACIÓN ---
let pendingFiles = [];
let stats = { correct: 0, error: 0 };
const { PDFDocument, rgb } = PDFLib;

// --- ELEMENTOS DEL DOM ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const btnValidate = document.getElementById('btn-validate');
const btnClear = document.getElementById('btn-clear');
const btnClearFirma = document.getElementById('btn-clear-firma');
const resultsList = document.getElementById('results-list');
const firmaInput = document.getElementById('firma-input');
const textoExtraInput = document.getElementById('textoExtra-input');
const estadoLabel = document.getElementById("status");

// --- EVENT LISTENERS ---
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

btnClear.addEventListener('click', resetPDFs);
btnClearFirma.addEventListener('click', () => {
    firmaInput.value = '';
});

btnValidate.addEventListener('click', startProcessing);

// --- LÓGICA PRINCIPAL ---

function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
        alert("Por favor, selecciona solo archivos PDF.");
        return;
    }

    pendingFiles = [...pendingFiles, ...pdfFiles];
    btnValidate.disabled = false;
    dropZone.querySelector('p').textContent = `${pendingFiles.length} archivos listos para procesar.`;
}

// Limpia SOLO los PDFs y resultados, sin tocar la firma ni la fecha
function resetPDFs() {
    pendingFiles = [];
    stats = { correct: 0, error: 0 };
    updateStatsUI();
    resultsList.innerHTML = '';
    btnValidate.disabled = true;
    fileInput.value = '';
    dropZone.querySelector('p').textContent = 'Arrastra tus comprobantes PDF aquí';
    document.getElementById('progress-container').style.display = 'none';
    estadoLabel.innerHTML = '';
}

async function extractTextFromPDFStore(file) {
    const arrayBuffer = await file.arrayBuffer();
    const typedarray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
    
    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + " ";
    }
    await pdf.destroy();
    return fullText;
}

async function processSinglePDFValidation(file, fullText) {
    const nameMatch = file.name.match(/([A-Z]+)-0*(\d+)/i);
    let compType = "DESC";
    let compNumber = "000";
    let formattedName = file.name;

    if (nameMatch) {
        compType = nameMatch[1].toUpperCase();
        compNumber = nameMatch[2];
        formattedName = `${compType}-${compNumber}`;
    } else {
        return {
            status: 'error',
            message: `${file.name} ERROR: comprobante no válido (Formato de nombre incorrecto)`,
            formattedName: 'SIN-CODIGO', isValid: false
        };
    }

    if (/cheque/i.test(fullText)) {
        return {
            status: 'ignored',
            message: `➖ ${formattedName} ignorado (Es Cheque)`,
            formattedName: formattedName, isValid: false
        };
    }

    const possibleAuxiliaries = fullText.match(/\b\d{8}\b/g) || [];
    const validAuxList = validationRules.flatMap(r => r.aux);
    const foundAux = possibleAuxiliaries.find(num => validAuxList.includes(num));
    
    const bankMatch = fullText.match(/\b(\d{4}-\d)\b/);
    const foundBank = bankMatch ? bankMatch[1] : null;

    if (!foundAux) {
        return { status: 'error', message: `❌ ${formattedName} ERROR: auxiliar incorrecto (No detectado)`, formattedName: formattedName, isValid: false };
    }
    if (!foundBank) {
        return { status: 'error', message: `❌ ${formattedName} ERROR: no coincide cuenta bancaria (No detectada)`, formattedName: formattedName, isValid: false };
    }

    const ruleResult = validateBusinessRules(compType, foundAux, foundBank, formattedName);
    return {
        status: ruleResult.status,
        message: ruleResult.message,
        formattedName: formattedName,
        isValid: ruleResult.status === 'correct'
    };
}

function validateBusinessRules(compType, aux, bank, formattedName) {
    const applicableRules = validationRules.filter(r => r.type === compType);

    if (applicableRules.length === 0) {
        return { status: 'error', message: `❌ ${formattedName} ERROR: comprobante no válido` };
    }

    const ruleWithAux = applicableRules.find(r => r.aux.includes(aux));

    if (!ruleWithAux) {
        return { status: 'error', message: `❌ ${formattedName} ERROR: auxiliar incorrecto` };
    }

    if (ruleWithAux.bank !== bank) {
        return { status: 'error', message: `❌ ${formattedName} ERROR: no coincide cuenta bancaria` };
    }

    return {
        status: 'correct',
        message: `✅ ${formattedName} correcto (${aux} - ${bank})`
    };
}

async function startProcessing() {
    if (pendingFiles.length === 0) return;

    const firmaFile = firmaInput.files[0];
    if (!firmaFile) {
        alert("Por favor, sube la imagen de firma antes de procesar.");
        return;
    }

    const textoExtra = textoExtraInput.value;
    
    btnValidate.disabled = true;
    btnClear.disabled = true;
    
    resultsList.innerHTML = '';
    stats = { correct: 0, error: 0 };
    updateStatsUI();

    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    progressContainer.style.display = 'block';
    progressBar.max = pendingFiles.length;
    
    estadoLabel.innerHTML = "⏳ Validando comprobantes...";

    let validationResults = [];

    // Fase 1: Validar
    for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        try {
            const fullText = await extractTextFromPDFStore(file);
            const result = await processSinglePDFValidation(file, fullText);
            
            if (result.status === 'correct') stats.correct++;
            else if (result.status === 'error') stats.error++;

            renderResult(result);
            validationResults.push({ file: file, result: result });
        } catch (err) {
            const errRes = { status: 'error', message: `ERROR: No se pudo procesar ${file.name}`, formattedName: 'ERROR', isValid: false };
            stats.error++;
            renderResult(errRes);
            validationResults.push({ file: file, result: errRes });
        }

        progressBar.value = i + 1;
        progressText.textContent = `${i + 1}/${pendingFiles.length}`;
        updateStatsUI();
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Preguntar al usuario si hubo errores
    let proceedWithSigning = true;
    if (stats.error > 0) {
        proceedWithSigning = confirm(`⚠️ Se encontraron ${stats.error} errores de validación.\n\n¿Deseas firmar y generar el PDF de todos modos?`);
    }

    if (!proceedWithSigning) {
        estadoLabel.innerHTML = "❌ Proceso cancelado por el usuario.";
        btnClear.disabled = false;
        btnValidate.disabled = false;
        return;
    }

    // Fase 2: Firmar y Unir
    estadoLabel.innerHTML = "⏳ Aplicando firmas y generando PDF final...";
    
    try {
        const firmaBytes = await firmaFile.arrayBuffer();
        const mergedPdf = await PDFDocument.create();

        // Para generar nombre consecutivo
        let fileCounter = parseInt(localStorage.getItem('pdfSignCounter') || '1');

        for (let i = 0; i < validationResults.length; i++) {
            const item = validationResults[i];
            estadoLabel.innerHTML = `Firmando documento ${i + 1} de ${validationResults.length}...`;
            
            const bytes = await item.file.arrayBuffer();
            const pdf = await PDFDocument.load(bytes);
            const paginas = pdf.getPages();
            const pagina = paginas[0];
            
            const comprobante = item.result.formattedName;
            const { width } = pagina.getSize();

            // Añadir texto comprobante
            pagina.drawText(comprobante, {
                x: width / 2 - 40,
                y: 80,
                size: 14,
                color: rgb(0,0,0)
            });

            // Añadir texto extra (fecha vto)
            if (textoExtra) {
                pagina.drawText(textoExtra, {
                    x: 380,
                    y: 638,
                    size: 8,
                    color: rgb(0,0,0)
                });
            }

            // Añadir imagen de firma
            let firmaImg;
            if (firmaFile.type.includes("png")) {
                firmaImg = await pdf.embedPng(firmaBytes);
            } else {
                firmaImg = await pdf.embedJpg(firmaBytes);
            }

            pagina.drawImage(firmaImg, {
                x: 40,
                y: 330,
                width: 110,
                height: 130
            });

            // Copiar al PDF unificado
            const paginasCopiar = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            paginasCopiar.forEach(p => {
                mergedPdf.addPage(p);
            });
        }
        
        estadoLabel.innerHTML = "Generando archivo final...";
        const pdfFinal = await mergedPdf.save();
        const blob = new Blob([pdfFinal], {type: "application/pdf"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        
        const downloadedFileName = `comprobantesFirmados${fileCounter}.pdf`;
        link.download = downloadedFileName;
        link.click();

        // Incrementar y guardar el contador
        localStorage.setItem('pdfSignCounter', (fileCounter + 1).toString());

        estadoLabel.innerHTML = `✅ ${downloadedFileName} generado correctamente`;
        
        pendingFiles = [];
        dropZone.querySelector('p').textContent = 'Proceso finalizado. Puedes subir más comprobantes.';

    } catch (error) {
        console.error(error);
        estadoLabel.innerHTML = "❌ Error durante la generación del PDF con firma.";
    }

    btnClear.disabled = false;
}

function renderResult(result) {
    const li = document.createElement('li');
    li.textContent = result.message;
    li.className = `result-${result.status}`;
    resultsList.appendChild(li);
    resultsList.scrollTop = resultsList.scrollHeight;
}

function updateStatsUI() {
    document.getElementById('count-correct').textContent = stats.correct;
    document.getElementById('count-error').textContent = stats.error;
}
