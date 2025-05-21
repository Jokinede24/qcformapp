function evaluarCondicionesBase(palletIndex = 1) {
  const failed = "FAILED";

  const get = (idBase) =>
    document.querySelector(`[name="${idBase.replace('{X}', palletIndex)}"]`)?.value || "";

  const set = (idBase, value) => {
    const spanId = idBase.replace('{X}', palletIndex).replace('OrderStatus_', 'Status');
    const el = document.getElementById(spanId);
    if (el) {
      el.textContent = value;
      el.classList.remove("passed", "failed");
      el.classList.add(value === "PASSED" ? "passed" : "failed");
      console.log(`🧩 SET → ${spanId} = ${value}`);
    } else {
      console.warn(`⚠️ No se encontró el elemento con ID: ${spanId}`);
    }
  };

  // ----------- QUALITY -----------
  const baxlo = get("baxloReading_{X}");
  const mold = get("moldDecay_{X}");
  const stems = get("stems_{X}");
  const sizing = get("sizing_{X}");
  const appearance = get("fruitAppearance_{X}");
  const boxesCondition = get("boxesCondition_{X}");
  const productSecured = get("productSecured_{X}");
  const variety = get("variety_{X}").trim().toUpperCase();
  const packSize = get("packSize_{X}").trim().toUpperCase();

  const qualityFields = [baxlo, mold, stems, sizing, appearance];
  const qualityFails = [
    baxlo === "SOFT : < 54",
    mold === "ISSUES - MOLD / DECAY (MORE THAN 2%)",
    stems === "MORE THAN 10%",
    sizing === "10+",
    appearance === "WET"
  ];

  let resumen = {};
  try {
    resumen = JSON.parse(localStorage.getItem("resumenPorPack") || "{}");
  } catch (e) {
    console.warn("⚠️ resumenPorPack no disponible o malformado");
  }

  const normalizedPack = packSize.normalize("NFKD").replace(/\s+/g, " ").trim().toUpperCase();
  const resumenKeys = Object.keys(resumen);
  console.log("📦 Claves en resumenPorPack:", resumenKeys);

  let packRequiresSekoya = false;
  for (const k of resumenKeys) {
    const kNorm = k.normalize("NFKD").replace(/\s+/g, " ").trim().toUpperCase();
    if (kNorm === normalizedPack) {
      const variedadResumen = resumen[k]?.variety || "";
      console.log(`🔍 Comparando con: '${k}' → variedad en resumen: '${variedadResumen}'`);
      packRequiresSekoya = variedadResumen.toUpperCase().includes("SEKO");
      break;
    }
  }

  const varietyIsSekoya = variety === "SEKOYA";
  console.log(`🧪 Validando SEKOYA → packSize='${packSize}', requiereSEKOYA=${packRequiresSekoya}, variedad=${variety}`);

  if (qualityFields.some(f => f === "")) {
    set("qualityOrderStatus_{X}", failed);
  } else if (qualityFails.some(Boolean)) {
    set("qualityOrderStatus_{X}", failed);
  } else if (packRequiresSekoya && !varietyIsSekoya) {
    set("qualityOrderStatus_{X}", failed);
  } else {
    set("qualityOrderStatus_{X}", "PASSED");
  }

  // ----------- PACKAGING -----------
  const packagingFields = [productSecured, boxesCondition];
  const packagingFails = [
    productSecured === "NO",
    boxesCondition === "NO"
  ];

  if (packagingFields.some(f => f === "")) {
    set("packagingOrderStatus_{X}", failed);
  } else if (packagingFails.some(Boolean)) {
    set("packagingOrderStatus_{X}", failed);
  } else {
    set("packagingOrderStatus_{X}", "PASSED");
  }

  // ----------- LABEL -----------
  const upc = String(get("upc_{X}")).trim().replace(/^0+/, "");
  const labelRaw = get("label_{X}");
  const packSizeRaw = get("packSize_{X}");
  const clamshellMatches = get("clamshellMatchesLabel_{X}");
  const customerRaw = (localStorage.getItem("selectedCustomer") || "").trim().replace(/,+$/, "");

  console.log(`🧪 LABEL → UPC: ${upc}, Label: '${labelRaw}', PackSize: '${packSizeRaw}', Clamshell: ${clamshellMatches}`);
  console.log(`🧪 Cliente original: '${customerRaw}'`);

  const label = labelRaw?.normalize("NFKD").trim().toUpperCase();
  const packSizeLabel = packSizeRaw?.normalize("NFKD").replace(/\s+/g, " ").trim().toUpperCase();
  const packSizeKey = packSizeRaw?.normalize("NFKD").replace(/\s+/g, " ").trim();
  const customer = customerRaw.normalize("NFKD").trim().toUpperCase();

  function encontrarClave(candidatos, buscado) {
    const buscadoNormalizado = buscado.replace(/\s+/g, " ").toUpperCase();
    return candidatos.find(k => k.replace(/\s+/g, " ").toUpperCase() === buscadoNormalizado);
  }

  let customerKey = encontrarClave(Object.keys(window.upcsData || {}), customer);
  console.log("🔍 customerKey encontrado:", customerKey);

  let fuenteCliente = window.upcsData?.[customerKey];
  let labelKey = encontrarClave(Object.keys(fuenteCliente || {}), label);
  console.log("🔍 labelKey encontrado:", labelKey);

  let lista = fuenteCliente?.[labelKey]?.[packSizeKey];

  if (!lista) {
    console.warn("⚠️ Fallback a 'OTHERS' para cliente o combinación no encontrada");
    fuenteCliente = window.upcsData?.["OTHERS"];
    labelKey = encontrarClave(Object.keys(fuenteCliente || {}), label);
    lista = fuenteCliente?.[labelKey]?.[packSizeKey];
  }

  console.log("→ UPCs esperados para validación:", lista);

  const upcValido = Array.isArray(lista) && lista.some(val => String(val).trim().replace(/^0+/, "") === upc);

  const labelFields = [clamshellMatches, upc];
  const labelsSoloOrganicos = ["HIPPIE ORGANICS", "GREENWISE", "ORGANIC BLUEBERRIES", "SIGNATURE FARMS"];
  const labelsConvencionales = ["ALPINE FRESH", "BASKET & BUSHEL", "MARKET DISTRICT - PREMIUM", "SIGNATURE FARMS", "PEAK HARVEST"];
  const esOrganico = packSizeLabel.includes("(ORGANIC)");
  const usaLabelOrganico = labelsSoloOrganicos.includes(label);
  const usaLabelConvencional = labelsConvencionales.includes(label);

  let labelStatusFinal = failed;

  if (labelFields.some(f => f === "")) {
    console.warn("❌ LABEL incompleto: clamshell o upc vacío");
  } else if (clamshellMatches === "NO") {
    console.warn("❌ LABEL falló por clamshell NO");
  } else if (!esOrganico && usaLabelOrganico) {
    console.warn("❌ LABEL falló: orgánico requerido pero pack no lo es");
  } else if (esOrganico && usaLabelConvencional) {
    console.warn("❌ LABEL falló: pack orgánico con label convencional");
  } else if (!upcValido) {
    console.warn("❌ LABEL falló por UPC inválido:", upc);
  } else {
    console.log("✅ LABEL pasó todas las condiciones");
    labelStatusFinal = "PASSED";
  }

  set("labelOrderStatus_{X}", labelStatusFinal);
  console.log(`🔍 Comprobando DOM luego de set → labelStatus${palletIndex} =`, document.getElementById(`labelStatus${palletIndex}`)?.textContent);

  console.log(`🎯 Final LABEL STATUS (pallet ${palletIndex}): ${labelStatusFinal}`);

  // ----------- FINAL STATUS -----------
  const quality = document.getElementById(`qualityStatus${palletIndex}`)?.textContent || "";
  const packaging = document.getElementById(`packagingStatus${palletIndex}`)?.textContent || "";
  const labelStatus = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";

  const final = [quality, packaging, labelStatus].includes(failed) ? failed : "PASSED";
  console.log(`📦 FINAL STATUS PALLET ${palletIndex}: ${final}`);

  set("totalOrderStatus_{X}", final);
}


//////////////////////////// COSTCO

function evaluarCondicionesCostco(palletIndex = 1) {
  const failed = "FAILED";

  const get = (idBase) =>
    document.querySelector(`[name="${idBase.replace('{X}', palletIndex)}"]`)?.value || "";

  const set = (idBase, value) => {
    const spanId = idBase.replace('{X}', palletIndex).replace('OrderStatus_', 'Status');
    const el = document.getElementById(spanId);
    if (el) {
      el.textContent = value;
    }
  };

  const headOffice = (localStorage.getItem("selectedHeadOffice") || "").toUpperCase();
  const country = get("country_{X}");
  const palletType = get("palletType_{X}");
  const clamshellType = get("clamshellType_{X}");
  const closureType = get("closureType_{X}");
  const labelLanguage = get("labelLanguage_{X}");
  const packSize = get("packSize_{X}");
  const label = get("label_{X}");
  const variety = get("variety_{X}");
  const stems = get("stems_{X}");
  const baxlo = get("baxloReading_{X}");
  const mold = get("moldDecay_{X}");
  const sizing = get("sizing_{X}");



  /////////COSTCO US

  if (headOffice.includes("COSTCO")) {
    if (palletType !== "CHEP" || clamshellType !== "FLAT" || closureType !== "TAPE, SECURED CORRECTLY") {
      set("packagingOrderStatus_{X}", failed);
    }

    if (
      variety === "RABBIT EYE" ||
      stems === "5% - 10%" || stems === "MORE THAN 10%" ||
      !["FIRM : 65 - 71", "CRUNCHY : >72"].includes(baxlo) ||
      mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)"
    ) {
      set("qualityOrderStatus_{X}", failed);
    }


    ////////COSTCO CANADA


    if (headOffice === "COSTCO CANADA") {
      if (labelLanguage !== "BI-LINGUAL") {
        set("labelOrderStatus_{X}", failed);
      }

      if (country !== "MEXICO" && country !== "PERU") {
        set("labelOrderStatus_{X}", failed);
      }

      const combinacionesValidas = [
        { pack: "12 X 18OZ (ORGANIC)", label: "HIPPIE ORGANICS" },
        { pack: "8 X 18 OZ (ORGANIC)", label: "HIPPIE ORGANICS" },
        { pack: "8 X 18OZ", label: "ALPINE FRESH" },
        { pack: "12 X 18OZ", label: "ALPINE FRESH" }
      ];

      const packClean = packSize.trim().toUpperCase();
      const labelClean = label.trim().toUpperCase();

      const esValida = combinacionesValidas.some(
        combo =>
          packClean === combo.pack.trim().toUpperCase() &&
          labelClean === combo.label.trim().toUpperCase()
      );

      if (!esValida) {
        set("labelOrderStatus_{X}", failed);
      }
    } else {
      const validPackSizes = ["12 X 18OZ", "12 X 18OZ (ORGANIC)"];
      const packClean = packSize.trim().toUpperCase();
      const labelClean = label.trim().toUpperCase();

      if (country === "ARGENTINA") {
        set("labelOrderStatus_{X}", failed);
      } else if (!validPackSizes.includes(packClean)) {
        set("labelOrderStatus_{X}", failed);
      } else {
        const expectedLabel =
          packClean === "12 X 18OZ" ? "ALPINE FRESH" :
          packClean === "12 X 18OZ (ORGANIC)" ? "HIPPIE ORGANICS" : "";

        if (labelClean !== expectedLabel.toUpperCase()) {
          set("labelOrderStatus_{X}", failed);
        }
      }
    }
  }

  ////////PUBLIX


  if (headOffice.includes("PUBLIX")) {
    const clamshellType = get("clamshellType_{X}");
    const variety = get("variety_{X}");
    const stems = get("stems_{X}");
    const mold = get("moldDecay_{X}");
    const baxlo = get("baxloReading_{X}");
    const country = get("country_{X}");
    const packSize = get("packSize_{X}");
    const label = get("label_{X}");
    const boxesCondition = get("boxesCondition_{X}");
    const productSecured = get("productSecured_{X}");

    const qualityFailsPublix = [
      stems === "5% - 10%" || stems === "",
      mold === "PRESENT - MOLD / DECAY (LESS THAN 2%)" || mold === "",
      baxlo === "SENSITIVE : 55 - 59" || baxlo === "",
      variety === "RABBIT EYE" || variety === ""
    ];

    if (qualityFailsPublix.some(Boolean)) {
      set("qualityOrderStatus_{X}", failed);
    }

    const packagingFailsPublix = [
      boxesCondition === "NO" || boxesCondition === "",
      productSecured === "NO" || productSecured === "",
      clamshellType !== "FLAT" || clamshellType === ""
    ];

    if (packagingFailsPublix.some(Boolean)) {
      set("packagingOrderStatus_{X}", failed);
    }

    if (country === "ARGENTINA" || country === "") {
      set("labelOrderStatus_{X}", failed);
    }

    const combinacionesValidasPublix = [
      { pack: "12 X 18OZ (ORGANIC)", label: "GREENWISE" },
      { pack: "12 X PINT (ORGANIC)", label: "HIPPIE ORGANICS" },
      { pack: "12 X PINT", label: "ALPINE FRESH" }
    ];

    const esValidaPublix = combinacionesValidasPublix.some(
      combo =>
        packSize.toUpperCase() === combo.pack.toUpperCase() &&
        label.toUpperCase() === combo.label.toUpperCase()
    );

    if (!esValidaPublix) {
      set("labelOrderStatus_{X}", failed);
    } else {
      const currentLabelStatus = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";
      if (currentLabelStatus !== failed) {
        set("labelOrderStatus_{X}", "PASSED");
      }
    }
  }

  ////HEB 

// ✅ CONDICIONALES ESPECÍFICOS PARA HEB
if (headOffice === "HEB") {
  const stems = get("stems_{X}").trim().toUpperCase();
  const mold = get("moldDecay_{X}").trim().toUpperCase();
  const baxlo = get("baxloReading_{X}").trim().toUpperCase();
  const sizing = get("sizing_{X}").trim().toUpperCase();
  const packSize = get("packSize_{X}").trim().toUpperCase();
  const label = get("label_{X}").trim().toUpperCase();
  const productSecured = get("productSecured_{X}").trim().toUpperCase();
  const boxesCondition = get("boxesCondition_{X}").trim().toUpperCase();

  const combinacionesValidasHEB = [
    "FRESH LABEL - 12 X PINT",
    "FRESH LABEL - 8 X 18OZ",
    "FRESH LABEL - 12 X 9.8OZ JUMBO",
    "FRESH LABEL - 12 X PINT (ORGANIC)",
    "FRESH LABEL - 8 X 18OZ (ORGANIC)",
    "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
    "HIPPIE ORGANICS - 8 X 18OZ (ORGANIC)",
    "HIPPIE ORGANICS - 12 X 18OZ (ORGANIC)"
  ];

  // ✅ QUALITY - condiciones específicas + campos vacíos
  const qualityFailsHEB = [
    stems === "5% - 10%",
    mold === "PRESENT - MOLD/DECAY (LESS THAN 2%)",
    baxlo === "SENSITIVE : 55 - 59",
    (sizing !== "21+" && label === "FRESH LABEL" && packSize === "12 X 9.8OZ JUMBO"),
    stems === "",
    mold === "",
    baxlo === "",
    sizing === ""
  ];

  if (qualityFailsHEB.some(Boolean)) {
    set("qualityOrderStatus_{X}", failed);
  }

  // ✅ PACKAGING - si los campos están vacíos o son "NO"
  const packagingFailsHEB = [
    productSecured === "NO" || productSecured === "",
    boxesCondition === "NO" || boxesCondition === ""
  ];

  if (packagingFailsHEB.some(Boolean)) {
    set("packagingOrderStatus_{X}", failed);
  }

  // ✅ LABEL - combinación pack+label
  const comboLabelPack = `${label} - ${packSize}`;
  const comboDirect = `${label} ${packSize}`;

  const labelValido = combinacionesValidasHEB.includes(comboLabelPack) || combinacionesValidasHEB.includes(comboDirect);

  if (!labelValido) {
    set("labelOrderStatus_{X}", failed);
  }
}

////////// SAFEWAY //////////
  if (headOffice === "SAFEWAY") {
  console.log("✅ Entrando a condicionales SAFEWAY");

  const baxloRaw = get("baxloReading_{X}").trim();
  const baxloClean = baxloRaw
    .toUpperCase()
    .replace(/\s*:\s*/, ':')   // Quita espacios alrededor de los ":"
    .replaceAll(' ', '');      // Quita todos los espacios restantes

  const packSize = get("packSize_{X}").trim().toUpperCase();
  const label = get("label_{X}").trim().toUpperCase();
  const stems = get("stems_{X}").trim().toUpperCase();
  const mold = get("moldDecay_{X}").trim().toUpperCase();
  const sizing = get("sizing_{X}").trim().toUpperCase();
  const variety = get("variety_{X}").trim().toUpperCase();
  const boxesCondition = get("boxesCondition_{X}").trim().toUpperCase();
  const productSecured = get("productSecured_{X}").trim().toUpperCase();

  console.log("🔍 BAXLO RAW:", baxloRaw);
  console.log("🔍 BAXLO CLEAN:", baxloClean);

  // ✅ QUALITY - SENSITIVE:55-59 + campos vacíos
  const qualityFailsSafeway = [
    baxloClean === "SENSITIVE:55-59",
    baxloRaw === "",
    mold === "",
    stems === "",
    sizing === "",
    variety === ""
  ];

  if (qualityFailsSafeway.some(Boolean)) {
    console.log("❌ QUALITY FAILED triggered");
    set("qualityOrderStatus_{X}", failed);
  }

  // ✅ PACKAGING - campos vacíos o "NO"
  const packagingFailsSafeway = [
    boxesCondition === "NO" || boxesCondition === "",
    productSecured === "NO" || productSecured === ""
  ];

  if (packagingFailsSafeway.some(Boolean)) {
    set("packagingOrderStatus_{X}", failed);
  }

  // ✅ LABEL - combinaciones válidas
  const combinacionesValidasSafeway = [
  "ALPINE FRESH - 12 X 9.8OZ JUMBO",
  "SIGNATURE FARMS - 12 X PINT (ORGANIC)",
  "SIGNATURE FARMS - 12 X 6OZ (ORGANIC)",
  "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
  "HIPPIE ORGANICS - 12 X 18OZ (ORGANIC)",
  "HIPPIE ORGANICS - 12 X 6OZ (ORGANIC)",
  "SIGNATURE FARMS - 8 X 18OZ",
  "ALPINE FRESH - 12 X 18OZ",
  "ALPINE FRESH - 8 X 18OZ",
  "ALPINE FRESH - 12 X 6OZ",
  // ✅ Agregadas según JSON de Safeway Spokane
  "SIGNATURE FARMS - 12 X 9.8OZ JUMBO",
  "ORGANICS BLUEBERRIES - 12 X PINT",
  "ORGANICS BLUEBERRIES - 12 X PINT (ORGANIC)",
  "ORGANICS BLUEBERRIES - 12 X 6OZ",
  "ORGANICS BLUEBERRIES - 12 X 6OZ (ORGANIC)"
];


  const comboLabelPack = `${label} - ${packSize}`;
  const comboDirect = `${label} ${packSize}`;
  const labelValido = combinacionesValidasSafeway.includes(comboLabelPack) || combinacionesValidasSafeway.includes(comboDirect);

  if (!labelValido) {
    set("labelOrderStatus_{X}", failed);
  }
}

 ////////// WHOLEFOODS //////////
  ////////// WHOLEFOODS //////////
  if (headOffice === "WHOLEFOODS") {
  console.log("✅ Entrando a condicionales WHOLEFOODS");

  const customer = (localStorage.getItem("selectedCustomer") || "").toUpperCase();
  const baxloRaw = get("baxloReading_{X}").trim();
  const baxloClean = baxloRaw.toUpperCase().replace(/\s*:\s*/, ':').replaceAll(' ', '');
  const mold = get("moldDecay_{X}").trim().toUpperCase();
  const packSize = get("packSize_{X}").trim().toUpperCase();
  const label = get("label_{X}").trim().toUpperCase();
  const boxesCondition = get("boxesCondition_{X}").trim().toUpperCase();
  const productSecured = get("productSecured_{X}").trim().toUpperCase();

  const currentQuality = document.getElementById(`qualityStatus${palletIndex}`)?.textContent || "";
  const currentPackaging = document.getElementById(`packagingStatus${palletIndex}`)?.textContent || "";
  const currentLabel = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";

  // 🧪 DEBUG
  console.log("👤 CUSTOMER:", customer);
  console.log("🔍 BAXLO RAW:", baxloRaw);
  console.log("🧪 BAXLO CLEAN:", baxloClean);
  console.log("🦠 MOLD:", mold);

  // ✅ QUALITY
  const qualityFailsWholefoods = [
    baxloRaw === "",
    mold === "",
    baxloClean === "FAIR:60-64",
    mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)"
  ];

  if (qualityFailsWholefoods.some(Boolean)) {
    console.log("❌ WHOLEFOODS QUALITY FAILED");
    set("qualityOrderStatus_{X}", failed);
  } else if (currentQuality !== failed) {
    console.log("✅ WHOLEFOODS QUALITY PASSED");
    set("qualityOrderStatus_{X}", "PASSED");
  }

  // ✅ PACKAGING
  const packagingFailsWholefoods = [
    boxesCondition === "NO" || boxesCondition === "",
    productSecured === "NO" || productSecured === ""
  ];

  if (packagingFailsWholefoods.some(Boolean)) {
    console.log("❌ WHOLEFOODS PACKAGING FAILED");
    set("packagingOrderStatus_{X}", failed);
  } else if (currentPackaging !== failed) {
    console.log("✅ WHOLEFOODS PACKAGING PASSED");
    set("packagingOrderStatus_{X}", "PASSED");
  }

  // ✅ LABEL
  const combinacionesValidasWholefoods = [
    "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
    "ALPINE FRESH - 12 X 18OZ",
    "ALPINE FRESH - 12 X 9.8OZ JUMBO",
    "ALPINE FRESH - 12 X PINT"
  ];

  const comboLabelPack = `${label} - ${packSize}`;
  const comboDirect = `${label} ${packSize}`;
  const labelValido = combinacionesValidasWholefoods.includes(comboLabelPack) || combinacionesValidasWholefoods.includes(comboDirect);

  if (!labelValido || label === "" || packSize === "") {
    console.log("❌ WHOLEFOODS LABEL FAILED");
    set("labelOrderStatus_{X}", failed);
  } else if (currentLabel !== failed) {
    console.log("✅ WHOLEFOODS LABEL PASSED");
    set("labelOrderStatus_{X}", "PASSED");
  }
}

////////// SPROUTS //////////
  if (headOffice === "SPROUTS") {
  console.log("✅ Entrando a condicionales SPROUTS");

  const baxloRaw = get("baxloReading_{X}").trim();
  const baxloClean = baxloRaw.toUpperCase().replace(/\s*:\s*/, ':').replaceAll(' ', '');
  const mold = get("moldDecay_{X}").trim().toUpperCase();
  const packSize = get("packSize_{X}").trim().toUpperCase();
  const label = get("label_{X}").trim().toUpperCase();
  const boxesCondition = get("boxesCondition_{X}").trim().toUpperCase();
  const productSecured = get("productSecured_{X}").trim().toUpperCase();

  const currentQuality = document.getElementById(`qualityStatus${palletIndex}`)?.textContent || "";
  const currentPackaging = document.getElementById(`packagingStatus${palletIndex}`)?.textContent || "";
  const currentLabel = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";

  // 🧪 DEBUG
  console.log("🔍 BAXLO RAW:", baxloRaw);
  console.log("🧪 BAXLO CLEAN:", baxloClean);
  console.log("🦠 MOLD:", mold);

  // ✅ QUALITY
  const qualityFailsSprouts = [
    baxloRaw === "",
    mold === "",
    baxloClean === "SENSITIVE:55-59",
    mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)"
  ];

  if (qualityFailsSprouts.some(Boolean)) {
    console.log("❌ SPROUTS QUALITY FAILED");
    set("qualityOrderStatus_{X}", failed);
  } else if (currentQuality !== failed) {
    console.log("✅ SPROUTS QUALITY PASSED");
    set("qualityOrderStatus_{X}", "PASSED");
  }

  // ✅ PACKAGING
  const packagingFailsSprouts = [
    boxesCondition === "" || boxesCondition === "NO",
    productSecured === "" || productSecured === "NO"
  ];

  if (packagingFailsSprouts.some(Boolean)) {
    console.log("❌ SPROUTS PACKAGING FAILED");
    set("packagingOrderStatus_{X}", failed);
  } else if (currentPackaging !== failed) {
    console.log("✅ SPROUTS PACKAGING PASSED");
    set("packagingOrderStatus_{X}", "PASSED");
  }

  // ✅ LABEL
  const labelFailsSprouts = [
    label === "",
    packSize === ""
  ];

  if (labelFailsSprouts.some(Boolean)) {
    console.log("❌ SPROUTS LABEL FAILED");
    set("labelOrderStatus_{X}", failed);
  } else if (currentLabel !== failed) {
    console.log("✅ SPROUTS LABEL PASSED");
    set("labelOrderStatus_{X}", "PASSED");
  }
}

////////// LIDL //////////
  if (headOffice === "LIDL") {
  console.log("✅ Entrando a condicionales LIDL");

  const variety = get("variety_{X}").trim().toUpperCase();
  const mold = get("moldDecay_{X}").trim().toUpperCase();
  const label = get("label_{X}").trim().toUpperCase();
  const packSize = get("packSize_{X}").trim().toUpperCase();
  const boxesCondition = get("boxesCondition_{X}").trim().toUpperCase();
  const productSecured = get("productSecured_{X}").trim().toUpperCase();

  const currentQuality = document.getElementById(`qualityStatus${palletIndex}`)?.textContent || "";
  const currentLabel = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";
  const currentPackaging = document.getElementById(`packagingStatus${palletIndex}`)?.textContent || "";

  // 🧪 DEBUG
  console.log("🫐 VARIETY:", variety);
  console.log("🦠 MOLD:", mold);
  console.log("🏷️ LABEL:", label);
  console.log("📦 PACK SIZE:", packSize);
  console.log("📦 BOXES CONDITION:", boxesCondition);
  console.log("🔐 PRODUCT SECURED:", productSecured);

  // ✅ QUALITY
  const qualityFailsLidl = [
    variety === "",
    mold === "",
    variety === "RABBIT EYE",
    mold === "PRESENT - MOLD/DECAY (LESS THAN 2%)"
  ];

  if (qualityFailsLidl.some(Boolean)) {
    console.log("❌ LIDL QUALITY FAILED");
    set("qualityOrderStatus_{X}", failed);
  } else if (currentQuality !== failed) {
    console.log("✅ LIDL QUALITY PASSED");
    set("qualityOrderStatus_{X}", "PASSED");
  }

  // ✅ LABEL
  const labelPack = `${label} - ${packSize}`;
  const combinacionesValidasLidl = [
    "PURCHASE - 12 X PINT (ORGANIC)",
    "PURCHASE - 12 X 18OZ",
    "PURCHASE - 12 X PINT",
    "PEAK HARVEST - 12 X PINT",
    "FRESH LABEL - 12 X PINT (ORGANIC)",
    "FRESH LABEL - 12 X 18OZ",
    "FRESH LABEL - 12 X PINT",
    "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
    "ALPINE FRESH - 12 X 18OZ",
    "ALPINE FRESH - 12 X PINT"
  ];

  const labelFailsLidl = [
    label === "",
    packSize === "",
    !combinacionesValidasLidl.includes(labelPack)
  ];

  if (labelFailsLidl.some(Boolean)) {
    console.log("❌ LIDL LABEL FAILED");
    set("labelOrderStatus_{X}", failed);
  } else if (currentLabel !== failed) {
    console.log("✅ LIDL LABEL PASSED");
    set("labelOrderStatus_{X}", "PASSED");
  }

  // ✅ PACKAGING
  const packagingFailsLidl = [
    boxesCondition === "" || boxesCondition === "NO",
    productSecured === "" || productSecured === "NO"
  ];

  if (packagingFailsLidl.some(Boolean)) {
    console.log("❌ LIDL PACKAGING FAILED");
    set("packagingOrderStatus_{X}", failed);
  } else if (currentPackaging !== failed) {
    console.log("✅ LIDL PACKAGING PASSED");
    set("packagingOrderStatus_{X}", "PASSED");
  }
}

// ✅ CONDICIONALES PERSONALIZADOS PARA WEGMANS
  if (headOffice === "WEGMANS") {
  const stems = get("stems_{X}");
  const mold = get("moldDecay_{X}");
  const baxlo = get("baxloReading_{X}");
  const variety = get("variety_{X}");
  const clamshellType = get("clamshellType_{X}");
  const label = get("label_{X}");
  const packSize = get("packSize_{X}");
  const customer = (localStorage.getItem("selectedCustomer") || "").toUpperCase();

  const labelClean = label.trim().toUpperCase();
  const packClean = packSize.trim().toUpperCase();

  // 🛑 Si hay campos vacíos en QUALITY → FAILED
  if ([stems, mold, baxlo, variety].some(val => val.trim() === "")) {
    set("qualityOrderStatus_{X}", failed);
  }

  // 🛑 Si hay campos vacíos en PACKAGING → FAILED
  const productSecured = get("productSecured_{X}");
  const boxesCondition = get("boxesCondition_{X}");
  if ([clamshellType, productSecured, boxesCondition].some(val => val.trim() === "")) {
    set("packagingOrderStatus_{X}", failed);
  }

  // 🛑 Si hay campos vacíos en LABEL → FAILED
  const country = get("country_{X}");
  const labelLanguage = get("labelLanguage_{X}");
  if ([label, packSize, country, labelLanguage].some(val => val.trim() === "")) {
    set("labelOrderStatus_{X}", failed);
  }

  // ✅ QUALITY CONDICIONES PERSONALIZADAS
  const qualityFails = [
    mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)",
    stems === "5% - 10%",
    baxlo === "SENSITIVE: 55 - 59",
    (customer === "WEGMANS FOOD MARKET HOME OFFICE" && baxlo === "FAIR : 60 - 64"),
    (labelClean === "ALPINE FRESH" && packClean === "12 X PINT" && variety.toUpperCase() !== "SEKOYA")
  ];

  if (qualityFails.some(Boolean)) {
    set("qualityOrderStatus_{X}", failed);
  }

  // ✅ PACKAGING CONDICIÓN
  if (clamshellType !== "FLAT") {
    set("packagingOrderStatus_{X}", failed);
  }

  // ✅ LABEL CONDICIONES VÁLIDAS
  const combinacionesValidas = [
    "ALPINE FRESH - 12 X 18OZ",
    "ALPINE FRESH - 12 X PINT",
    "HIPPIE ORGANICS - 12 X 18OZ (ORGANIC)",
    "HIPPIE ORGANICS - 12 X PINT (ORGANIC)"
  ];

  const combo = `${labelClean} - ${packClean}`;
  if (!combinacionesValidas.includes(combo)) {
    set("labelOrderStatus_{X}", failed);
  }
}


// ✅ CONDICIONALES PERSONALIZADOS PARA ALDI BATAVIA
  if (headOffice === "ALDI BATAVIA") {
  console.log("✅ Entrando a condicionales ALDI BATAVIA");

  const packSize = get("packSize_{X}").trim().toUpperCase();
  const clamshellType = get("clamshellType_{X}").trim().toUpperCase();
  const label = get("label_{X}").trim().toUpperCase();
  const mold = get("moldDecay_{X}").trim().toUpperCase();
  const stems = get("stems_{X}").trim().toUpperCase();
  const baxlo = get("baxloReading_{X}").trim().toUpperCase();
  const sizing = get("sizing_{X}").trim().toUpperCase();
  const variety = get("variety_{X}").trim().toUpperCase();
  const boxesCondition = get("boxesCondition_{X}").trim().toUpperCase();
  const productSecured = get("productSecured_{X}").trim().toUpperCase();
  const country = get("country_{X}").trim().toUpperCase();
  const labelLanguage = get("labelLanguage_{X}").trim().toUpperCase();

  const currentQuality = document.getElementById(`qualityStatus${palletIndex}`)?.textContent || "";
  const currentPackaging = document.getElementById(`packagingStatus${palletIndex}`)?.textContent || "";
  const currentLabel = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";

  // ✅ REGLA: si Pack Size = 12 X 9.8OZ JUMBO → Clamshell Type debe ser TOP SEAL
  if (packSize === "12 X 9.8OZ JUMBO" && clamshellType !== "TOP SEAL") {
    console.log("❌ ALDI BATAVIA - CLAMSHELL TYPE INCORRECTO");
    set("packagingOrderStatus_{X}", failed);
  }

  // ✅ FALLA POR CAMPOS VACÍOS EN QUALITY
  const qualityCamposVacios = [mold, stems, baxlo, sizing, variety].some(val => val === "");
  if (qualityCamposVacios) {
    console.log("❌ ALDI BATAVIA - QUALITY CAMPOS VACÍOS");
    set("qualityOrderStatus_{X}", failed);
  }

  // ✅ FALLA POR CAMPOS VACÍOS EN PACKAGING
  const packagingCamposVacios = [clamshellType, boxesCondition, productSecured].some(val => val === "");
  if (packagingCamposVacios) {
    console.log("❌ ALDI BATAVIA - PACKAGING CAMPOS VACÍOS");
    set("packagingOrderStatus_{X}", failed);
  }

  // ✅ FALLA POR CAMPOS VACÍOS EN LABEL
  const labelCamposVacios = [label, packSize, country, labelLanguage].some(val => val === "");
  if (labelCamposVacios) {
    console.log("❌ ALDI BATAVIA - LABEL CAMPOS VACÍOS");
    set("labelOrderStatus_{X}", failed);
  }
}




////////////PUBLIX LAKELAND....
if (headOffice === "PUBLIX LAKELAND") {
  const clamshellType = get("clamshellType_{X}");
  const variety = get("variety_{X}");
  const stems = get("stems_{X}");
  const mold = get("moldDecay_{X}");
  const baxlo = get("baxloReading_{X}");
  const country = get("country_{X}");
  const packSize = get("packSize_{X}");
  const label = get("label_{X}");
  const boxesCondition = get("boxesCondition_{X}");
  const productSecured = get("productSecured_{X}");

  const qualityFailsLakeland = [
    stems === "5% - 10%" || stems === "",
    mold === "PRESENT - MOLD / DECAY (LESS THAN 2%)" || mold === "",
    baxlo === "SENSITIVE : 55 - 59" || baxlo === "",
    variety === "RABBIT EYE" || variety === "",
    variety.toUpperCase() !== "SEKOYA" // solo para Lakeland
  ];

  if (qualityFailsLakeland.some(Boolean)) {
    set("qualityOrderStatus_{X}", failed);
  } else {
    set("qualityOrderStatus_{X}", "PASSED");
  }

  const packagingFailsLakeland = [
    boxesCondition === "NO" || boxesCondition === "",
    productSecured === "NO" || productSecured === "",
    clamshellType !== "FLAT" || clamshellType === ""
  ];

  if (packagingFailsLakeland.some(Boolean)) {
    set("packagingOrderStatus_{X}", failed);
  } else {
    set("packagingOrderStatus_{X}", "PASSED");
  }

  if (country === "ARGENTINA" || country === "") {
    set("labelOrderStatus_{X}", failed);
  } else {
    const combinacionesValidasLakeland = [
      { pack: "12 X 18OZ (ORGANIC)", label: "GREENWISE" },
      { pack: "12 X PINT (ORGANIC)", label: "HIPPIE ORGANICS" },
      { pack: "12 X PINT", label: "ALPINE FRESH" }
    ];

    const esValidaLakeland = combinacionesValidasLakeland.some(
      combo =>
        packSize.toUpperCase() === combo.pack.toUpperCase() &&
        label.toUpperCase() === combo.label.toUpperCase()
    );

    if (!esValidaLakeland) {
      set("labelOrderStatus_{X}", failed);
    } else {
      const currentLabelStatus = document.getElementById(`labelStatus${palletIndex}`)?.textContent || "";
      if (currentLabelStatus !== failed) {
        set("labelOrderStatus_{X}", "PASSED");
      }
    }
  }
}


}