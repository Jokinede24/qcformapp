if (!sessionStorage.getItem('fromForm2')) {
  localStorage.clear();
} else {
  sessionStorage.removeItem('fromForm2');
}

window.addEventListener('DOMContentLoaded', () => {
  const loaddateInput = document.getElementById('loaddate');
  const today = new Date();
  loaddateInput.value = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;

  document.getElementById('order').value = localStorage.getItem('orderNumber') || "";
  document.getElementById('location').value = localStorage.getItem('loadingLocation') || "";
  document.getElementById('inspector').value = localStorage.getItem('inspectorName') || "";

  const checkboxes = document.querySelectorAll('#packSizeGroup input[type="checkbox"]');
  const selectedPackSizes = JSON.parse(localStorage.getItem('selectedPackSizes') || '[]');
  selectedPackSizes.forEach(pack => {
    const checkbox = Array.from(checkboxes).find(cb => cb.value === pack);
    if (checkbox) checkbox.checked = true;
  });

  updatePalletSection();

  const resumenPorPack = JSON.parse(localStorage.getItem('resumenPorPack') || '{}');
  Object.entries(resumenPorPack).forEach(([pack, datos]) => {
    const palletSelect = document.querySelector(`.pallet-count[data-pack="${pack}"]`);
    const cajasInput = document.querySelector(`.qty-input[data-pack="${pack}"]`);
    if (palletSelect) palletSelect.value = datos.pallets;
    if (cajasInput) cajasInput.value = datos.cajas;
  });

  updateTotalPallets();

  document.querySelectorAll('#packSizeGroup input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", () => {
      updatePalletSection();
      updateTotalPallets();
    });
  });
});

function updatePalletSection() {
  const palletFields = document.getElementById('pallet-fields');
  const totalInput = document.getElementById('grand-total');
  const checkboxes = document.querySelectorAll('#packSizeGroup input[type="checkbox"]');
  palletFields.innerHTML = '';

  const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  if (selected.length === 0) {
    document.getElementById('pallet-section').style.display = 'none';
    totalInput.value = "0";
    return;
  }

  document.getElementById('pallet-section').style.display = 'block';

  selected.forEach((pack) => {
    const wrapper = document.createElement("div");
    wrapper.className = "pack-block";
    wrapper.innerHTML = `
      <label>${pack} PALLETS</label>
      <select class="pallet-count" data-pack="${pack}">
        ${Array.from({length: 28}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
      </select>
      <label>${pack} QTY</label>
      <input type="number" class="qty-input" data-pack="${pack}" value="0" min="0">
    `;
    palletFields.appendChild(wrapper);
  });

  palletFields.querySelectorAll(".pallet-count").forEach(select =>
    select.addEventListener("change", updateTotalPallets)
  );
}

function updateTotalPallets() {
  const palletInputs = document.querySelectorAll(".pallet-count");
  let total = 0;
  palletInputs.forEach(select => {
    total += parseInt(select.value);
  });
  document.getElementById('grand-total').value = total;
}

function goToNext() {
  const selectedCustomer = document.getElementById('customer').value;
  const headOffice = document.getElementById('headoffice').value;
  const orderNumber = document.getElementById('order').value;
  const inspector = document.getElementById('inspector').value;
  const loadingLocation = document.getElementById('location')?.value || "";

  const checkboxes = document.querySelectorAll('#packSizeGroup input[type="checkbox"]');
  const selectedPackSizes = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  const total = parseInt(document.getElementById('grand-total').value);

  const resumenOriginal = JSON.parse(localStorage.getItem('resumenPorPack') || '{}');
  const resumenFinal = {};

  selectedPackSizes.forEach(pack => {
    const palletSelect = document.querySelector(`.pallet-count[data-pack="${pack}"]`);
    const cajasInput = document.querySelector(`.qty-input[data-pack="${pack}"]`);
    resumenFinal[pack] = {
      pallets: parseInt(palletSelect?.value || "0", 10),
      cajas: parseInt(cajasInput?.value || "0", 10),
      variety: resumenOriginal[pack]?.variety || ""
    };
  });

  localStorage.setItem('selectedCustomer', selectedCustomer);
  localStorage.setItem('selectedPackSizes', JSON.stringify(selectedPackSizes));
  localStorage.setItem('totalPallets', total);
  localStorage.setItem('selectedHeadOffice', headOffice);
  localStorage.setItem('inspectorName', inspector);
  localStorage.setItem('loadingLocation', loadingLocation);
  localStorage.setItem('resumenPorPack', JSON.stringify(resumenFinal));
  localStorage.setItem('orderNumber', orderNumber);

  sessionStorage.setItem('fromForm2', 'true');
  window.location.href = "FORMULARIO2.html";
}

let headOfficeMap = {};

fetch('./data/headoffice_map.json')
  .then(res => res.json())
  .then(map => { headOfficeMap = map; });

fetch('./data/clientes.json')
  .then(res => res.json())
  .then(clientes => {
    const select = document.getElementById('customer');
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.name;
      option.textContent = cliente.name;
      select.appendChild(option);
    });

    const tom = new TomSelect('#customer', {
      placeholder: "Select or search customer...",
      allowEmptyOption: true,
      create: false,
      maxOptions: null,
      sortField: { field: "text", direction: "asc" },
      onChange(value) {
        const headOfficeInput = document.getElementById('headoffice');
        headOfficeInput.value = headOfficeMap[value] || "General";
      }
    });

    const selectedCustomer = localStorage.getItem('selectedCustomer') || "";
    const headOffice = localStorage.getItem('selectedHeadOffice') || "";
    if (selectedCustomer) {
      tom.setValue(selectedCustomer);
      document.getElementById('headoffice').value = headOffice;
    }
  });