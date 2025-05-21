function detectarErroresPorCliente(pallet, get, headOffice) {
    const errores = [];
    const clean = (v) => (v || '').trim().toUpperCase();
  
    const label = clean(get("label"));
    const packSize = clean(get("packSize"));
    const variety = clean(get("variety"));
    const country = clean(get("country"));
    const baxlo = clean(get("baxloReading"));
    const mold = clean(get("moldDecay"));
    const stems = clean(get("stems"));
    const sizing = clean(get("sizing"));
    const clamshell = clean(get("clamshellType"));
    const labelLang = clean(get("labelLanguage"));
    const palletType = clean(get("palletType"));
    const closure = clean(get("closureType"));
    const boxes = clean(get("boxesCondition"));
    const pti = clean(get("productSecured"));
    const customer = (localStorage.getItem("selectedCustomer") || "").toUpperCase();
    const upc = clean(get("upc"));
const upcsValidos =
  window.upcsData?.[headOffice]?.[label]?.[packSize] ||
  window.upcsData?.["OTHERS"]?.[label]?.[packSize] || [];

if (upc && !upcsValidos.includes(upc)) {
  errores.push(`UPC (PALLET ${pallet})`);
}


  
    const combo = `${label} - ${packSize}`;
    console.log(`🧪 [${headOffice}] PALLET ${pallet} → Combo: ${combo}`);
  
    // COSTCO
    if (headOffice.includes("COSTCO")) {
      if (palletType !== "CHEP") errores.push(`PALLET TYPE (PALLET ${pallet})`);
      if (clamshell !== "FLAT") errores.push(`CLAMSHELL TYPE (PALLET ${pallet})`);
      if (closure !== "TAPE, SECURED CORRECTLY") errores.push(`CLOSURE TYPE (PALLET ${pallet})`);
      if (variety === "RABBIT EYE") errores.push(`VARIETY (PALLET ${pallet})`);
      if (["5% - 10%", "MORE THAN 10%"].includes(stems)) errores.push(`STEMS (PALLET ${pallet})`);
      if (!["FIRM : 65 - 71", "CRUNCHY : >72"].includes(baxlo)) errores.push(`BAXLO READING (PALLET ${pallet})`);
      if (mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
  
      if (headOffice === "COSTCO CANADA") {
        if (labelLang !== "BI-LINGUAL") errores.push(`LABEL LANGUAGE (PALLET ${pallet})`);
        if (!["MEXICO", "PERU"].includes(country)) errores.push(`COUNTRY (PALLET ${pallet})`);
        const validCombos = [
          "HIPPIE ORGANICS - 12 X 18OZ (ORGANIC)",
          "HIPPIE ORGANICS - 8 X 18 OZ (ORGANIC)",
          "ALPINE FRESH - 8 X 18OZ",
          "ALPINE FRESH - 12 X 18OZ"
        ];
        if (!validCombos.includes(combo)) {
          errores.push(`LABEL (PALLET ${pallet})`);
          errores.push(`PACK SIZE (PALLET ${pallet})`);
        }
      } else {
        const validPack = ["12 X 18OZ", "12 X 18OZ (ORGANIC)"];
        if (country === "ARGENTINA") errores.push(`COUNTRY (PALLET ${pallet})`);
        if (!validPack.includes(packSize)) errores.push(`PACK SIZE (PALLET ${pallet})`);
        if (
          (packSize === "12 X 18OZ" && label !== "ALPINE FRESH") ||
          (packSize === "12 X 18OZ (ORGANIC)" && label !== "HIPPIE ORGANICS")
        ) {
          errores.push(`LABEL (PALLET ${pallet})`);
          errores.push(`PACK SIZE (PALLET ${pallet})`);
        }
      }
    }
  
    // PUBLIX
    if (headOffice === "PUBLIX") {
      if (stems === "5% - 10%") errores.push(`STEMS (PALLET ${pallet})`);
      if (mold === "PRESENT - MOLD / DECAY (LESS THAN 2%)") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
      if (baxlo === "SENSITIVE : 55 - 59") errores.push(`BAXLO READING (PALLET ${pallet})`);
      if (variety === "RABBIT EYE") errores.push(`VARIETY (PALLET ${pallet})`);
      if (clamshell !== "FLAT") errores.push(`CLAMSHELL TYPE (PALLET ${pallet})`);
      if (country === "ARGENTINA") errores.push(`COUNTRY (PALLET ${pallet})`);
      const validCombos = [
        "GREENWISE - 12 X 18OZ (ORGANIC)",
        "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
        "ALPINE FRESH - 12 X PINT"
      ];
      if (!validCombos.includes(combo)) {
        errores.push(`LABEL (PALLET ${pallet})`);
        errores.push(`PACK SIZE (PALLET ${pallet})`);
      }
    }
  
    // PUBLIX LAKELAND
    if (headOffice === "PUBLIX LAKELAND") {
      if (stems === "5% - 10%") errores.push(`STEMS (PALLET ${pallet})`);
      if (mold === "PRESENT - MOLD / DECAY (LESS THAN 2%)") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
      if (baxlo === "SENSITIVE : 55 - 59") errores.push(`BAXLO READING (PALLET ${pallet})`);
      if (variety === "RABBIT EYE" || variety !== "SEKOYA") errores.push(`VARIETY (PALLET ${pallet})`);
      if (clamshell !== "FLAT") errores.push(`CLAMSHELL TYPE (PALLET ${pallet})`);
      if (country === "ARGENTINA") errores.push(`COUNTRY (PALLET ${pallet})`);
      const validCombos = [
        "GREENWISE - 12 X 18OZ (ORGANIC)",
        "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
        "ALPINE FRESH - 12 X PINT"
      ];
      if (!validCombos.includes(combo)) {
        errores.push(`LABEL (PALLET ${pallet})`);
        errores.push(`PACK SIZE (PALLET ${pallet})`);
      }
    }
  
    // SAFEWAY
    if (headOffice === "SAFEWAY") {
      if (baxlo === "SENSITIVE:55-59") errores.push(`BAXLO READING (PALLET ${pallet})`);
      const valid = [
        "ALPINE FRESH - 12 X 9.8OZ JUMBO",
        "SIGNATURE FARMS - 12 X PINT (ORGANIC)",
        "SIGNATURE FARMS - 12 X 6OZ (ORGANIC)",
        "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
        "HIPPIE ORGANICS - 12 X 18OZ (ORGANIC)",
        "HIPPIE ORGANICS - 12 X 6OZ (ORGANIC)",
        "SIGNATURE FARMS - 8 X 18OZ",
        "ALPINE FRESH - 12 X 18OZ",
        "ALPINE FRESH - 8 X 18OZ",
        "ALPINE FRESH - 12 X 6OZ"
      ];
      if (!valid.includes(combo)) {
        errores.push(`LABEL (PALLET ${pallet})`);
        errores.push(`PACK SIZE (PALLET ${pallet})`);
      }
    }
  
    // WHOLEFOODS
    if (headOffice === "WHOLEFOODS") {
      if (baxlo === "FAIR:60-64") errores.push(`BAXLO READING (PALLET ${pallet})`);
      if (mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
      if (pti === "NO") errores.push(`PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS "PACKED ON' FOR DATE`);
      if (boxes === "NO") errores.push(`BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET ${pallet})`);
      const valid = [
        "HIPPIE ORGANIC - 12 X PINT (ORGANIC)",
        "ALPINE FRESH - 12 X 18OZ",
        "ALPINE FRESH - 12 X 9.8OZ JUMBO",
        "ALPINE FRESH - 12 X PINT"
      ];
      if (!valid.includes(combo)) {
        errores.push(`LABEL (PALLET ${pallet})`);
        errores.push(`PACK SIZE (PALLET ${pallet})`);
      }
    }
  
      // HEB
  if (headOffice === "HEB") {
    const comboLabelPack = `${label} - ${packSize}`;
    const validCombos = [
      "FRESH LABEL - 12 X PINT",
      "FRESH LABEL - 8 X 18OZ",
      "FRESH LABEL 12 X 9.8OZ JUMBO",
      "FRESH LABEL - 12 X PINT (ORGANIC)",
      "FRESH LABEL - 8 X 18OZ (ORGANIC)",
      "HIPPIE ORGANICS - 12 X PINT (ORGANIC)",
      "HIPPIE ORGANICS - 8 X 18OZ (ORGANIC)",
      "HIPPIE ORGANIC - 12 X 18OZ (ORGANIC)"
    ];

    if (["5% - 10%", ""].includes(stems)) errores.push(`STEMS (PALLET ${pallet})`);
    if (["PRESENT - MOLD/DECAY (LESS THAN 2%)", ""].includes(mold)) errores.push(`MOLD / DECAY (PALLET ${pallet})`);
    if (["SENSITIVE : 55 - 59", ""].includes(baxlo)) errores.push(`BAXLO READING (PALLET ${pallet})`);
    if (packSize === "FRESH LABEL 12 X 9.8OZ JUMBO" && sizing !== "21+") errores.push(`SIZING (PALLET ${pallet})`);

    if (pti === "NO" || pti === "") errores.push(`PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS "PACKED ON' FOR DATE`);
    if (boxes === "NO" || boxes === "") errores.push(`BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET ${pallet})`);

    if (!validCombos.includes(comboLabelPack) && comboLabelPack !== "") {
      errores.push(`LABEL (PALLET ${pallet})`);
      errores.push(`PACK SIZE (PALLET ${pallet})`);
    }
  }

  // SPROUTS
  if (headOffice === "SPROUTS") {
    if (["SENSITIVE:55-59", ""].includes(baxlo)) errores.push(`BAXLO READING (PALLET ${pallet})`);
    if (mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)" || mold === "") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
    if (pti === "NO" || pti === "") errores.push(`PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS "PACKED ON' FOR DATE`);
    if (boxes === "NO" || boxes === "") errores.push(`BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET ${pallet})`);
    if (label === "" || packSize === "") {
      errores.push(`LABEL (PALLET ${pallet})`);
      errores.push(`PACK SIZE (PALLET ${pallet})`);
    }
  }

  // LIDL
  if (headOffice === "LIDL") {
    const validCombos = [
      "PURCHASE - 12 X PINT (ORGANIC)",
      "PURCHASE - 12 X 18OZ",
      "PURCHASE - 12 X PINT",
      "PEAK HARDVEST - 12 X PINT",
      "FRESH LABEL - 12 X PINT (ORGANIC)",
      "FRESH LABEL - 12 X 18OZ",
      "FRESH LABEL - 12 X PINT",
      "HIPPIE ORGANIC - 12 X PINT (ORGANIC)",
      "ALPINE FRESH - 12 X 18OZ",
      "ALPINE FRESH - 12 X PINT"
    ];

    if (["RABBIT EYE", ""].includes(variety)) errores.push(`VARIETY (PALLET ${pallet})`);
    if (["PRESENT - MOLD/DECAY (LESS THAN 2%)", ""].includes(mold)) errores.push(`MOLD / DECAY (PALLET ${pallet})`);
    if (!validCombos.includes(combo) || label === "" || packSize === "") {
      errores.push(`LABEL (PALLET ${pallet})`);
      errores.push(`PACK SIZE (PALLET ${pallet})`);
    }
    if (pti === "NO" || pti === "") errores.push(`PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS "PACKED ON' FOR DATE`);
    if (boxes === "NO" || boxes === "") errores.push(`BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET ${pallet})`);
  }

  // WEGMANS
  if (headOffice === "WEGMANS") {
    const validCombos = [
      "ALPINE FRESH - 12 X 18OZ",
      "ALPINE FRESH - 12 X PINT",
      "HIPPIE ORGANICS - 12 X 18OZ (ORGANIC)",
      "HIPPIE ORGANICS - 12 X PINT (ORGANIC)"
    ];

    if (["", "5% - 10%"].includes(stems)) errores.push(`STEMS (PALLET ${pallet})`);
    if (mold !== "NONE - NO MOLD OR DECAY SIGHTED (0%)" || mold === "") errores.push(`MOLD / DECAY (PALLET ${pallet})`);
    if (baxlo === "SENSITIVE: 55 - 59" || baxlo === "") errores.push(`BAXLO READING (PALLET ${pallet})`);
    if (customer === "WEGMANS FOOD MARKET HOME OFFICE" && baxlo === "FAIR : 60 - 64") errores.push(`BAXLO READING (PALLET ${pallet})`);
    if (label === "ALPINE FRESH" && packSize === "12 X PINT" && variety !== "SEKOYA") errores.push(`VARIETY (PALLET ${pallet})`);
    if (clamshell !== "FLAT") errores.push(`CLAMSHELL TYPE (PALLET ${pallet})`);
    if (!validCombos.includes(combo)) {
      errores.push(`LABEL (PALLET ${pallet})`);
      errores.push(`PACK SIZE (PALLET ${pallet})`);
    }
  }

  // ALDI BATAVIA
  if (headOffice === "ALDI BATAVIA") {
    if (packSize === "12 X 9.8OZ JUMBO" && clamshell !== "TOP SEAL") {
      errores.push(`CLAMSHELL TYPE (PALLET ${pallet})`);
    }
    if ([mold, stems, baxlo, sizing, variety].some(f => f === "")) {
      errores.push(`QUALITY (PALLET ${pallet}) - MISSING FIELD`);
    }
    if ([clamshell, boxes, pti].some(f => f === "" || f === "NO")) {
      errores.push(`PACKAGING (PALLET ${pallet}) - INVALID FIELD`);
    }
    if ([label, packSize, country, labelLang].some(f => f === "")) {
      errores.push(`LABEL (PALLET ${pallet}) - MISSING FIELD`);
    }
  }

  return errores;
}

function getSectionFields(pallet, section) {
  const fields = {};
  const sectionFields = document.querySelectorAll(`[data-section="${section}"][data-pallet="${pallet}"]`);

  const nameMap = {
    [`label_${pallet}`]: "LABEL",
    [`packSize_${pallet}`]: "PACK SIZE",
    [`upc_${pallet}`]: "UPC",
    [`country_${pallet}`]: "COUNTRY",
    [`labelLanguage_${pallet}`]: "LABEL LANGUAGE",
    [`clamshellMatchesLabel_${pallet}`]: "CLAMSHELL WEIGHT MATCHES LABEL WEIGHT",
    [`palletType_${pallet}`]: "PALLET TYPE",
    [`boxesCondition_${pallet}`]: "BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION",
    [`productSecured_${pallet}`]: "PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS \"PACKED ON' FOR DATE",
    [`clamshellType_${pallet}`]: "CLAMSHELL TYPE",
    [`closureType_${pallet}`]: "CLOSURE TYPE",
    [`variety_${pallet}`]: "VARIETY",
    [`fruitAppearance_${pallet}`]: "FRUIT APPEARANCE",
    [`sizing_${pallet}`]: "SIZING",
    [`stems_${pallet}`]: "STEMS",
    [`moldDecay_${pallet}`]: "MOLD / DECAY",
    [`baxloReading_${pallet}`]: "BAXLO READING"
  };

  sectionFields.forEach(field => {
    let labelEl = field.closest("label") || document.querySelector(`label[for="${field.id}"]`);
    let labelText = labelEl?.textContent?.trim();
    if (!labelText) {
      labelText = nameMap[field.name] || field.name.toUpperCase();
    }
    const key = `${labelText.toUpperCase()} (PALLET ${pallet})`;
    fields[key] = field.value || "";
  });

  return fields;
}
