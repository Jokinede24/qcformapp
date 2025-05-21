window.BASE_URL = window.BASE_URL || window.location.origin;

function enviarCorreoAlertaPalletsFailed() {
  const totalPallets = parseInt(localStorage.getItem("totalPallets") || "0", 10);
  const selectedCustomer = localStorage.getItem("selectedCustomer") || "";
  const orderNumber = localStorage.getItem("orderNumber") || "N/A";

  const failedPallets = [];

  for (let i = 1; i <= totalPallets; i++) {
    const labelStatus = document.getElementById(`labelStatus${i}`)?.textContent || "";
    const packagingStatus = document.getElementById(`packagingStatus${i}`)?.textContent || "";
    const qualityStatus = document.getElementById(`qualityStatus${i}`)?.textContent || "";
    const totalStatus = document.getElementById(`totalStatus${i}`)?.textContent || "";

    if ([labelStatus, packagingStatus, qualityStatus].includes("FAILED")) {
      const erroresDetectados = getErroresPorCampo(i);
      console.log(`🔍 PALLET ${i} → Errores detectados:`, erroresDetectados);

      failedPallets.push({
        pallet: i,
        customer: selectedCustomer,
        orderNumber,
        palletTag: document.querySelector(`[name="palletTag_${i}"]`)?.value || "",
        boxes: document.querySelector(`[name="boxes_${i}"]`)?.value || "0",
        packSize: document.querySelector(`[name="packSize_${i}"]`)?.value || "",
        labelStatus,
        packagingStatus,
        qualityStatus,
        totalStatus,
        labelFields: getSectionFields(i, 'label'),
        packagingFields: getSectionFields(i, 'packaging'),
        qualityFields: getSectionFields(i, 'quality'),
        errores: erroresDetectados
      });
    }
  }

  if (failedPallets.length === 0) return;

  const mensaje = construirMensajeAlerta(failedPallets);

  fetch(`${BASE_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "formquality0@gmail.com",
      subject: `⚠️ PALLETS FAILED ALERT - ORDER ${orderNumber}`,
      message: mensaje
    })
  })
    .then(res => {
      if (res.ok) console.log("📧 Alert email sent successfully.");
      else console.warn("⚠️ Failed to send alert email.");
    })
    .catch(err => console.error("❌ Network error while sending alert email:", err));
}

function construirMensajeAlerta(pallets) {
  let mensaje = `<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6;">
  <h2>⚠️ PALLETS FAILED ALERT</h2><hr>`;

  pallets.forEach(p => {
    mensaje += `<div style="margin-bottom: 24px;">
      <h3>PALLET ${p.pallet}</h3>
      <p><strong>CUSTOMER:</strong> ${p.customer}</p>
      <p><strong>ORDER NUMBER:</strong> ${p.orderNumber}</p>
      <p><strong>PALLET TAG #:</strong> ${p.palletTag}</p>
      <p><strong>BOXES:</strong> ${p.boxes}</p>
      <p><strong>PACK SIZE:</strong> ${p.packSize}</p>`;

    const pintarCampos = (fields, statusKey, emoji, titulo) => {
      if (p[statusKey] === "FAILED") {
        mensaje += `
          <div style="border-top: 1px solid #ccc; padding-top: 8px; margin-top: 12px;">
            <h4 style="margin-bottom: 6px;">${emoji} ${titulo} - PALLET ${p.pallet}</h4>`;
        for (const key in fields) {
          const valor = fields[key];
          const cleanKey = key.replace(/\s*\(PALLET \d+\)\s*/g, "").trim();
          const isError = p.errores.some(e => e.replace(/\s*\(PALLET \d+\)\s*/g, "").trim() === cleanKey);
          const style = isError ? 'color:red;font-weight:bold' : '';
          mensaje += `<p style="${style}; margin:2px 0;"><strong>${key}:</strong> ${valor}</p>`;
        }
        mensaje += `</div>`;
      }
    };

    pintarCampos(p.labelFields, "labelStatus", "🏷️", "LABEL");
    pintarCampos(p.packagingFields, "packagingStatus", "📦", "PACKAGING");
    pintarCampos(p.qualityFields, "qualityStatus", "🍓", "QUALITY");



  const approveLink = `${BASE_URL}/api/authorize?pallet=${p.pallet}&order=${p.orderNumber}&customer=${encodeURIComponent(p.customer)}&action=approve`;
const rejectLink  = `${BASE_URL}/api/authorize?pallet=${p.pallet}&order=${p.orderNumber}&customer=${encodeURIComponent(p.customer)}&action=reject`;
const cutLink     = `${BASE_URL}/api/authorize?pallet=${p.pallet}&order=${p.orderNumber}&customer=${encodeURIComponent(p.customer)}&action=cut`;


const authKey = `autorizacion_orden_${p.orderNumber}_pallet_${p.pallet}`;
const authStatus = localStorage.getItem(authKey);

if (authStatus) {
  mensaje += `<p style="color:orange;font-weight:bold;">⚠️ This pallet was already marked as '${authStatus.toUpperCase()}'. No further action is allowed.</p>`;
} else {
  mensaje += `
    <p>
      <a href="${approveLink}" style="display:inline-block;padding:10px 20px;background-color:#28a745;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        ✅ AUTHORIZE
      </a>
    </p>
    <p>
      <a href="${rejectLink}" style="display:inline-block;padding:10px 20px;background-color:#dc3545;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        ❌ DO NOT AUTHORIZE
      </a>
    </p>
    <p>
      <a href="${cutLink}" style="display:inline-block;padding:10px 20px;background-color:#ffc107;color:black;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        ✂️ CUT ORDER
      </a>
    </p>`;
}




    mensaje += `</div><hr style="border: 2px solid #333; margin: 30px 0;">`;
  });

  mensaje += `</div>`;
  return mensaje;
}

function getErroresPorCampo(pallet) {
  const get = (name) => document.querySelector(`[name="${name}_${pallet}"]`)?.value || "";
  const headOffice = (localStorage.getItem("selectedHeadOffice") || "").toUpperCase();

  const erroresCliente = detectarErroresPorCliente(pallet, get, headOffice);
  const erroresBase = detectarErroresBase(pallet, get);

  const erroresCombinados = [...new Set([...erroresCliente, ...erroresBase])];

  const allFields = {
    ...getSectionFields(pallet, 'label'),
    ...getSectionFields(pallet, 'packaging'),
    ...getSectionFields(pallet, 'quality')
  };

  Object.entries(allFields).forEach(([label, valor]) => {
    if (!valor || valor.trim() === "") {
      erroresCombinados.push(label);
    }
  });

  console.log(`📌 PALLET ${pallet} → Errores base:`, erroresBase);
  console.log(`📌 PALLET ${pallet} → Errores cliente:`, erroresCliente);
  return erroresCombinados;
}

function detectarErroresBase(pallet, get) {
  const errores = [];

  const baxlo = get("baxloReading");
  const mold = get("moldDecay");
  const stems = get("stems");
  const appearance = get("fruitAppearance");
  const sizing = get("sizing");
  const boxes = get("boxesCondition");
  const pti = get("productSecured");
  const clamshellMatches = get("clamshellMatchesLabel");

  if (appearance === "WET") errores.push(`FRUIT APPEARANCE (PALLET ${pallet})`);
  if (sizing === "10+") errores.push(`SIZING (PALLET ${pallet})`);
  if (mold === "ISSUES - MOLD / DECAY (MORE THAN 2%)") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
  if (mold === "PRESENT - MOLD / DECAY (LESS THAN 2%)") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
  if (baxlo === "SOFT : < 54") errores.push(`BAXLO READING (PALLET ${pallet})`);
  if (stems === "5% - 10%" || stems === "MORE THAN 10%") errores.push(`STEMS (PALLET ${pallet})`);

  if (boxes === "NO") errores.push(`BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET ${pallet})`);
  if (pti === "NO") errores.push(`PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS "PACKED ON' FOR DATE (PALLET ${pallet})`);
  if (clamshellMatches === "NO") errores.push(`CLAMSHELL WEIGHT MATCHES LABEL WEIGHT (PALLET ${pallet})`);

  return errores;
}

function getSectionFields(pallet, section) {
  const fields = {};
  const sectionFields = document.querySelectorAll(`[data-section="${section}"][data-pallet="${pallet}"]`);

  sectionFields.forEach(field => {
    const labelEl = field.closest("label") || document.querySelector(`label[for="${field.id}"]`);
    let label = labelEl?.textContent?.trim() || field.name;

    if (!label.toUpperCase().includes(`(PALLET ${pallet})`)) {
      label = `${label.toUpperCase()} (PALLET ${pallet})`;
    } else {
      label = label.toUpperCase();
    }

    fields[label] = field.value || "";
  });

  console.log(`📋 Campos ${section.toUpperCase()} - PALLET ${pallet}:`, fields);
  return fields;
}
