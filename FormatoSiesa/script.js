document.getElementById('processButton').addEventListener('click', processFile);
document.getElementById('exportButton').addEventListener('click', exportToExcel);
document.getElementById('cancelButton').addEventListener('click', cancelProcess);

let processedData = [];
let isExporting = false;

const processButton = document.getElementById('processButton');
const exportButton = document.getElementById('exportButton');

document.getElementById('fileInput').addEventListener('change', function () {
    const fileNameDiv = document.getElementById('fileCount');

    if (this.files.length > 0) {
        fileNameDiv.textContent = this.files[0].name;
        processButton.disabled = false;
    } else {
        fileNameDiv.textContent = "No hay archivos seleccionados";
        processButton.disabled = true;
    }
});

const bancoData = {
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
    'NU BANK': { banco: '1809', dato3: '000001809' }
};

function processFile() {

    const file = document.getElementById('fileInput').files[0];
    if (!file) return alert('Selecciona un archivo.');

    document.getElementById('loader').style.display = 'block';

    const reader = new FileReader();

    reader.onload = function (e) {

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        parseData(jsonData);

        document.getElementById('loader').style.display = 'none';
    };

    reader.readAsArrayBuffer(file);
}

function parseData(data) {

    const tableBody = document.getElementById('dataBody');
    tableBody.innerHTML = '';
    processedData = [];

    let hasErrors = false;
    let htmlRows = "";

    data.slice(1, 1001).forEach((row) => {

        if (!row || row.length < 6) return;

        const noDocumento = row[1]?.toString().trim() || '';
        const noCuenta = row[3]?.toString().trim() || '';
        const bancoNombre = row[4]?.toString().trim() || '';
        const tipoDocumento = row[6]?.toString().trim() || '';
        const tipoCuentaTexto = row[5]?.toString().trim() || '';

        const bancoInfo = bancoData[bancoNombre] || { banco: 'ERROR', dato3: '000000000' };

        const tipoCuenta =
            tipoCuentaTexto === 'AHORROS' ? '2' :
            tipoCuentaTexto === 'CORRIENTE' ? '1' : 'ERROR';

        let dato2 = 'ERROR';
        if (tipoDocumento === 'CÉDULA CIUDADANÍA') dato2 = '1';
        else if (tipoDocumento === 'NIT') dato2 = '3';
        else if (tipoDocumento === 'CÉDULA EXTRANJERÍA') dato2 = '2';

        const dato6 =
            tipoCuentaTexto === 'AHORROS' ? '37' :
            tipoCuentaTexto === 'CORRIENTE' ? '27' : 'ERROR';

        if (bancoInfo.banco === 'ERROR' || tipoCuenta === 'ERROR' || dato2 === 'ERROR') {
            hasErrors = true;
        }

        const rowData = [
            noDocumento, '001', bancoInfo.banco, noCuenta, tipoCuenta,
            '00000509', '1', '1',
            noDocumento, dato2, bancoInfo.dato3, noCuenta,
            '', dato6, '', '00000'
        ];

        processedData.push(rowData);

        htmlRows += "<tr>";
        rowData.forEach(cell => {
            const style = (cell === 'ERROR' || cell === '000000000')
                ? 'style="background:#ff4d4d;color:white;font-weight:bold;"'
                : '';
            htmlRows += `<td ${style}>${cell}</td>`;
        });
        htmlRows += "</tr>";
    });

    tableBody.innerHTML = htmlRows;

    if (!hasErrors && processedData.length > 0) {
        exportButton.disabled = false;
        exportButton.classList.add("active-export");
    } else {
        exportButton.disabled = true;
        exportButton.classList.remove("active-export");
    }
}

function exportToExcel() {

    if (isExporting) return;

    if (processedData.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    isExporting = true;
    exportButton.disabled = true;

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

    const sheetData = [headers, ...processedData];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pago electrónico");
    XLSX.writeFile(wb, "FormatoSiesa.xlsx");

    isExporting = false;
    exportButton.disabled = false;
}


function cancelProcess() {

    document.getElementById('fileInput').value = '';
    document.getElementById('dataBody').innerHTML = '';
    document.getElementById('fileCount').textContent = "No hay archivos seleccionados";

    processedData = [];

    processButton.disabled = true;
    exportButton.disabled = true;
    exportButton.classList.remove("active-export");
}

function goToHome() {
    window.location.href = "../index.html";
}





