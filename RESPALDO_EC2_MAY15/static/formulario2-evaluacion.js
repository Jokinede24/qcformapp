function actualizarColoresStatus(pallet) {
  ['label', 'packaging', 'quality', 'total'].forEach(key => {
    const el = document.getElementById(`${key}Status${pallet}`);
    if (el) {
      el.classList.remove("passed", "failed");
      const value = el.textContent || el.innerText;
      if (value.includes("PASSED")) {
        el.classList.add("passed");
      } else if (value.includes("FAILED")) {
        el.classList.add("failed");
      }
    }
  });
}

function actualizarTotalStatus(pallet) {
  const labelStatus = document.getElementById(`labelStatus${pallet}`)?.textContent || "";
  const packagingStatus = document.getElementById(`packagingStatus${pallet}`)?.textContent || "";
  const qualityStatus = document.getElementById(`qualityStatus${pallet}`)?.textContent || "";
  const final = [labelStatus, packagingStatus, qualityStatus].includes("FAILED") ? "FAILED" : "PASSED";

  const el = document.getElementById(`totalStatus${pallet}`);
  if (el) {
    el.textContent = final;
    el.classList.remove("passed", "failed");
    el.classList.add(final.toLowerCase());
  }
}

function calcularFinalOrderStatus() {
  let finalStatus = "PASSED";
  const pallets = document.querySelectorAll('.wizard-page');

  pallets.forEach((_, index) => {
    const status = document.getElementById(`totalStatus${index + 1}`)?.textContent.trim();
    if (status === "FAILED") {
      finalStatus = "FAILED";
    }
  });

  const finalSpan = document.getElementById("finalOrderStatus");
  if (finalSpan) {
    finalSpan.textContent = finalStatus;
    finalSpan.classList.remove("passed", "failed");
    finalSpan.classList.add(finalStatus.toLowerCase());
  }
}

function calcularPromedios() {
  const resumen = JSON.parse(localStorage.getItem('resumenPorPack') || '{}');
  let totalCajas = 0;
  let totalPallets = 0;

  for (const pack in resumen) {
    totalCajas += resumen[pack].cajas || 0;
    totalPallets += resumen[pack].pallets || 0;
  }

  const promedio = totalCajas / totalPallets;
  return { totalCajas, totalPallets, promedio };
}

function validarCajasPorPallet(palletIndex, promedio) {
  const cajasInput = document.querySelector(`[name="boxes_${palletIndex}"]`);
  if (!cajasInput) return true;

  const valor = parseInt(cajasInput.value || "0", 10);
  const minimo = promedio * 0.8;
  const maximo = promedio * 1.2;

  if (valor < minimo || valor > maximo) {
    alert(`Pallet ${palletIndex} supera el monto estimado permitido (${minimo.toFixed(0)}–${maximo.toFixed(0)} cajas). Por favor corrige antes de continuar.`);
    return false;
  }
  return true;
}

function validarTotalCajas() {
  const resumen = JSON.parse(localStorage.getItem('resumenPorPack') || '{}');
  let totalEsperado = 0;
  for (const pack in resumen) {
    totalEsperado += resumen[pack].cajas || 0;
  }

  let totalIngresado = 0;
  const totalPallets = parseInt(localStorage.getItem('totalPallets'), 10) || 0;
  for (let i = 1; i <= totalPallets; i++) {
    const cajasInput = document.querySelector(`[name="boxes_${i}"]`);
    if (cajasInput) {
      totalIngresado += parseInt(cajasInput.value || "0", 10);
    }
  }

  if (totalIngresado !== totalEsperado) {
    alert(`La suma total de cajas (${totalIngresado}) no coincide con el total esperado (${totalEsperado}). Por favor ajusta las cantidades antes de terminar.`);
    return false;
  }
  return true;
}

function hayTagsDuplicados() {
  const tags = [];
  const totalPallets = parseInt(localStorage.getItem('totalPallets'), 10);
  for (let i = 1; i <= totalPallets; i++) {
    const tag = document.querySelector(`[name="palletTag_${i}"]`)?.value.trim();
    if (tag) {
      if (tags.includes(tag)) return true;
      tags.push(tag);
    }
  }
  return false;
}

function subirFoto(inputElement) {
  try {
    const file = inputElement?.files?.[0];
    if (!file) {
      console.warn("⚠️ No hay archivo seleccionado para subir.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    fetch("http://localhost:5000/upload-photo", {
      method: "POST",
      body: formData,
    })
    .then((response) => response.json())
    .then((result) => {
      const url = `${window.location.origin}/uploads/${result.filename}`;
      inputElement.setAttribute("data-uploaded-url", url);
      console.log(`🔗 Foto subida con éxito: ${url}`);
    })
    .catch((error) => {
      console.error("❌ Error subiendo foto:", error);
    });
  } catch (e) {
    console.error("❌ Error inesperado en subirFoto():", e);
  }
}

function generarJSONInspeccion() {
  const totalPallets = parseInt(localStorage.getItem('totalPallets'), 10);
  const customer = localStorage.getItem('selectedCustomer') || "";
  const headOffice = (localStorage.getItem('selectedHeadOffice') || "").toUpperCase();
  const inspector = localStorage.getItem('inspectorName') || "";
  const loadingLocation = localStorage.getItem('loadingLocation') || "";
  const orderNumber = localStorage.getItem('orderNumber') || "";
  const fecha = new Date().toISOString();

  const id = Date.now().toString();
  const commodity = "BLUEBERRIES";

  const pallets = [];
  const uniquePackSizes = new Set();

  for (let i = 1; i <= totalPallets; i++) {
    const get = (name) => document.querySelector(`[name="${name}_${i}"]`)?.value || "";
    const packSize = get('packSize');
    if (packSize) uniquePackSizes.add(packSize);

   const palletFileUrl = (name) => {
  const input = document.getElementById(`${name}_${i}`);
  return input?.getAttribute("data-uploaded-url") || "";
};


    const pallet = {
      ORDERNUMBER: orderNumber,
      COMMODITY: commodity,
      PALLETNUMBER: i,
      PALLETTAG: get('palletTag'),
      BOXES: get('boxes'),
      PACKSIZE: packSize,
      LABEL: get('label'),
      UPC: (() => {
        const upcEl = document.querySelector(`[name="upc_${i}"]`);
        if (upcEl?.tomselect) {
          return upcEl.tomselect.getValue();
        }
        return upcEl?.value || "";
      })(),
      
      COUNTRY: get('country'),
      LABELLANGUAGE: get('labelLanguage'),
      CLAMSHELLMATCHES: get('clamshellMatchesLabel'),
      PALLETTYPE: get('palletType'),
      BOXESCONDITION: get('boxesCondition'),
      "PTI CHECK": get('productSecured'),
      CLAMSHELLTYPE: get('clamshellType'),
      CLOSURETYPE: get('closureType'),
      VARIETY: get('variety'),
      
      
      
      APPEPHOTO: palletFileUrl(`appearancePhotoInput_${i}`),
      SIZIPHOTO: palletFileUrl(`sizingPhotoInput_${i}`),

      STEMS: get('stems'),
      MOLDDECAY: get('moldDecay'),
      BAXLOREADING: get('baxloReading'),
      LABELSTATUS: document.getElementById(`labelStatus${i}`)?.textContent || "",
      PACKAGINGSTATUS: document.getElementById(`packagingStatus${i}`)?.textContent || "",
      QUALITYSTATUS: document.getElementById(`qualityStatus${i}`)?.textContent || "",
      TOTALSTATUS: document.getElementById(`totalStatus${i}`)?.textContent || "",
      AUTHORIZEDBY: document.getElementById(`auth_${i}`)?.value || "",
      PALLETPHOTO: palletFileUrl(`palletPhotoInput_${i}`),
      LABELPHOTO: palletFileUrl("labelPhotoInput"),
      QUALITYPHOTO: palletFileUrl("qualityPhotoInput"),
      TEMPPHOTO: palletFileUrl(`tempPhotoInput_${i}`)
    };
    pallets.push(pallet);
  }

  return {
    ID: id,
    ORDERNUMBER: orderNumber,
    COMMODITY: commodity,
    CUSTOMER: customer,
    HEADOFFICE: headOffice,
    INSPECTOR: inspector,
    DATE: fecha,
    LOADINGLOCATION: loadingLocation,
    PACKSIZE_COUNT: uniquePackSizes.size,
    PALLETS: pallets
  };
}

function exportarExcel(json) {
  const { ID, ORDERNUMBER, COMMODITY, CUSTOMER, HEADOFFICE, INSPECTOR, DATE, LOADINGLOCATION, PACKSIZE_COUNT, PALLETS } = json;

  let totalBoxes = 0;
  PALLETS.forEach(p => {
    const boxes = parseInt(p.BOXES, 10);
    if (!isNaN(boxes)) totalBoxes += boxes;
  });

  const wb1 = XLSX.utils.book_new();
  const sheet1 = XLSX.utils.json_to_sheet([{
    ID: `'${ID}`,
    ORDERNUMBER,
    COMMODITY,
    CUSTOMER,
    HEADOFFICE,
    INSPECTOR,
    DATE,
    LOADINGLOCATION,
    TOTAL_PALLETS: PALLETS.length,
    TOTAL_CAJAS: totalBoxes,
    PACKSIZE_COUNT
  }]);
  XLSX.utils.book_append_sheet(wb1, sheet1, "INSPECCION");
  XLSX.writeFile(wb1, "Inspeccion.xlsx");

  setTimeout(() => {
    const palletDataWithID = PALLETS.map(p => ({
      ORDERNUMBER: ORDERNUMBER,
      ...p
    }));
    const wb2 = XLSX.utils.book_new();
    const sheet2 = XLSX.utils.json_to_sheet(palletDataWithID);
    XLSX.utils.book_append_sheet(wb2, sheet2, "PALLETS");
    XLSX.writeFile(wb2, "Pallets.xlsx");
  }, 300);
}
