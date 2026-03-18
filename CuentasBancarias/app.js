/* ================================================
   APP.JS – Módulo Unificado Cuentas Bancarias
   ================================================
   Flujo: Cargar .txt → Parsear → Tabla editable
          → Descargar Excel / Siesa / Plano
   ================================================ */

let parsedData = [];
let hasErrors = false;
let isExcelMode = false;

/* ========================================
   ELEMENTOS DEL DOM
   ======================================== */
const fileInput = document.getElementById('fileInput');
const fileNameDiv = document.getElementById('fileName');
const btnProcesar = document.getElementById('btnProcesar');
const btnCancelar = document.getElementById('btnCancelar');
const btnExcel = document.getElementById('btnExcel');
const btnSiesa = document.getElementById('btnSiesa');
const btnPlano = document.getElementById('btnPlano');
const dataHead = document.getElementById('dataHead');
const dataBody = document.getElementById('dataBody');
const downloadButtons = document.getElementById('downloadButtons');
const errorMessage = document.getElementById('errorMessage');

/* ========================================
   INICIALIZACIÓN
   ======================================== */
fileInput.addEventListener('change', function () {
    if (this.files.length > 0) {
        fileNameDiv.textContent = this.files[0].name;
        btnProcesar.disabled = false;
        btnCancelar.disabled = false;
    } else {
        fileNameDiv.textContent = "No hay archivos seleccionados";
        btnProcesar.disabled = true;
    }
});

btnProcesar.addEventListener('click', processFile);
btnCancelar.addEventListener('click', clearData);
btnExcel.addEventListener('click', downloadExcel);
btnSiesa.addEventListener('click', downloadSiesa);
btnPlano.addEventListener('click', downloadPlano);

/* ========================================
   MAPEO DE TIPO DE CUENTA
   ======================================== */
function mapTipoCuenta(tipo) {
    if (tipo === '7') return 'AHORROS';
    if (tipo === '1') return 'CORRIENTE';
    return 'ERROR';
}

/* ========================================
   MAPEO DE BANCOS
   ======================================== */
const bancoMap = {
    "000001014": "ITAU",
    "000001031": "BANCOLDEX S.A.",
    "000001040": "BANCO AGRARIO",
    "000001047": "BANCO MUNDO MUJER",
    "000001053": "BANCO W S.A.",
    "000001058": "BANCO PROCREDIT COLOMBIA",
    "000001059": "BANCAMIA S.A.",
    "000001060": "BANCO PICHINCHA",
    "000001061": "BANCOOMEVA",
    "000001062": "BANCO FALABELLA S.A.",
    "000001063": "BANCO FINANDINA S.A.",
    "000001064": "BANCO MULTIBANK S.A.",
    "000001065": "BANCO SANTANDER DE NEGOCIOS COLOMBIA S.A",
    "000001066": "BANCO COOPERATIVO COOPCENTRAL",
    "000001067": "BANCO COMPARTIR S.A",
    "000001070": "LULO BANK",
    "000001121": "FINANCIERA JURISCOOP S.A.",
    "000001283": "COOPERATIVA FINANCIERA DE ANTIOQUIA",
    "000001289": "COOTRAFA COOPERATIVA FINANCIERA",
    "000001292": "CONFIAR COOPERATIVA FINANCIERA",
    "000001370": "COLTEFINANCIERA S.A",
    "000001506": "PIBANK",
    "000001507": "NEQUI",
    "000001808": "BOLD CF",
    "000001809": "NU BANK",
    "000001811": "RAPPIPAY",
    "000001819": "BANCO CONTACTAR SA",
    "005600010": "BANCO DE BOGOTA",
    "005600023": "BANCO POPULAR",
    "005600065": "ITAU antes Corpbanca",
    "005600078": "BANCOLOMBIA",
    "005600094": "CITIBANK",
    "005600104": "HSBC",
    "005600120": "BANCO SUDAMERIS",
    "005600133": "BBVA COLOMBIA",
    "005600191": "BANCO COLPATRIA",
    "005600230": "BANCO DE OCCIDENTE",
    "005600829": "BANCO CAJA SOCIAL BCSC SA",
    "005895142": "BANCO DAVIVIENDA SA",
    "006013677": "BANCO AV VILLAS"
};

function mapBanco(codigo) {
    return bancoMap[codigo] || "DESCONOCIDO";
}

/* ========================================
   MAPEO DE TIPO DE DOCUMENTO
   ======================================== */
function mapTipoDocumento(tipo) {
    const tipoDocumentoMap = {
        "1": "CÉDULA CIUDADANÍA",
        "2": "CÉDULA EXTRANJERÍA",
        "3": "NIT",
        "4": "TARJETA IDENTIDAD",
        "5": "PASAPORTE"
    };
    return tipoDocumentoMap[tipo] || "TIPO DESCONOCIDO";
}

/* ========================================
   DATOS BANCO PARA FORMATO SIESA
   ======================================== */
const bancoSiesaData = {
    'ABN AMRO': { banco: '08', dato3: '005600081' },
    'BANCO DE BOGOTA': { banco: '01', dato3: '000001001' },
    'BANCO POPULAR': { banco: '02', dato3: '000001002' },
    'GRAN BANCO - BANCAFE': { banco: '05', dato3: '005600052' },
    'SANTANDER': { banco: '06', dato3: '000001065' },
    'BANCOLOMBIA': { banco: '07', dato3: '000001007' },
    'CITIBANK': { banco: '09', dato3: '000001009' },
    'BANCO SUDAMERIS': { banco: '12', dato3: '000001012' },
    'BBVA COLOMBIA': { banco: '13', dato3: '000001013' },
    'BANCO COLPATRIA': { banco: '19', dato3: '000001019' },
    'UNION COLOMBIANO': { banco: '22', dato3: '005600227' },
    'BANCO DE OCCIDENTE': { banco: '23', dato3: '000001023' },
    'STANDARD CHARTERED': { banco: '24', dato3: '000001024' },
    'BANCO TEQUENDAMA': { banco: '29', dato3: '005600298' },
    'BANCOLDEX S.A.': { banco: '31', dato3: '000001031' },
    'BANCO CAJA SOCIAL BCSC SA': { banco: '32', dato3: '000001032' },
    'BANCO SUPERIOR': { banco: '34', dato3: '005600340' },
    'MEGABANCO': { banco: '36', dato3: '000001036' },
    'NEQUI': { banco: '37', dato3: '000001507' },
    'BANCO AGRARIO': { banco: '40', dato3: '000001040' },
    'BANCO DAVIVIENDA SA': { banco: '51', dato3: '000001051' },
    'BANCO AV VILLAS': { banco: '52', dato3: '000001052' },
    'BANCAMIA S.A.': { banco: '59', dato3: '000001059' },
    'BANCO FALABELLA S.A.': { banco: '62', dato3: '000001062' },
    'BANCO PICHINCHA': { banco: '64', dato3: '000001060' },
    'BANCO W S.A.': { banco: '65', dato3: '000001053' },
    'BANCO COOPERATIVO COOPCENTRAL': { banco: '66', dato3: '000001066' },
    'BANCOOMEVA': { banco: '61', dato3: '000001061' },
    'BANCO SERFINANZA': { banco: '68', dato3: '000001069' },
    'DAVIPLATA': { banco: '69', dato3: '000001551' },
    'BANCO FINANDINA S.A.': { banco: '71', dato3: '000001063' },
    'LULO BANK': { banco: '1070', dato3: '000001070' },
    'RAPPIPAY': { banco: '1811', dato3: '000001811' },
    'BOLD CF': { banco: '1808', dato3: '000001808' },
    'GLOBAL66': { banco: '1814', dato3: '000001814' },
    'PIBANK': { banco: '1560', dato3: '000001560' },
    'BANCO CONTACTAR SA': { banco: '1819', dato3: '000001819' },
    'BANCO MUNDO MUJER': { banco: '60', dato3: '000001047' },
    'ITAU antes Corpbanca': { banco: '63', dato3: '000000006' },
    'NU BANK': { banco: '1809', dato3: '000001809' },
    'ITAU': { banco: '63', dato3: '000001014' },
    'BANCO PROCREDIT COLOMBIA': { banco: '58', dato3: '000001058' },
    'BANCO MULTIBANK S.A.': { banco: '64', dato3: '000001064' },
    'BANCO SANTANDER DE NEGOCIOS COLOMBIA S.A': { banco: '06', dato3: '000001065' },
    'BANCO COMPARTIR S.A': { banco: '67', dato3: '000001067' },
    'FINANCIERA JURISCOOP S.A.': { banco: '121', dato3: '000001121' },
    'COOPERATIVA FINANCIERA DE ANTIOQUIA': { banco: '283', dato3: '000001283' },
    'COOTRAFA COOPERATIVA FINANCIERA': { banco: '289', dato3: '000001289' },
    'CONFIAR COOPERATIVA FINANCIERA': { banco: '292', dato3: '000001292' },
    'COLTEFINANCIERA S.A': { banco: '370', dato3: '000001370' },
    'HSBC': { banco: '10', dato3: '005600104' },
    'BANCOLDEX S.A.': { banco: '31', dato3: '000001031' }
};

/* ========================================
   PROCESAR ARCHIVO
   ======================================== */
function processFile() {
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecciona un archivo.');
        return;
    }

    const fileName = file.name.toLowerCase();
    const isExcelFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods');

    const reader = new FileReader();
    
    if (isExcelFile) {
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Get headers from Excel
            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            let headers = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
                headers.push(cell ? cell.v : `Columna ${C}`);
            }
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            parseExcelFile(jsonData, headers);
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = function (e) {
            const content = e.target.result;
            parseFile(content);
        };
        reader.readAsText(file);
    }
}

/* ========================================
   PARSEAR CONTENIDO DEL ARCHIVO
   ======================================== */
function parseFile(content) {
    const rows = content.split('\n');
    dataBody.innerHTML = '';
    parsedData = [];
    hasErrors = false;
    isExcelMode = false;

    rows.forEach((line, index) => {
        const columns = line.split(',');

        if (columns.length >= 6) {
            const noCuenta = columns[0].trim();
            const tipoCuentaCodigo = columns[1].trim();
            const nombreTitular = columns[2].trim();
            const bancoCodigo = columns[3].trim();
            const numeroDocumento = columns[4].trim();
            const tipoDocumentoCodigo = columns[5].trim();

            const tipoCuenta = mapTipoCuenta(tipoCuentaCodigo);
            const banco = mapBanco(bancoCodigo);
            const tipoDocumento = mapTipoDocumento(tipoDocumentoCodigo);

            const rowHasError =
                tipoCuenta === "ERROR" ||
                banco === "DESCONOCIDO" ||
                tipoDocumento === "TIPO DESCONOCIDO";

            if (rowHasError) hasErrors = true;

            parsedData.push({
                index: index + 1,
                noCuenta: noCuenta,
                tipoCuentaCodigo: tipoCuentaCodigo,
                tipoCuenta: tipoCuenta,
                nombreTitular: nombreTitular,
                bancoCodigo: bancoCodigo,
                banco: banco,
                numeroDocumento: numeroDocumento,
                tipoDocumentoCodigo: tipoDocumentoCodigo,
                tipoDocumento: tipoDocumento,
                hasError: rowHasError
            });
        }
    });

    renderTable();
    showDownloadButtons();
}

/* ========================================
   PARSEAR CONTENIDO DEL EXCEL SIESA
   ======================================== */
function parseExcelFile(jsonData, headers) {
    dataBody.innerHTML = '';
    parsedData = jsonData;
    hasErrors = false;
    isExcelMode = true;
    
    // Validamos si tiene datos
    if(parsedData.length === 0) {
        alert("El archivo Excel está vacío.");
        return;
    }

    // Mapeo opcional para que los títulos se vean mejor en pantalla
    const excelHeaderAliases = {
        'Código del proveedor': 'Código Proveedor',
        'Sucursal del proveedor': 'Sucursal',
        'Banco del proveedor': 'Banco',
        'Número de cuenta corriente o de ahorros': 'Número Cuenta',
        'Tipo de cuenta 1=cta cte 2=cta ahorro': 'Tipo Cuenta',
        'formato': 'Formato',
        'forma de pago': 'Forma Pago',
        'Cuenta por defecto 0= cta reg. no es default, 1=cta reg. es default': 'Cuenta Defecto',
        'DATO 1': 'DATO 1',
        'DATO 2': 'DATO 2',
        'DATO 3': 'DATO 3',
        'DATO 4': 'DATO 4',
        'DATO 5': 'DATO 5',
        'DATO 6': 'DATO 6',
        'DATO 7': 'DATO 7',
        'DATO 8': 'DATO 8'
    };

    // Configurar encabezados dinámicamente
    dataHead.innerHTML = '';
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        // Usa el alias más corto si existe, de lo contrario usa el original
        th.textContent = excelHeaderAliases[h] || h;
        headerRow.appendChild(th);
    });
    // Agregar columna de acciones para el Excel también
    const thA = document.createElement('th');
    thA.textContent = "Acciones";
    headerRow.appendChild(thA);
    dataHead.appendChild(headerRow);
    
    renderTable();
    showDownloadButtons();
}

/* ========================================
   RENDERIZAR TABLA
   ======================================== */
function renderTable() {
    dataBody.innerHTML = '';
    hasErrors = false;

    if (!isExcelMode) {
        // Encabezados estándar TXT
        dataHead.innerHTML = `
            <tr>
                <th>No.</th>
                <th>No. Documento</th>
                <th>Nombre Titular</th>
                <th>No. Cuenta</th>
                <th>Nombre Banco</th>
                <th>Tipo Cuenta</th>
                <th>Tipo Documento</th>
                <th>Acciones</th>
            </tr>
        `;
        
        parsedData.forEach((row, idx) => {
            if (row.hasError) hasErrors = true;

            const tr = document.createElement('tr');
            if (row.hasError) tr.classList.add('row-error');

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${row.numeroDocumento}</td>
                <td>${row.nombreTitular}</td>
                <td>${row.noCuenta}</td>
                <td class="${row.banco === 'DESCONOCIDO' ? 'cell-error' : ''}">${row.banco}</td>
                <td class="${row.tipoCuenta === 'ERROR' ? 'cell-error' : ''}">${row.tipoCuenta}</td>
                <td class="${row.tipoDocumento === 'TIPO DESCONOCIDO' ? 'cell-error' : ''}">${row.tipoDocumento}</td>
                <td><button class="btn-delete-row" onclick="deleteRow(${idx})">🗑️ Eliminar</button></td>
            `;

            dataBody.appendChild(tr);
        });
    } else {
        // Renderizar Excel
        let headers = Object.keys(parsedData[0] || {});
        parsedData.forEach((row, idx) => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] !== undefined ? row[header] : "";
                tr.appendChild(td);
            });
            // Acciones
            const tdA = document.createElement('td');
            tdA.innerHTML = `<button class="btn-delete-row" onclick="deleteRow(${idx})">🗑️ Eliminar</button>`;
            tr.appendChild(tdA);
            
            dataBody.appendChild(tr);
        });
    }

    updateErrorMessage();
    updateDownloadButtons();
}

/* ========================================
   ELIMINAR FILA
   ======================================== */
function deleteRow(idx) {
    parsedData.splice(idx, 1);
    renderTable();
}

/* ========================================
   MENSAJES DE ERROR
   ======================================== */
function updateErrorMessage() {
    const errorCount = parsedData.filter(r => r.hasError).length;

    if (errorCount > 0) {
        errorMessage.style.display = 'block';
        errorMessage.style.backgroundColor = '#f8d7da';
        errorMessage.style.color = '#721c24';
        errorMessage.style.border = '1px solid #f5c6cb';
        errorMessage.textContent = `⚠️ ${errorCount} fila(s) con errores. Elimínalas para habilitar las descargas.`;
    } else if (parsedData.length > 0) {
        errorMessage.style.display = 'block';
        errorMessage.style.backgroundColor = '#d4edda';
        errorMessage.style.color = '#155724';
        errorMessage.style.border = '1px solid #c3e6cb';
        errorMessage.textContent = `✅ ${parsedData.length} registro(s) procesados correctamente. ¡Listo para descargar!`;
    } else {
        errorMessage.style.display = 'none';
    }
}

/* ========================================
   MOSTRAR / ACTUALIZAR BOTONES DE DESCARGA
   ======================================== */
function showDownloadButtons() {
    if (parsedData.length > 0) {
        downloadButtons.style.display = 'flex';
    }
}

function updateDownloadButtons() {
    const canDownload = !hasErrors && parsedData.length > 0;
    btnExcel.disabled = !canDownload;
    btnSiesa.disabled = !canDownload;
    btnPlano.disabled = !canDownload;
}

/* ========================================
   FUNCIÓN AUXILIAR PARA DESCARGAS
   (compatible con file://)
   Usa data URI en vez de blob URL para
   evitar el bloqueo de Chrome en file://
   ======================================== */
function arrayToBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function triggerDownload(blob, filename) {
    const reader = new FileReader();
    reader.onload = function () {
        const a = document.createElement('a');
        a.href = reader.result;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    reader.readAsDataURL(blob);
}

/* Descarga directa para archivos Excel (binarios) */
function triggerExcelDownload(wbArrayBuffer, filename) {
    const uint8 = new Uint8Array(wbArrayBuffer);
    const b64 = arrayToBase64(uint8);
    const a = document.createElement('a');
    a.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* Descarga directa para archivos de texto */
function triggerTextDownload(textContent, filename) {
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* ========================================
   DESCARGAR EXCEL
   ======================================== */
function downloadExcel() {
    if (hasErrors || parsedData.length === 0) return;

    if (isExcelMode) {
        alert("El archivo subido ya es un Excel.");
        return;
    }

    const sheetData = [
        ['No.', 'No. DOCUMENTO', 'NOMBRE TITULAR', 'No. CUENTA', 'BANCO', 'TIPO CUENTA', 'TIPO DOCUMENTO']
    ];

    parsedData.forEach((item, idx) => {
        sheetData.push([
            idx + 1,
            item.numeroDocumento,
            item.nombreTitular,
            item.noCuenta,
            item.banco,
            item.tipoCuenta,
            item.tipoDocumento
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos Cuentas Bancarias');

    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    triggerExcelDownload(wbOut, 'DatosCuentasBancarias.xlsx');
}

/* ========================================
   DESCARGAR FORMATO SIESA
   ======================================== */
function downloadSiesa() {
    if (hasErrors || parsedData.length === 0) return;

    if (isExcelMode) {
       alert("El archivo subido ya tiene el formato Siesa.");
       return;
    }

    const headers = [
        'Código del proveedor',
        'Sucursal del proveedor',
        'Banco del proveedor',
        'Número de cuenta corriente o de ahorros',
        'Tipo de cuenta 1=cta cte 2=cta ahorro',
        'formato',
        'forma de pago',
        'Cuenta por defecto 0= cta reg. no es default, 1=cta reg. es default',
        'DATO 1',
        'DATO 2',
        'DATO 3',
        'DATO 4',
        'DATO 5',
        'DATO 6',
        'DATO 7',
        'DATO 8'
    ];

    const siesaData = [];

    parsedData.forEach(item => {
        const bancoInfo = bancoSiesaData[item.banco] || { banco: 'ERROR', dato3: '000000000' };

        const tipoCuenta =
            item.tipoCuenta === 'AHORROS' ? '2' :
                item.tipoCuenta === 'CORRIENTE' ? '1' : 'ERROR';

        let dato2 = 'ERROR';
        if (item.tipoDocumento === 'CÉDULA CIUDADANÍA') dato2 = '1';
        else if (item.tipoDocumento === 'NIT') dato2 = '3';
        else if (item.tipoDocumento === 'CÉDULA EXTRANJERÍA') dato2 = '2';

        const dato6 =
            item.tipoCuenta === 'AHORROS' ? '37' :
                item.tipoCuenta === 'CORRIENTE' ? '27' : 'ERROR';

        siesaData.push([
            item.numeroDocumento, '001', bancoInfo.banco, item.noCuenta, tipoCuenta,
            '00000509', '1', '1',
            item.numeroDocumento, dato2, bancoInfo.dato3, item.noCuenta,
            '', dato6, '', '00000'
        ]);
    });

    const sheetData = [headers, ...siesaData];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pago electrónico');

    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    triggerExcelDownload(wbOut, 'FormatoSiesa.xlsx');
}

/* ========================================
   DESCARGAR ARCHIVO PLANO DE INSCRIPCIÓN
   ======================================== */
function downloadPlano() {
    if (hasErrors || parsedData.length === 0) return;

    let lineas = [];
    lineas.push("000000100000001001");

    if (isExcelMode) {
        // Generar plano a partir de Excel Siesa
        parsedData.forEach((row, index) => {
            let consecutivo = (index + 2).toString();
            let linea = consecutivo.padStart(7, "0"); // consecutivo de 7 dígitos
            linea += "0"; // cero fijo
            linea += "63400020011"; // bloque fijo

            linea += row["Código del proveedor"] || "";
            linea = linea.padEnd(34, " ");

            linea += (row["Sucursal del proveedor"] || "");
            linea += "1";
            linea += (row["Banco del proveedor"] || "");

            linea += " ".repeat(8);

            linea += row["Número de cuenta corriente o de ahorros"] || "";
            linea = linea.padEnd(78, " ");

            linea += row["Tipo de cuenta 1=cta cte 2=cta ahorro"] || "";
            linea += row["formato"] || "";
            linea += row["forma de pago"] || "";
            linea += row["Cuenta por defecto 0= cta reg. no es default, 1=cta reg. es default"] || "";
            linea += "1";

            linea += row["DATO 1"] || "";
            linea = linea.padEnd(140, " ");
            
            linea += row["DATO 2"] || "";
            linea = linea.padEnd(190, " ");
            
            linea += row["DATO 3"] || "";
            linea = linea.padEnd(240, " ");
            
            linea += row["DATO 4"] || "";
            
            while (linea.length < 340) linea += " ";
            linea += row["DATO 6"] || "";

            linea = linea.padEnd(440, " ");
            linea += row["DATO 8"] || "";

            linea = linea.padEnd(840, " ");
            lineas.push(linea);
        });

    } else {
        // Generar plano a partir de TXT
        parsedData.forEach((item, index) => {
            const bancoInfo = bancoSiesaData[item.banco] || { banco: 'ERROR', dato3: '000000000' };

            const tipoCuenta =
                item.tipoCuenta === 'AHORROS' ? '2' :
                    item.tipoCuenta === 'CORRIENTE' ? '1' : 'ERROR';

            let dato2 = 'ERROR';
            if (item.tipoDocumento === 'CÉDULA CIUDADANÍA') dato2 = '1';
            else if (item.tipoDocumento === 'NIT') dato2 = '3';
            else if (item.tipoDocumento === 'CÉDULA EXTRANJERÍA') dato2 = '2';

            const dato6 =
                item.tipoCuenta === 'AHORROS' ? '37' :
                    item.tipoCuenta === 'CORRIENTE' ? '27' : 'ERROR';

            let consecutivo = (index + 2).toString();
            let linea = consecutivo.padStart(7, "0");
            linea += "0";
            linea += "63400020011";

            linea += item.numeroDocumento;
            linea = linea.padEnd(34, " ");

            linea += "001";
            linea += "1";
            linea += bancoInfo.banco;

            linea += " ".repeat(8);

            linea += item.noCuenta;
            linea = linea.padEnd(78, " ");

            linea += tipoCuenta;
            linea += "00000509";
            linea += "1";
            linea += "1";

            linea += "1";

            linea += item.numeroDocumento;
            linea = linea.padEnd(140, " ");
            
            linea += dato2;
            linea = linea.padEnd(190, " ");
            
            linea += bancoInfo.dato3;
            linea = linea.padEnd(240, " ");
            
            linea += item.noCuenta;
            
            while (linea.length < 340) linea += " ";
            linea += dato6;

            linea = linea.padEnd(440, " ");
            linea += "00000";

            linea = linea.padEnd(840, " ");
            lineas.push(linea);
        });
    }

    let ultimoConsec = (parsedData.length + 2).toString().padStart(7, "0");
    let ultimaLinea = ultimoConsec + "99990001001";
    lineas.push(ultimaLinea);

    const plano = lineas.join("\n");
    triggerTextDownload(plano, '153101H7M48erpfinanciero@comfacauca.com.txt');
}

/* ========================================
   LIMPIAR TODO
   ======================================== */
function clearData() {
    fileInput.value = '';
    fileNameDiv.textContent = "No hay archivos seleccionados";
    dataBody.innerHTML = '';
    parsedData = [];
    hasErrors = false;

    btnProcesar.disabled = true;
    btnCancelar.disabled = true;
    btnExcel.disabled = true;
    btnSiesa.disabled = true;
    btnPlano.disabled = true;
    isExcelMode = false;

    downloadButtons.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Reset table headers back to default TXT headers
    const dataHead = document.getElementById('dataHead');
    if(dataHead) {
        dataHead.innerHTML = `
            <tr>
                <th>No.</th>
                <th>No. Documento</th>
                <th>Nombre Titular</th>
                <th>No. Cuenta</th>
                <th>Nombre Banco</th>
                <th>Tipo Cuenta</th>
                <th>Tipo Documento</th>
                <th>Acciones</th>
            </tr>
        `;
    }
}

/* ========================================
   VOLVER AL INICIO
   ======================================== */
function goToHome() {
    window.location.href = "../index.html";
}
