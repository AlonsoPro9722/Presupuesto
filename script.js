// --- Elementos del DOM ---
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');
const yourNameInput = document.getElementById('yourNameInput');
const brandColor = document.getElementById('brandColor');
const taxInput = document.getElementById('taxInput');
const clientNameInput = document.getElementById('clientName');
const servicesContainer = document.getElementById('servicesContainer');

// --- Estado de la aplicación ---
// Cargamos los servicios desde el panel o iniciamos con uno vacío
let services = [{ desc: '', hours: 0, rate: 30 }];

// --- 1. Inicialización y Persistencia ---
window.addEventListener('DOMContentLoaded', () => {
    // Recuperar datos de configuración guardados
    yourNameInput.value = localStorage.getItem('yourName') || "";
    brandColor.value = localStorage.getItem('brandColor') || "#2563eb";
    taxInput.value = localStorage.getItem('taxRate') || 0;
    
    const savedLogo = localStorage.getItem('freelanceLogo');
    if (savedLogo) {
        logoPreview.src = savedLogo;
        logoPreview.style.display = 'block';
    }
    
    // Aplicar color de marca inicial
    document.documentElement.style.setProperty('--primary', brandColor.value);
    
    // Establecer fecha actual
    document.getElementById('date').textContent = new Date().toLocaleDateString();
    
    // Renderizar por primera vez
    renderServiceInputs();
    updateInvoicePreview();
});

// --- 2. Lógica de Servicios (Formulario) ---
// Esta función solo se llama cuando cambia la ESTRUCTURA (añadir/quitar filas)
function renderServiceInputs() {
    // Limpiamos el contenedor pero mantenemos el label
    servicesContainer.innerHTML = '<label>Servicios (Descripción | Horas | Precio/h)</label>';
    
    services.forEach((s, index) => {
        const div = document.createElement('div');
        div.className = 'service-row-input';
        div.innerHTML = `
            <input type="text" value="${s.desc}" oninput="updateS(${index}, 'desc', this.value)" placeholder="Servicio">
            <input type="number" value="${s.hours}" oninput="updateS(${index}, 'hours', this.value)">
            <input type="number" value="${s.rate}" oninput="updateS(${index}, 'rate', this.value)">
            <button onclick="removeS(${index})" style="padding:2px; background:none; border:none; color:red; cursor:pointer">X</button>
        `;
        servicesContainer.appendChild(div);
    });
}

// --- 3. Lógica de la Factura (Previsualización) ---
// Esta función se llama cada vez que el usuario escribe para actualizar la derecha
function updateInvoicePreview() {
    const tableBody = document.getElementById('invoiceTableBody');
    tableBody.innerHTML = '';
    let subtotal = 0;

    services.forEach((s) => {
        const totalRow = s.hours * s.rate;
        subtotal += totalRow;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.desc || '---'}</td>
            <td class="text-center">${s.hours}</td>
            <td class="text-right">$${totalRow.toFixed(2)}</td>
        `;
        tableBody.appendChild(tr);
    });

    calculateTotals(subtotal);
}

// Actualiza los datos en el array y refresca la factura (sin refrescar los inputs)
function updateS(index, key, val) {
    services[index][key] = key === 'desc' ? val : parseFloat(val) || 0;
    updateInvoicePreview(); 
}

function addService() {
    services.push({ desc: '', hours: 0, rate: 30 });
    renderServiceInputs();
    updateInvoicePreview();
}

function removeS(index) {
    if(services.length > 1) {
        services.splice(index, 1);
        renderServiceInputs();
        updateInvoicePreview();
    }
}

// --- 4. Cálculos Finales ---
function calculateTotals(subtotal) {
    const taxRate = parseFloat(taxInput.value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    document.getElementById('viewSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('viewTax').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('finalTotal').textContent = `$${total.toFixed(2)}`;
    
    // Actualizar nombres en la factura
    document.getElementById('viewClient').textContent = clientNameInput.value || "---";
    document.getElementById('viewYourName').textContent = yourNameInput.value || "TU EMPRESA";
}

// --- 5. Eventos de Configuración y Logo ---
[yourNameInput, brandColor, taxInput, clientNameInput].forEach(el => {
    el.addEventListener('input', () => {
        // Guardar configuración en LocalStorage[cite: 1]
        localStorage.setItem('yourName', yourNameInput.value);
        localStorage.setItem('brandColor', brandColor.value);
        localStorage.setItem('taxRate', taxInput.value);
        
        // Actualizar color visualmente
        document.documentElement.style.setProperty('--primary', brandColor.value);
        
        // Refrescar cálculos
        updateInvoicePreview();
    });
});

logoInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            logoPreview.src = e.target.result;
            logoPreview.style.display = 'block';
            localStorage.setItem('freelanceLogo', e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// --- 6. Exportación a PDF ---
document.getElementById('downloadBtn').onclick = () => {
    const client = clientNameInput.value;
    if(!client) return alert("Por favor ingresa el nombre del cliente");
    
    const totalCheck = parseFloat(document.getElementById('finalTotal').textContent.replace('$',''));
    if(totalCheck <= 0) return alert("El total debe ser mayor a $0 para generar un presupuesto");

    const element = document.getElementById('invoice');
    const opt = {
        margin: 10,
        filename: `Presupuesto_${client.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3 }, // Calidad Premium[cite: 1]
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
};

// Asignar evento al botón de añadir
document.getElementById('addServiceBtn').onclick = addService;