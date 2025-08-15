/* También permitir edición con un solo click (opcional, descomenta si lo prefieres)
title.addEventListener('click', function () {
  title.contentEditable = true;
  title.focus();
  title.style.border = "1px dashed #007bff";
});*/

// PDF generator
document.getElementById('btnDescargarPDF').addEventListener('click', function () {
  const container = document.querySelector('.container-fluid');

  // Guardar clases originales
  const originalClass = container.className;
  // Quitar padding y márgenes agregando una clase temporal
  container.className += ' p-0 m-0';

  // Generar nombre de archivo con fecha y hora
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const filename = `CuentasClaras_${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}.pdf`;

  // Opciones para html2pdf con márgenes mínimos y escala ajustada
  const opt = {
    margin: [10, 20, 10, 20], // Sin márgenes
    filename: filename,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 1.1, useCORS: true, backgroundColor: "#fff" },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).save().then(() => {
    // Restaurar clases originales después de generar el PDF
    container.className = originalClass;
  });
});

// Limitar editableTitle a 30 caracteres
const title = document.getElementById('editableTitle');
const defaultText = "Nombre del evento!!";
title.addEventListener('click', function () {
  title.contentEditable = true;
  title.textContent = "";
  title.focus();
  title.style.border = "1px dashed #007bff";
});
title.addEventListener('input', function () {
  // Limitar a 30 caracteres
  if (title.textContent.length > 30) {
    title.textContent = title.textContent.slice(0, 30);
    // Mueve el cursor al final
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(title);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
});
title.addEventListener('blur', function () {
  title.contentEditable = false;
  title.style.border = "none";
  if (title.textContent.trim() === "") {
    title.textContent = defaultText;
  }
});

function configurarFila(fila) {
  const nombreInput = fila.querySelector('.nombreInput');
  const conceptoCol = fila.querySelector('.conceptoCol');
  const conceptoInput = fila.querySelector('.conceptoInput');
  const montoCol = fila.querySelector('.montoCol');
  const montoInput = fila.querySelector('.montoInput');
  const listadoCol = fila.querySelector('.nombres-listado');
  const btnEliminar = fila.querySelector('.btn-eliminar-fila');

  // Limitar los textbox a 30 caracteres
  nombreInput.setAttribute('maxlength', 30);
  if (conceptoInput) conceptoInput.setAttribute('maxlength', 30);

  // No permitir números negativos en monto
  montoInput.setAttribute('min', 0);

  nombreInput.addEventListener('input', function () {
    // Capitalizar la primera letra de cada palabra
    let valor = nombreInput.value;
    valor = valor.replace(/\b\w/g, l => l.toUpperCase());
    if (valor !== nombreInput.value) {
      const pos = nombreInput.selectionStart;
      nombreInput.value = valor;
      nombreInput.setSelectionRange(pos, pos);
    }

    const filasContainer = document.getElementById('filasContainer');
    if (nombreInput.value.trim() !== "") {
      conceptoCol.classList.remove('d-none');
      montoCol.classList.remove('d-none');
      listadoCol.classList.remove('d-none');
      // Si es la última fila, agrega una nueva fila vacía
      if (fila === filasContainer.lastElementChild) {
        agregarNuevaFila();
      }
    } else {
      conceptoCol.classList.add('d-none');
      montoCol.classList.add('d-none');
      listadoCol.classList.add('d-none');
      conceptoInput.value = "";
      montoInput.value = "0";
      // Elimina la fila actual si está vacía y NO es la última fila
      if (
        filasContainer.children.length > 1 &&
        fila !== filasContainer.lastElementChild
      ) {
        fila.remove();
      }
    }
    actualizarListadosNombres();
    calcularDeudas();
  });

  montoInput.addEventListener('input', function () {
    // No permitir valores negativos manualmente
    if (parseFloat(montoInput.value) < 0) montoInput.value = 0;
    calcularDeudas();
  });

  // Actualizar deudas al cambiar checkboxes
  fila.addEventListener('change', function (e) {
    if (e.target.type === "checkbox") {
      calcularDeudas();
    }
  });

  btnEliminar.addEventListener('click', function () {
    const filasContainer = document.getElementById('filasContainer');
    if (
      filasContainer.children.length > 1 &&
      fila !== filasContainer.lastElementChild
    ) {
      fila.remove();
      actualizarListadosNombres();
      calcularDeudas();
    }
  });
}

function agregarNuevaFila() {
  const filasContainer = document.getElementById('filasContainer');
  const nuevaFila = document.createElement('div');
  nuevaFila.className = "row mb-2 align-items-center fila-datos";
  nuevaFila.innerHTML = `
    <div class="col-auto">
      <button type="button" class="btn btn-danger btn-sm btn-eliminar-fila rounded-circle" title="Eliminar fila">&times;</button>
    </div>
    <div class="col-auto">
      <input type="text" class="form-control nombreInput col-auto mt-2 mt-sm-0" placeholder="Nombre">
    </div>
    <div class="col-auto d-none conceptoCol">
      <input type="text" class="form-control conceptoInput col-auto mt-2 mt-sm-0" placeholder="Concepto">
    </div>
    <div class="col-auto d-none montoCol">
      <input type="number" class="form-control montoInput col-auto mt-2 mt-sm-0" placeholder="Monto" value="0">
    </div>
    <div class="col d-none nombres-listado"></div>
  `;
  filasContainer.appendChild(nuevaFila);
  configurarFila(nuevaFila);
  actualizarListadosNombres();
  calcularDeudas();
}

function actualizarListadosNombres() {
  const nombreInputs = Array.from(document.querySelectorAll('.nombreInput'));
  const nombres = nombreInputs
    .map(input => input.value.trim())
    .filter(nombre => nombre !== "");
  const nombresUnicos = [...new Set(nombres)];

  const estados = {};
  document.querySelectorAll('.nombres-listado').forEach(listadoDiv => {
    listadoDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      estados[checkbox.dataset.fila + '|' + checkbox.value] = checkbox.checked;
    });
  });

  document.querySelectorAll('.fila-datos').forEach((fila, idx) => {
    const listadoDiv = fila.querySelector('.nombres-listado');
    const nombrePropio = fila.querySelector('.nombreInput').value.trim();
    // Mostrar/ocultar listado según si el campo nombre está vacío
    if (nombrePropio !== "") {
      listadoDiv.classList.remove('d-none');
    } else {
      listadoDiv.classList.add('d-none');
    }
    if (nombresUnicos.length > 0) {
      listadoDiv.innerHTML = nombresUnicos.map(nombre => {
        const checked = (nombre === nombrePropio && nombre !== "") ? true : (estados[idx + '|' + nombre] || false);
        return `
          <label class="me-2">
            <input type="checkbox" data-fila="${idx}" value="${nombre}" ${checked ? 'checked' : ''}>
            ${nombre}
          </label>
        `;
      }).join('');
    } else {
      listadoDiv.innerHTML = "";
    }
  });
}

// --- Lógica de cálculo de deudas ---
function calcularDeudas() {
  // 1. Obtener todas las filas válidas (nombre y monto > 0)
  const filas = Array.from(document.querySelectorAll('.fila-datos'));
  let movimientos = [];
  let integrantesSet = new Set();
  let nombreOriginalMap = {}; // Para mostrar los nombres con mayúsculas originales

  filas.forEach((fila, idx) => {
    let nombre = fila.querySelector('.nombreInput').value.trim();
    const monto = parseFloat(fila.querySelector('.montoInput').value);
    if (nombre && !isNaN(monto) && monto > 0) {
      // Integrantes incluidos (checkboxes marcados)
      const checks = Array.from(fila.querySelectorAll('.nombres-listado input[type="checkbox"]:checked'));
      // Normalizar nombres a minúsculas para lógica, pero guardar el original para mostrar
      const integrantes = checks.map(chk => {
        const n = chk.value.trim();
        nombreOriginalMap[n.toLowerCase()] = n;
        return n.toLowerCase();
      }).filter(n => n);
      nombreOriginalMap[nombre.toLowerCase()] = nombre;
      integrantes.forEach(n => integrantesSet.add(n));
      if (integrantes.length > 0) {
        movimientos.push({
          pagador: nombre.toLowerCase(),
          monto: monto,
          integrantes: integrantes
        });
      }
    }
  });

  // 2. Listado de integrantes ordenado (alfabéticamente, sin distinción de mayúsculas/minúsculas)
  const integrantes = Array.from(integrantesSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // 3. Calcular deudas brutas entre integrantes
  // Estructura: deudas[deudor][acreedor] = monto
  let deudas = {};
  integrantes.forEach(i => deudas[i] = {});

  movimientos.forEach(mov => {
    const { pagador, monto, integrantes } = mov;
    const parte = monto / integrantes.length;
    integrantes.forEach(integrante => {
      if (integrante !== pagador) {
        if (!deudas[integrante][pagador]) deudas[integrante][pagador] = 0;
        deudas[integrante][pagador] += parte;
      }
    });
  });

  // 4. Compensar deudas netas entre pares
  let deudasNetas = [];
  for (let i = 0; i < integrantes.length; i++) {
    for (let j = i + 1; j < integrantes.length; j++) {
      const a = integrantes[i];
      const b = integrantes[j];
      const deudaA_B = (deudas[a][b] || 0);
      const deudaB_A = (deudas[b][a] || 0);
      const neto = deudaA_B - deudaB_A;
      if (Math.abs(neto) > 0.009) {
        if (neto > 0) {
          deudasNetas.push({
            deudor: a,
            acreedor: b,
            monto: neto
          });
        } else {
          deudasNetas.push({
            deudor: b,
            acreedor: a,
            monto: -neto
          });
        }
      }
    }
  }

  // 5. Mostrar deudas netas en el listado
  const resumen = document.getElementById('resumenDeudas');
  resumen.innerHTML = "";
  if (deudasNetas.length === 0) {
    resumen.innerHTML = `<li class="list-group-item text-muted">No hay deudas calculadas aún.</li>`;
  } else {
    deudasNetas.forEach(d => {
      resumen.innerHTML += `<li class="list-group-item">${nombreOriginalMap[d.deudor]} le debe $${d.monto.toFixed(2)} a ${nombreOriginalMap[d.acreedor]}</li>`;
    });
  }
}

// Configura la fila inicial
document.querySelectorAll('.fila-datos').forEach(configurarFila);
actualizarListadosNombres();
calcularDeudas();

// También recalcula deudas si se cambia un checkbox en cualquier fila
document.getElementById('filasContainer').addEventListener('change', function (e) {
  if (e.target.type === "checkbox") {
    calcularDeudas();
  }
});