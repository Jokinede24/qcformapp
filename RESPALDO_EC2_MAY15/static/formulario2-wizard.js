// formulario2-wizard.js COMPLETO con lógica de fotos condicionales corregida y registrarPalletsFallidos integrado

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('form-wizard');
  const totalPallets = parseInt(localStorage.getItem('totalPallets'), 10);
  const selectedCustomer = localStorage.getItem('selectedCustomer');
  const selectedPackSizes = JSON.parse(localStorage.getItem('selectedPackSizes')) || [];

  if (!totalPallets || totalPallets < 1 || totalPallets > 28 || !selectedCustomer) {
    container.innerHTML = '<p>Error: Datos faltantes o inválidos. Regresa a FORMULARIO1.</p>';
    return;
  }

  const labelOptions = [
    "Alpine Fresh", "Hippie Organics", "Basket & Bushel", "Fresh Label",
    "Greenwise", "Market District - Premium", "Organics Blueberries",
    "Signature Farms", "Purchase", "Peak Harvest"
  ];

  const sizingOptions = ["10+", "12+", "14+", "16+", "18+", "21+"];
  const baxloOptions = [
    "CRUNCHY : >72", "FIRM : 65 - 71", "FAIR : 60 - 64",
    "SENSITIVE : 55 - 59", "SOFT : < 54"
  ];

  const staticUPCs = [
    "815887010260", "815887010383", "815887010253", "815887010680",
    "815887010246", "815887010369", "815887011915", "815887010185",
    "815887010338", "815887010710", "815887010703", "815887010154",
    "815887010314", "815887012059", "21130195763", "21130250738",
    "300349511368", "36800490444", "36800490451", "36800494558",
    "414156278864", "79893408798", "79893408859", "4056489730897",
    "4056489731511", "Purchase",
    "041220295852", "041220524457", "815887010352"
  ];

  const upcData = await fetch('data/upcs_structured.json').then(res => res.json());
  window.upcsData = upcData;

  const pages = [];
  for (let i = 1; i <= totalPallets; i++) {
    const page = document.createElement('div');
    page.classList.add('wizard-page');
    page.style.display = i === 1 ? 'block' : 'none';
    page.innerHTML = generarHTMLPallet(i, selectedCustomer, selectedPackSizes, labelOptions, sizingOptions, baxloOptions, staticUPCs);
    pages.push(page);
    container.appendChild(page);
    rellenarCamposPallet(i);

    const mostrarBloqueFoto = (selectName, valorObjetivo, bloqueId, pallet) => {
      const select = document.querySelector(`[name="${selectName}_${pallet}"]`);
      const bloque = document.getElementById(`${bloqueId}_${pallet}`);
      if (!select || !bloque) {
        console.warn(`⚠️ No se encontró select o bloque para: ${selectName}_${pallet}`);
        return;
      }

      const evaluar = () => {
        const val = select.value;
        const cumple = (typeof valorObjetivo === 'function') ? valorObjetivo(val) : val === valorObjetivo;
        console.log(`📸 Evaluando ${selectName}_${pallet}: valor = ${val}, cumple = ${cumple}`);
        bloque.style.display = cumple ? "block" : "none";
      };

      select.addEventListener("change", evaluar);
      evaluar();
    };

    mostrarBloqueFoto("fruitAppearance", "WET", "appearancePhotoBlock", i);
    mostrarBloqueFoto("sizing", v => v === "10+", "sizingPhotoBlock", i);
    mostrarBloqueFoto("stems", v => v && v !== "NONE", "stemsPhotoBlock", i);
mostrarBloqueFoto("moldDecay", v => v && !v.startsWith("NONE"), "moldPhotoBlock", i);


    setTimeout(() => {
      console.log("♻️ Restaurando fotos condicionales para pallet", i);
      restaurarFotosDesdeLocalStorage(i);
    }, 100);
  }

  const finalPage = document.querySelector('.wizard-page.final-page');
  if (finalPage) pages.push(finalPage);

  let current = 0;
  window.updateWizardCurrent = function (delta) {
    current += delta;
  };

  function updateVisibility() {
    pages.forEach((p, idx) => {
      p.style.display = idx === current ? 'block' : 'none';
    });
    const currentPage = pages[current];
    if (currentPage) {
      currentPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-back')) {
      if (current === 0) {
        window.location.href = "FORMULARIO.html";
      } else {
        current--;
        updateVisibility();
      }
    }
  });

  container.addEventListener('change', (e) => {
    const pallet = e.target.getAttribute('data-pallet');
    if (!pallet) return;

    const labelSel = document.querySelector(`.label-select[data-pallet="${pallet}"]`);
    const packSel = document.querySelector(`.packsize-select[data-pallet="${pallet}"]`);
    const upcSel = document.querySelector(`.upc-select[data-pallet="${pallet}"]`);

    if (e.target === labelSel || e.target === packSel) {
      const upcs = upcData[selectedCustomer]?.[labelSel.value]?.[packSel.value] ||
                   upcData["OTHERS"]?.[labelSel.value]?.[packSel.value] || [];

      const currentUPC = upcSel?.tomselect?.getValue() || "";
      console.log(`🤙 UPC actual en PALLET ${pallet}: ${currentUPC}`);
      console.log(`🔎 UPCs sugeridos para esa combinación:`, upcs);
    }
  });

  setTimeout(() => {
    document.querySelectorAll('.search-upc').forEach(select => {
      new TomSelect(select, {
        placeholder: "Search or select UPC.",
        allowEmptyOption: true,
        create: false,
        maxOptions: null,
        sortField: { field: "text", direction: "asc" }
      });
    });
  }, 0);

  setTimeout(() => {
    document.querySelectorAll('[name]').forEach(field => {
      field.addEventListener('change', () => {
        const name = field.name;
        const value = field.value;
        if (name && value !== undefined) {
          console.log(`🧠 Guardando campo en localStorage: ${name} = ${value}`);
          localStorage.setItem(name, value);
        }
      });
    });
  }, 100);

  registrarPalletsFallidos();
});

function rellenarCamposPallet(i) {
  const get = (campo) => localStorage.getItem(`${campo}_${i}`) || "";

  const campos = [
    "palletTag", "boxes", "packSize", "label", "upc", "country", "labelLanguage",
    "clamshellMatchesLabel", "palletType", "boxesCondition", "productSecured",
    "clamshellType", "closureType", "variety", "fruitAppearance", "sizing",
    "stems", "moldDecay", "baxloReading", "auth"
  ];

  campos.forEach(nombre => {
    const el = document.querySelector(`[name="${nombre}_${i}"]`);
    if (el) {
      el.value = get(nombre);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  const upc = get("upc");
  const upcSelect = document.querySelector(`[name="upc_${i}"]`);
  if (upcSelect && upcSelect.tomselect && upc) {
    upcSelect.tomselect.setValue(upc);
  }
}

function registrarPalletsFallidos() {
  const order = localStorage.getItem("orderNumber");
  const customer = localStorage.getItem("selectedCustomer");
  const total = parseInt(localStorage.getItem("totalPallets"), 10);
  const fallidos = [];

  for (let i = 1; i <= total; i++) {
    const status = document.getElementById(`totalStatus${i}`)?.textContent.trim();
    if (status === "FAILED") {
      fallidos.push(String(i));
    }
  }

  if (fallidos.length > 0) {
    fetch("/api/fallidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order, customer, fallidos })
    })
    .then(res => res.json())
    .then(data => console.log("📦 Fallidos registrados:", data))
    .catch(err => console.error("❌ Error registrando fallidos:", err));
  }
}