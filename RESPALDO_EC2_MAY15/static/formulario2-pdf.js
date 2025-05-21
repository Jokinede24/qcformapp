document.addEventListener("DOMContentLoaded", () => {
  const finalPage = document.querySelector(".wizard-page.final-page");
  if (!finalPage) return;

  const observer = new MutationObserver(async () => {
    if (finalPage.style.display === "block") {
      console.log("📄 Final page visible. Restaurando fotos, subiendo y generando PDF...");

      try {
        // 🟢 Restaurar fotos desde localStorage
        await restaurarTodasFotosDesdeLocalStorage();
        console.log("♻️ Fotos restauradas desde localStorage");

        // 🔼 Subir fotos antes de generar PDF
        await subirFotoFinal();
        console.log("✅ Todas las fotos fueron subidas.");

        const jsonFinal = generarJSONInspeccion();
        console.log("📋 JSON completo para PDF:", JSON.stringify(jsonFinal, null, 2));

        const res = await fetch("/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonFinal)
        });

        const result = await res.json();
        if (result.status === "success") {
          console.log("✅ PDF generado correctamente:", result.pdf);
          localStorage.setItem("pdfFilename", result.pdf);

          setTimeout(() => {
            console.log("✉️ Enviando correo con PDF adjunto:", result.pdf);
            enviarCorreoResumen();
          }, 500);
        } else {
          console.warn("⚠️ Error en respuesta del servidor al generar PDF:", result.message);
        }

      } catch (err) {
        console.error("❌ Error en proceso de fotos o generación de PDF:", err);
      }
    }
  });

  observer.observe(finalPage, { attributes: true, attributeFilter: ['style'] });
});

// 🔄 NUEVA FUNCIÓN
async function restaurarTodasFotosDesdeLocalStorage() {
  const totalPallets = parseInt(localStorage.getItem("totalPallets") || "1", 10);
  for (let i = 1; i <= totalPallets; i++) {
    await restaurarFotosDesdeLocalStorage(i);
  }
}


// ============================
// Subida de fotos final
// ============================
async function subirFotoFinal() {
  const totalPallets = parseInt(localStorage.getItem("totalPallets") || "1", 10);
  for (let i = 1; i <= totalPallets; i++) {
    const inputIds = [
  `palletPhotoInput_${i}`,
  `labelPhotoInput_${i}`,
  `qualityPhotoInput_${i}`,
  `tempPhotoInput_${i}`,
  `appearancePhotoInput_${i}`,
  `sizingPhotoInput_${i}`,
  `stemsPhotoInput_${i}`,
  `moldPhotoInput_${i}`
];


    for (const inputId of inputIds) {
      const input = document.getElementById(inputId);
      if (!input || !input.files.length) continue;

      const formData = new FormData();
      formData.append("photo", input.files[0]);

      try {
        const response = await fetch("/upload-photo", {
          method: "POST",
          body: formData
        });

        const result = await response.json();
        if (result.status === "success") {
          const fileUrl = `${window.location.origin}/uploads/${result.filename}`;
          input.setAttribute("data-uploaded-url", fileUrl);
          console.log(`📤 Foto subida (${inputId}): ${result.filename}`);
        } else {
          console.warn(`⚠️ Falló la subida (${inputId})`);
        }
      } catch (err) {
        console.error(`❌ Error subiendo foto (${inputId}):`, err);
      }
    }
  }
}


// ============================
// Generar JSON Final
// ============================
function generarJSONInspeccion() {
  const totalPallets = parseInt(localStorage.getItem("totalPallets") || "1", 10);
  const resumenPorPack = JSON.parse(localStorage.getItem("resumenPorPack") || "{}");

  const pallets = [];

  for (let i = 1; i <= totalPallets; i++) {
    const get = (name) => document.querySelector(`[name="${name}_${i}"]`)?.value || "";

    const upcEl = document.querySelector(`[name="upc_${i}"]`);
    const upcValue = upcEl?.tomselect?.getValue?.() || upcEl?.value || "";

    pallets.push({
      ORDERNUMBER: localStorage.getItem("orderNumber") || "N/A",
      COMMODITY: "BLUEBERRIES",
      PALLETNUMBER: i,
      PALLETTAG: get("palletTag"),
      BOXES: get("boxes"),
      PACKSIZE: get("packSize"),
      LABEL: get("label"),
      UPC: upcValue,
      COUNTRY: get("country"),
      LABELLANGUAGE: get("labelLanguage"),
      CLAMSHELLMATCHES: get("clamshellMatchesLabel"),
      PALLETTYPE: get("palletType"),
      BOXESCONDITION: get("boxesCondition"),
      "PTI CHECK": get("productSecured"),
      CLAMSHELLTYPE: get("clamshellType"),
      CLOSURETYPE: get("closureType"),
      VARIETY: get("variety"),
      FRUITAPPEARANCE: get("fruitAppearance"),
      SIZING: get("sizing"),
      STEMS: get("stems"),
      MOLDDECAY: get("moldDecay"),
      BAXLOREADING: get("baxloReading"),
      LABELSTATUS: document.getElementById(`labelStatus${i}`)?.textContent || "N/A",
      PACKAGINGSTATUS: document.getElementById(`packagingStatus${i}`)?.textContent || "N/A",
      QUALITYSTATUS: document.getElementById(`qualityStatus${i}`)?.textContent || "N/A",
      TOTALSTATUS: document.getElementById(`totalStatus${i}`)?.textContent || "N/A",
      AUTHORIZEDBY: document.getElementById(`authorizedBy_${i}`)?.value || "",
      PALLETPHOTO: document.getElementById(`palletPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      LABELPHOTO: document.getElementById(`labelPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      QUALITYPHOTO: document.getElementById(`qualityPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      TEMPPHOTO: document.getElementById(`tempPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      FRUITAPPEARANCEPHOTO: document.getElementById(`appearancePhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      SIZINGPHOTO: document.getElementById(`sizingPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      STEMSPHOTO: document.getElementById(`stemsPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || "",
      MOLDPHOTO: document.getElementById(`moldPhotoInput_${i}`)?.getAttribute("data-uploaded-url") || ""

    });
  }

  const resumenFinal = {};
  for (const [packSize, datos] of Object.entries(resumenPorPack)) {
    resumenFinal[packSize] = {
      pallets: datos.pallets || 0,
      cajas: datos.cajas || 0
    };
  }

  return {
    ID: `${Date.now()}`,
    ORDERNUMBER: localStorage.getItem("orderNumber") || "N/A",
    CUSTOMER: localStorage.getItem("selectedCustomer") || "N/A",
    HEADOFFICE: localStorage.getItem("selectedHeadOffice") || "N/A",
    INSPECTOR: localStorage.getItem("inspectorName") || "N/A",
    DATE: new Date().toISOString(),
    LOADINGLOCATION: localStorage.getItem("loadingLocation") || "N/A",
    PACKSIZE_COUNT: resumenFinal,
    PALLETS: pallets
  };
}

