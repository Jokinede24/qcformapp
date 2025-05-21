// formulario2-pallets.js COMPLETO Y CORREGIDO

function generarHTMLPallet(i, selectedCustomer, selectedPackSizes, labelOptions, sizingOptions, baxloOptions, staticUPCs) {
  const resumen = JSON.parse(localStorage.getItem("resumenPorPack") || "{}");
  let varietyHTML = '';
  const packSize = selectedPackSizes[0];
  if (resumen[packSize]?.variety === "SEKOYA") {
    varietyHTML = `
      <label for="autoVariety_${i}">VARIETY (AUTO DETECTED)</label>
      <input type="text" id="autoVariety_${i}" value="SEKOYA" readonly style="background:#eef; font-weight:bold;" />
    `;
  }

  return `
    <h2>PALLET ${i}</h2>
    <div class="customer-display">CUSTOMER: <strong>${selectedCustomer}</strong></div>

   <label for="palletTag_${i}" class="required">ALPINE FRESH PALLET TAG # (PALLET ${i})</label>
    <input type="text" name="palletTag_${i}" id="palletTag_${i}" placeholder="" required>
   
    <label for="palletPhoto_${i}">PALLET TAG PHOTO (PALLET ${i})</label>
    <input type="file" id="palletPhotoInput_${i}" name="palletPhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'pallet')">
    <button 
      type="button" 
      class="photo-button" 
      onclick="setTimeout(() => {
        const input = document.getElementById('palletPhotoInput_${i}');
        if (input) input.click();
        else console.warn('📸 palletPhotoInput no está listo aún');
      }, 150);"
    >📷 Take Photo</button>
    <div id="palletPreview_${i}" class="photo-preview"></div>


    <label for="boxes_${i}" class="required">NUMBER OF BOXES (PALLET ${i})</label>
    <input type="number" name="boxes_${i}" id="boxes_${i}" min="0" placeholder="Enter number of boxes" required>

    <h2 class="section-header">🏷️ LABEL - PALLET ${i}</h2>

    <label class="required">PACK SIZE (PALLET ${i})</label>
    <select class="packsize-select" data-section="label" data-pallet="${i}" name="packSize_${i}" required>
      <option value="">Please Select</option>
      ${selectedPackSizes.map(p => `<option value="${p}">${p}</option>`).join('')}
    </select>

    <label class="required">LABEL (PALLET ${i})</label>
    <select class="label-select" data-section="label" data-pallet="${i}" name="label_${i}">
      <option value="">Please Select</option>
      ${labelOptions.map(l => `<option value="${l}">${l}</option>`).join('')}
    </select>

    <label for="labelPhotoInput_${i}">LABEL PHOTO (PALLET ${i})</label>
    <input type="file" id="labelPhotoInput_${i}" name="labelPhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'label')">
    <button type="button" class="photo-button" onclick="document.getElementById('labelPhotoInput_${i}').click()">📷 Take Label Photo</button>
    <div id="labelPreview_${i}" class="photo-preview"></div>

    <label class="required">UPC (PALLET ${i})</label>
    <select class="upc-select search-upc" data-section="label" data-pallet="${i}" name="upc_${i}">
      <option value="">Please Select</option>
      ${staticUPCs.map(upc => `<option value="${upc}">${upc}</option>`).join('')}
    </select>

    <label class="required">COUNTRY OF ORIGIN (PALLET ${i})</label>
    <select name="country_${i}" data-section="label" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="MEXICO">MEXICO</option>
      <option value="PERU">PERU</option>
      <option value="CHILE">CHILE</option>
      <option value="ARGENTINA">ARGENTINA</option>
      <option value="USA">USA</option>
      <option value="CANADA">CANADA</option>
    </select>

    <label class="required">LABEL LANGUAGE (PALLET ${i})</label>
    <select name="labelLanguage_${i}" data-section="label" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="ENGLISH">ENGLISH</option>
      <option value="BI-LINGUAL">BI-LINGUAL</option>
    </select>

    <label class="required">CLAMSHELL WEIGHT MATCHES LABEL WEIGHT (PALLET ${i})</label>
    <select name="clamshellMatchesLabel_${i}" data-section="label" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>

  <h2 class="section-header">📦 PACKAGING - PALLET ${i}</h2>

    <label for="palletType${i}">PALLET TYPE (PALLET ${i})</label>
    <select id="palletType${i}" name="palletType_${i}" data-section="packaging" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="CHEP">CHEP</option>
      <option value="GRADE A">GRADE A</option>
    </select>

    <label for="boxCondition${i}">BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET ${i})</label>
    <select id="boxCondition${i}" name="boxesCondition_${i}" data-section="packaging" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>

    <label for="productSecured${i}">PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS "PACKED ON' FOR DATE</label>
    <select id="productSecured${i}" name="productSecured_${i}" data-section="packaging" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="YES">YES</option>
      <option value="NO">NO</option>
    </select>

    <label for="clamshellType${i}">CLAMSHELL TYPE (PALLET ${i})</label>
    <select id="clamshellType${i}" name="clamshellType_${i}" data-section="packaging" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="FLAT">FLAT</option>
      <option value="TOP SEAL">TOP SEAL</option>
      <option value="BRICK">BRICK</option>
      <option value="BULK">BULK</option>
    </select>

    <label for="closureType${i}">CLOSURE TYPE (PALLET ${i})</label>
    <select id="closureType${i}" name="closureType_${i}" data-section="packaging" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="TAPE, SECURED CORRECTLY">TAPE, SECURED CORRECTLY</option>
      <option value="OTHER">OTHER</option>
    </select>





    <h2 class="section-header">🍓 QUALITY - PALLET ${i}</h2>
    <label for="variety${i}">VARIETY (PALLET ${i})</label>
    <select id="variety${i}" name="variety_${i}" data-section="quality" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="NONE">NONE</option>
      <option value="SEKOYA">SEKOYA</option>
      <option value="RABBIT EYE">RABBIT EYE</option>
    </select>


    <label for="appearance${i}">FRUIT APPEARANCE (PALLET ${i})</label>
    <select id="appearance${i}" name="fruitAppearance_${i}" data-section="quality" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="GOOD">GOOD</option>
      <option value="WET">WET</option>
    </select>
    <div id="appearancePhotoBlock_${i}" style="display: none;">
      <label for="appearancePhotoInput_${i}">APPEARANCE PHOTO (PALLET ${i})</label>
      <input type="file" id="appearancePhotoInput_${i}" name="appearancePhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'appearance')">
      <button type="button" class="photo-button" onclick="document.getElementById('appearancePhotoInput_${i}').click()">📷 Take Appearance Photo</button>
      <div id="appearancePreview_${i}" class="photo-preview"></div>
    </div>

    <label for="sizing${i}">SIZING (PALLET ${i})</label>
    <select id="sizing${i}" name="sizing_${i}" data-section="quality" data-pallet="${i}">
      <option value="">Please Select</option>
      ${sizingOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
    </select>
    <div id="sizingPhotoBlock_${i}" style="display: none;">
      <label for="sizingPhotoInput_${i}">SIZING PHOTO (PALLET ${i})</label>
     <input type="file" id="sizingPhotoInput_${i}" name="sizingPhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'sizing')">
      <button type="button" class="photo-button" onclick="document.getElementById('sizingPhotoInput_${i}').click()">📷 Take Sizing Photo</button>
      <div id="sizingPreview_${i}" class="photo-preview"></div>
    </div>

    <label for="stems${i}">STEMS (PALLET ${i})</label>
    <select id="stems${i}" name="stems_${i}" data-section="quality" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="NONE">NONE</option>
      <option value="LESS THAN 5%">LESS THAN 5%</option>
      <option value="5% - 10%">5% - 10%</option>
      <option value="MORE THAN 10%">MORE THAN 10%</option>
    </select>
    <div id="stemsPhotoBlock_${i}" style="display: none;">
      <label for="stemsPhotoInput_${i}">STEMS PHOTO (PALLET ${i})</label>
     <input type="file" id="stemsPhotoInput_${i}" name="stemsPhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'stems')">
      <button type="button" class="photo-button" onclick="document.getElementById('stemsPhotoInput_${i}').click()">📷 Take Stems Photo</button>
      <div id="stemsPreview_${i}" class="photo-preview"></div>
    </div>

    <label for="moldDecay${i}">MOLD / DECAY (PALLET ${i})</label>
    <select id="moldDecay${i}" name="moldDecay_${i}" data-section="quality" data-pallet="${i}">
      <option value="">Please Select</option>
      <option value="NONE - NO MOLD OR DECAY SIGHTED (0%)">NONE - NO MOLD OR DECAY SIGHTED (0%)</option>
      <option value="SPOT - MOLD/DECAY (LESS THAN 1%)">SPOT - MOLD/DECAY (LESS THAN 1%)</option>
      <option value="PRESENT - MOLD/DECAY (LESS THAN 2%)">PRESENT - MOLD/DECAY (LESS THAN 2%)</option>
      <option value="ISSUES - MOLD / DECAY (MORE THAN 2%)">ISSUES - MOLD / DECAY (MORE THAN 2%)</option>
    </select>
    <div id="moldPhotoBlock_${i}" style="display: none;">
      <label for="moldPhotoInput_${i}">MOLD / DECAY PHOTO (PALLET ${i})</label>
      <input type="file" id="moldPhotoInput_${i}" name="moldPhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'mold')">
      <button type="button" class="photo-button" onclick="document.getElementById('moldPhotoInput_${i}').click()">📷 Take Mold/Decay Photo</button>
      <div id="moldPreview_${i}" class="photo-preview"></div>
    </div>


    <label for="baxlo${i}">BAXLO READING (PALLET ${i})</label>
    <select id="baxlo${i}" name="baxloReading_${i}" data-section="quality" data-pallet="${i}">
      <option value="">Please Select</option>
      ${baxloOptions.map(b => `<option value="${b}">${b}</option>`).join('')}
    </select>

    <label for="qualityPhotoInput_${i}">QUALITY PHOTO (PALLET ${i})</label>
    <input type="file" id="qualityPhotoInput_${i}" name="qualityPhotoInput_${i}" accept="image/*" style="display: none;" onchange="previewPhoto(event, ${i}, 'quality')">
    <button type="button" class="photo-button" onclick="document.getElementById('qualityPhotoInput_${i}').click()">📷 Take Quality Photo</button>
    <div id="qualityPreview_${i}" class="photo-preview"></div>

  <!-- TEMP PHOTO -->
<div class="photo-block" id="tempPhotoBlock_${i}" style="display:block">
  <label for="tempPhotoInput_${i}">🌡️ TEMPERATURE PHOTO</label>
  <button type="button" class="custom-photo-button" onclick="document.getElementById('tempPhotoInput_${i}').click()">📷 Take TEMPERATURE PHOTO</button>
  <input type="file" name="tempPhotoInput_${i}" id="tempPhotoInput_${i}" accept="image/*" style="display:none" onchange="previewPhoto(event, ${i}, 'temp')" data-section="quality" data-pallet="${i}">
  <div id="tempPreview_${i}" class="preview-container"></div>
</div>





    <h2 class="section-header">✅ INSPECTION SUMMARY - PALLET ${i}</h2>
    <div class="inspection-summary">
      <div class="status-block">LABEL PALLET STATUS (PALLET ${i}): <span id="labelStatus${i}" class="status-field"></span></div>
      <div class="status-block">PACKAGING PALLET STATUS (PALLET ${i}): <span id="packagingStatus${i}" class="status-field"></span></div>
      <div class="status-block">QUALITY PALLET STATUS (PALLET ${i}): <span id="qualityStatus${i}" class="status-field"></span></div>
      <div class="status-block">PALLET ORDER STATUS (PALLET ${i}): <span id="totalStatus${i}" class="status-field"></span></div>
      <div class="auth-block" id="authBlock_${i}" style="display: none;">
        <label for="auth_${i}" class="required">SEND AUTHORIZATION REQUEST TO: (PALLET ${i})</label>
        <select name="auth_${i}" id="auth_${i}">
          <option value="">Please Select</option>
          <option>RANDY SOLAR</option>
          <option>AUSTIN YAGER</option>
          <option>KARLA CABRERA</option>
        </select>
      </div>
      <button type="button" class="btn-evaluate" data-pallet="${i}" style="display: none;">Evaluar Pallet ${i}</button>
    </div>
    <div class="buttons">
      <button type="button" class="btn-back">Back</button>
      <button type="button" class="btn-next">Next</button>
    </div>
  `;
}
