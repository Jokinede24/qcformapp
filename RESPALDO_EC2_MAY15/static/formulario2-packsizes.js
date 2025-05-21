function iniciarPacksizesCuandoEsteListo() {
  const resumen = JSON.parse(localStorage.getItem('resumenPorPack') || '{}');
  if (!resumen || Object.keys(resumen).length === 0) {
    console.warn("No hay datos en resumenPorPack.");
    return;
  }

  const formWizard = document.getElementById('form-wizard');
  if (!formWizard) {
    setTimeout(iniciarPacksizesCuandoEsteListo, 100);
    return;
  }

  mostrarResumenStock(resumen);
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    iniciarPacksizesCuandoEsteListo();
  } catch (err) {
    console.error("❌ Error al iniciar formulario2-packsizes.js", err);
  }
});

function mostrarResumenStock(resumen) {
  const stockDiv = document.createElement('div');
  stockDiv.id = "stock-summary";
  stockDiv.style.marginBottom = "30px";

  stockDiv.innerHTML = `
    <h3 style="margin-bottom: 10px;">📦 PACK SIZE AVAILABILITY</h3>
    <table class="stock-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="border: 1px solid #ccc; padding: 6px;">Pack Size</th>
          <th style="border: 1px solid #ccc; padding: 6px;">Remaining Pallets</th>
          <th style="border: 1px solid #ccc; padding: 6px;">Remaining Boxes</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(resumen).map(([pack, { pallets, cajas }]) => `
          <tr data-pack="${pack}">
            <td style="border: 1px solid #ccc; padding: 6px;">${pack}</td>
            <td class="stock-pallets" style="border: 1px solid #ccc; padding: 6px;">${pallets}</td>
            <td class="stock-cajas" style="border: 1px solid #ccc; padding: 6px;">${cajas}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const wizard = document.getElementById('form-wizard');
  if (wizard) {
    wizard.prepend(stockDiv);
  }
}

function actualizarEstadoPacks() {
  const resumen = JSON.parse(localStorage.getItem('resumenPorPack') || '{}');
  const usados = {};

  // Inicializar acumuladores
  for (const pack in resumen) {
    usados[pack] = { pallets: 0, cajas: 0 };
  }

  // Calcular lo usado en todos los pallets visibles
  document.querySelectorAll('.packsize-select').forEach((select) => {
    const pack = select.value;
    const pallet = select.getAttribute('data-pallet');

    if (!pack || !usados[pack]) return;

    usados[pack].pallets += 1;

    const cajasInput = document.querySelector(`[name="boxes_${pallet}"]`);
    if (cajasInput && !isNaN(parseInt(cajasInput.value))) {
      usados[pack].cajas += parseInt(cajasInput.value);
    }
  });

  // Actualizar la tabla de disponibilidad
  for (const pack in resumen) {
    const fila = document.querySelector(`tr[data-pack="${pack}"]`);
    if (!fila) continue;

    const restantesPallets = resumen[pack].pallets - usados[pack].pallets;
    const restantesCajas = resumen[pack].cajas - usados[pack].cajas;

    const palletsCell = fila.querySelector('.stock-pallets');
    const cajasCell = fila.querySelector('.stock-cajas');

    if (palletsCell) palletsCell.textContent = Math.max(restantesPallets, 0);
    if (cajasCell) cajasCell.textContent = Math.max(restantesCajas, 0);
  }

  // Limitar selects y cajas disponibles
  document.querySelectorAll('.packsize-select').forEach((select) => {
    const pallet = select.getAttribute('data-pallet');
    const currentValue = select.value;

    Array.from(select.options).forEach((opt) => {
      const pack = opt.value;
      if (!pack || !resumen[pack]) return;

      const restantes = resumen[pack].pallets - usados[pack].pallets;
      const debeMostrarse = restantes > 0 || pack === currentValue;

      opt.hidden = !debeMostrarse;
      opt.disabled = !debeMostrarse;
    });

    const cajasInput = document.querySelector(`[name="boxes_${pallet}"]`);
    if (currentValue && resumen[currentValue]) {
      const restantesCajas = resumen[currentValue].cajas - usados[currentValue].cajas;
      cajasInput.max = Math.max(restantesCajas, 0);
    } else {
      cajasInput.max = "";
    }
  });

  console.log("📊 Stock and dropdowns updated successfully.");
}
