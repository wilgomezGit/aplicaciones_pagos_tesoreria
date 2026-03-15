let datosExcel = [];

// --------- BOTÓN PROCESAR ---------
document.getElementById("btnProcesar").addEventListener("click", () => {
  const input = document.getElementById("inputExcel");
  if (!input.files.length) {
    alert("Por favor selecciona un archivo Excel.");
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    datosExcel = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Obtener encabezados del Excel
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    let headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      headers.push(cell ? cell.v : `Columna ${C}`);
    }

    mostrarTabla(datosExcel, headers);

    // Habilitar botones
    document.getElementById("btnDescargar").disabled = false;
    document.getElementById("btnCancelar").disabled = false;
  };

  reader.readAsArrayBuffer(file);
});

// --------- FUNCIÓN MOSTRAR TABLA ---------
function mostrarTabla(datos, headers) {
  const container = document.getElementById("tabla-container");
  container.innerHTML = "";

  if (!datos.length) {
    container.innerHTML = "<p>No se encontraron datos en el Excel.</p>";
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Encabezados
  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Filas
  datos.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row[header] !== undefined ? row[header] : "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

// --------- BOTÓN DESCARGAR ---------
document.getElementById("btnDescargar").addEventListener("click", () => {
  if (!datosExcel || datosExcel.length === 0) {
    alert("Primero procesa el Excel.");
    return;
  }

  const plano = generarPlano(datosExcel);
  const blob = new Blob([plano], { type: "text/plain;charset=utf-8" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "153101H7M48erpfinanciero@comfacauca.com.txt";
  enlace.click();
});

// --------- BOTÓN CANCELAR ---------
document.getElementById("btnCancelar").addEventListener("click", clearData);

function clearData() {
  datosExcel = [];

  document.getElementById("inputExcel").value = "";
  document.getElementById("tabla-container").innerHTML = "";
  document.getElementById("fileName").textContent = "No hay archivos seleccionados";

  document.getElementById("btnDescargar").disabled = true;
  document.getElementById("btnCancelar").disabled = true;
}


document.getElementById("inputExcel").addEventListener("change", function () {
    const fileNameDiv = document.getElementById("fileName");

    if (this.files.length > 0) {
        fileNameDiv.textContent = this.files[0].name;
    } else {
        fileNameDiv.textContent = "No hay archivos seleccionados";
    }
});


// --------- GENERADOR DEL ARCHIVO PLANO ---------
function generarPlano(datosExcel) {
  let lineas = [];

  // Primera línea fija
  lineas.push("000000100000001001");

  datosExcel.forEach((row, index) => {
    let consecutivo = (index + 2).toString();
    let linea = consecutivo.padStart(7, "0"); // consecutivo de 7 dígitos
    linea += "0"; // cero fijo
    linea += "63400020011"; // bloque fijo

    // Código proveedor
    linea += row["Código del proveedor"] || "";

    // Espacios hasta pos 35
    linea = linea.padEnd(34, " ");

    // Sucursal + "1" + Banco
    linea += (row["Sucursal del proveedor"] || "");
    linea += "1";
    linea += (row["Banco del proveedor"] || "");

    // 8 espacios
    linea += " ".repeat(8);

    // Número de cuenta
    linea += row["Número de cuenta corriente o de ahorros"] || "";

    // Hasta pos 79
    linea = linea.padEnd(78, " ");

    // Tipo cuenta + formato + forma de pago + cuenta por defecto
    linea += row["Tipo de cuenta 1=cta cte 2=cta ahorro"] || "";
    linea += row["formato"] || "";
    linea += row["forma de pago"] || "";
    linea += row["Cuenta por defecto 0= cta reg. no es default, 1=cta reg. es default"] || "";

    // fijo "1"
    linea += "1";

    // DATO 1
    linea += row["DATO 1"] || "";

    // Hasta pos 141
    linea = linea.padEnd(140, " ");
    linea += row["DATO 2"] || "";

    // Hasta pos 191
    linea = linea.padEnd(190, " ");
    linea += row["DATO 3"] || "";

    // Hasta pos 241
    linea = linea.padEnd(240, " ");
    linea += row["DATO 4"] || "";

    // Hasta pos 341 con ceros
    while (linea.length < 340) linea += " ";
    linea += row["DATO 6"] || "";

    // Hasta pos 441
    linea = linea.padEnd(440, " ");
    linea += row["DATO 8"] || "";

    // Hasta pos 841
    linea = linea.padEnd(840, " ");

    lineas.push(linea);
  });

  // Última línea
  let ultimoConsec = (datosExcel.length + 2).toString().padStart(7, "0");
  let ultimaLinea = ultimoConsec + "99990001001";
  lineas.push(ultimaLinea);

  return lineas.join("\n");
}
