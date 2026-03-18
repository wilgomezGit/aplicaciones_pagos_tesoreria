let parsedData = [];
let hasErrors = false;

/* =========================
   PROCESAR ARCHIVO
========================= */
function processFile() {

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecciona un archivo.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const content = e.target.result;
        parseFile(content);
    };

    reader.readAsText(file);
}


/* =========================
   PARSEAR ARCHIVO
========================= */
function parseFile(content) {

    const rows = content.split('\n');
    const tableBody = document.getElementById('dataBody');
    const exportButton = document.getElementById('exportButton');
    const cancelButton = document.getElementById('cancelButton');

    tableBody.innerHTML = '';

    parsedData = [];
    hasErrors = false;

    rows.forEach((line, index) => {

        const columns = line.split(',');

        if (columns.length >= 6) {

            const tipoCuenta = mapTipoCuenta(columns[1].trim());
            const banco = mapBanco(columns[3].trim());
            const tipoDocumento = mapTipoDocumento(columns[5].trim());

            if (
                tipoCuenta === "ERROR" ||
                banco === "DESCONOCIDO" ||
                tipoDocumento === "TIPO DESCONOCIDO"
            ) {
                hasErrors = true;
            }

            const rowData = {
                index: index + 1,
                noCuenta: columns[0].trim(),
                tipoCuenta: tipoCuenta,
                nombreTitular: columns[2].trim(),
                banco: banco,
                numeroDocumento: columns[4].trim(),
                tipoDocumento: tipoDocumento
            };

            parsedData.push(rowData);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rowData.index}</td>
                <td>${rowData.numeroDocumento}</td>
                <td>${rowData.nombreTitular}</td>
                <td>${rowData.noCuenta}</td>
                <td>${rowData.banco}</td>
                <td>${rowData.tipoCuenta}</td>
                <td>${rowData.tipoDocumento}</td>
            `;

            tableBody.appendChild(tr);
        }
    });

    if (hasErrors) {
        alert("⚠️ Verifica los datos porque hay errores en algunas filas.");
    }

    exportButton.disabled = hasErrors || parsedData.length === 0;
    cancelButton.disabled = parsedData.length === 0;
}


/* =========================
   MAPEO TIPO CUENTA
========================= */
function mapTipoCuenta(tipo) {

    if (tipo === '7') return 'AHORROS';
    if (tipo === '1') return 'CORRIENTE';

    return 'ERROR';
}


/* =========================
   MAPEO BANCOS
========================= */
function mapBanco(codigo) {

    const bancoMap = {
        "000001014": "ITAU",
        "000001031": "BANCOLDEX S.A.",
        "000001040": "BANCO AGRARIO",
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
        "000001121": "FINANCIERA JURISCOOP S.A.",
        "000001283": "COOPERATIVA FINANCIERA DE ANTIOQUIA",
        "000001289": "COOTRAFA COOPERATIVA FINANCIERA",
        "000001292": "CONFIAR COOPERATIVA FINANCIERA",
        "000001370": "COLTEFINANCIERA S.A",
        "000001507": "NEQUI",
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
        "006013677": "BANCO AV VILLAS",
        "000001047": "BANCO MUNDO MUJER",
        "000001811": "RAPPIPAY",
        "000001506": "PIBANK",
        "000001070": "LULO BANK",
        "000001808": "BOLD CF",
        "000001819": "BANCO CONTACTAR SA",
        "000001809": "NU BANK"
    };

    return bancoMap[codigo] || "DESCONOCIDO";
}


/* =========================
   MAPEO TIPO DOCUMENTO
========================= */
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


/* =========================
   EXPORTAR A EXCEL
========================= */
function exportToExcel() {

    if (hasErrors) {
        alert("⚠️ No puedes exportar porque hay errores.");
        return;
    }

    const sheetData = [
        ['No.', 'No. DOCUMENTO', 'NOMBRE TITULAR', 'No. CUENTA', 'BANCO', 'TIPO CUENTA', 'TIPO DOCUMENTO']
    ];

    parsedData.forEach(item => {
        sheetData.push([
            item.index,
            item.numeroDocumento,
            item.nombreTitular,
            item.noCuenta,
            item.banco,
            item.tipoCuenta,
            item.tipoDocumento
        ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Cuentas Bancarias');

    const workbookBlob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookBlob], { type: 'application/octet-stream' });

    saveAs(blob, 'DatosCuentasBancarias.xlsx');
}


/* =========================
   LIMPIAR TODO
========================= */
function clearData() {

    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');
    const acceptButton = document.getElementById('acceptButton');
    const cancelButton = document.getElementById('cancelButton');
    const exportButton = document.getElementById('exportButton');

    document.getElementById('dataBody').innerHTML = '';

    fileInput.value = '';
    fileCount.textContent = "No hay archivos seleccionados";

    parsedData = [];
    hasErrors = false;

    acceptButton.disabled = true;
    cancelButton.disabled = true;
    exportButton.disabled = true;
}


/* =========================
   VOLVER AL INICIO
========================= */
function goToHome() {
    window.location.href = "../index.html";
}


/* =========================
   INICIALIZACIÓN
========================= */
document.addEventListener("DOMContentLoaded", function () {

    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');
    const acceptButton = document.getElementById('acceptButton');
    const cancelButton = document.getElementById('cancelButton');

    acceptButton.disabled = true;
    cancelButton.disabled = true;

    fileInput.addEventListener('change', function () {

        if (this.files.length > 0) {

            fileCount.textContent = this.files[0].name;
            acceptButton.disabled = false;
            cancelButton.disabled = false;

        } else {

            fileCount.textContent = "No hay archivos seleccionados";
            acceptButton.disabled = true;
            cancelButton.disabled = true;
        }
    });

});
