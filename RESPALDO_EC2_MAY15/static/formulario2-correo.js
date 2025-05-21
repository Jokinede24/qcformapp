window.BASE_URL = window.BASE_URL || window.location.origin;

function enviarCorreoResumen() {
  const totalPallets = parseInt(localStorage.getItem("totalPallets") || "0", 10);
  const selectedCustomer = localStorage.getItem("selectedCustomer") || "";
  const selectedHeadOffice = localStorage.getItem("selectedHeadOffice") || "";
  const inspector = localStorage.getItem("inspectorName") || "no lo está importando";
  const loadDate = localStorage.getItem("inspectionDate") || new Date().toLocaleDateString();
  const orderNumber = localStorage.getItem("orderNumber") || "N/A";
  const loadingLocation = localStorage.getItem("loadingLocation") || "no lo está importando";
  const resumenPorPack = JSON.parse(localStorage.getItem("resumenPorPack") || "{}");
  const palletTags = JSON.parse(localStorage.getItem("palletTags") || "{}");
  const pdfFilename = localStorage.getItem("pdfFilename") || "";

  const palletsData = JSON.parse(localStorage.getItem("palletsFormulario") || "[]");
  console.log("📦 Pallets cargados desde palletsFormulario:", palletsData);

  const resumenPallets = palletsData.map((p, index) => ({
    pallet: p.PALLETNUMBER || p.pallet || (index + 1),
    tag: p.PALLETTAG || null,
    labelStatus: p.LABELSTATUS || "",
    packagingStatus: p.PACKAGINGSTATUS || "",
    qualityStatus: p.QUALITYSTATUS || "",
    totalStatus: p.TOTALSTATUS || "",
    cajas: p.BOXES || "0",
    packSize: p.PACKSIZE || ""
  }));

  const finalText = document.getElementById("finalOrderStatus")?.textContent.trim().toUpperCase() || "N/A";

  const resumen = {
    orderNumber,
    customer: selectedCustomer,
    headOffice: selectedHeadOffice,
    loadingLocation,
    loadDate,
    inspector,
    totalPallets,
    packSizesResumen: resumenPorPack,
    pallets: resumenPallets
  };

  const mensaje = construirMensajeResumen(resumen);

  if (!pdfFilename) {
    console.warn("⛔ No se encontró PDF para adjuntar. Correo no enviado.");
    return;
  }

  const status = resumenPallets.some(p => (p.totalStatus || "").trim().toUpperCase() === "FAILED") ? "FAILED" : "PASSED";
  const statusIcon = status === "PASSED" ? "✅" : "❌";

  fetch(`${BASE_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "formquality0@gmail.com",
      subject: `${statusIcon} Inspected Order Summary - ORDER ${orderNumber} | ${selectedCustomer} - FINAL ORDER STATUS ${finalText}`,
      message: mensaje,
      pdfFilename: pdfFilename
    })
  })
  .then(res => {
    if (res.ok) {
      console.log("📧 Correo de resumen enviado correctamente.");
    } else {
      console.warn("⚠️ Error al enviar correo resumen.");
    }
  })
  .catch(err => {
    console.error("❌ Error de red al enviar correo resumen:", err);
  });
}

function resumirPackSizes(pallets) {
  const resumen = {};
  pallets.forEach(p => {
    const key = p.packSize;
    if (!resumen[key]) resumen[key] = { pallets: 0, cajas: 0 };
    resumen[key].pallets += 1;
    resumen[key].cajas += parseInt(p.cajas || "0", 10);
  });
  return resumen;
}

function construirMensajeResumen(data) {
  const finalText = document.getElementById("finalOrderStatus")?.textContent.trim().toUpperCase() || "N/A";
  const finalStatus = finalText === "FAILED"
    ? "<span style='color:red; font-weight:bold;'>❌ FAILED</span>"
    : "<span style='color:green; font-weight:bold;'>✅ PASSED</span>";

  let mensaje = `<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6;">
  <h2 style="color: #333;">📄 INSPECTED ORDER SUMMARY</h2>

  <p style="font-size: 17px;"><strong>🆔 ORDER NUMBER:</strong> ${data.orderNumber}</p>
  <p style="font-size: 17px;"><strong>FINAL ORDER STATUS:</strong> ${finalStatus}</p>
  <p style="font-size: 17px;"><strong>🏬 CUSTOMER:</strong> ${data.customer}</p>
  <p><strong>🏢 HEAD OFFICE:</strong> ${data.headOffice}</p>
  <p><strong>📍 LOADING LOCATION:</strong> ${data.loadingLocation}</p>
  <p><strong>📅 LOAD DATE:</strong> ${data.loadDate}</p>
  <p><strong>👷 INSPECTOR:</strong> ${data.inspector}</p>
  <p><strong>📦 TOTAL DE PALLETS:</strong> ${data.totalPallets}</p>
  <hr>

  <h3>📦 PACKSIZES SUMMARY:</h3>`;

  for (const pack in data.packSizesResumen) {
    const resumen = data.packSizesResumen[pack];
    mensaje += `<p><strong>PACK SIZE:</strong> ${pack}<br>
    PALLET QUANTITY = ${resumen.pallets}<br>
    TOTAL BOXES = ${resumen.cajas}</p>`;
  }

  console.log("📋 Pallets recibidos para resumen:", data.pallets);

  data.pallets.forEach((p, idx) => {
    console.log(`🔍 Pallet ${idx + 1} - TOTALSTATUS: '${p.totalStatus}'`);
  });

  const passed = data.pallets.filter(p => (p.totalStatus || "").trim().toUpperCase() === "PASSED").length;
  const failed = data.pallets.filter(p => (p.totalStatus || "").trim().toUpperCase() === "FAILED").length;

  console.log(`✅ PASSED COUNT: ${passed}`);
  console.log(`❌ FAILED COUNT: ${failed}`);

  mensaje += `
  <hr>
  <h3>📊 PALLET STATUS SUMMARY:</h3>
  <p><strong style="color:green;">✅ PASSED PALLETS:</strong> ${passed}</p>
  <p><strong style="color:red;">❌ FAILED PALLETS:</strong> ${failed}</p>
  `;

  mensaje += `<hr>
  <h3>📋 PALLET DETAILS:</h3>`;

  data.pallets.forEach(p => {
    const color = (p.totalStatus || "").trim().toUpperCase() === "FAILED" ? "red" : "green";
    const tag = p.tag ? ` (TAG: ${p.tag})` : "";
    mensaje += `<div style="margin-bottom: 12px; border: 1px solid #ccc; padding: 10px;">
      <strong>PALLET ${p.pallet}${tag}</strong><br>
      PACK SIZE: ${p.packSize}<br>
      BOXES: ${p.cajas}<br>
      LABEL STATUS: <span style="color:${p.labelStatus === 'FAILED' ? 'red' : 'green'}">${p.labelStatus}</span><br>
      PACKAGING STATUS: <span style="color:${p.packagingStatus === 'FAILED' ? 'red' : 'green'}">${p.packagingStatus}</span><br>
      QUALITY STATUS: <span style="color:${p.qualityStatus === 'FAILED' ? 'red' : 'green'}">${p.qualityStatus}</span><br>
      TOTAL STATUS: <span style="color:${color}">${p.totalStatus}</span><br>
    </div>`;
  });

  mensaje += `</div>`;
  return mensaje;
}
