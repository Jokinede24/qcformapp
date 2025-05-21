async function previewPhoto(event, index, tipo = 'pallet') {
  console.log(`📸 previewPhoto ejecutado - tipo: ${tipo}, index: ${index}`);
  enviarLogServidor(`📸 previewPhoto ejecutado - tipo: ${tipo}, index: ${index}`);

  const file = event.target.files[0];
  console.log("📥 Archivo recibido:", file);
  enviarLogServidor(`📥 Archivo recibido: ${file?.name || 'VACÍO'}`);

  if (!file) {
    alert(`❌ No se recibió archivo en ${tipo} (Pallet ${index})`);
    enviarLogServidor(`❌ No se recibió archivo en ${tipo} (Pallet ${index})`);
    return;
  }

  if (!(file instanceof File)) {
    alert(`❌ El archivo de ${tipo} NO es un File válido (Pallet ${index})`);
    enviarLogServidor(`❌ Archivo no es File válido en ${tipo}`);
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert(`⚠️ El archivo seleccionado no es una imagen: ${file.type}`);
    enviarLogServidor(`⚠️ Tipo de archivo no válido: ${file.type}`);
  }

  let previewId = '';
  let localKey = '';
  let inputId = '';

  switch (tipo) {
    case 'label':
      previewId = `labelPreview_${index}`;
      localKey = `labelPhoto_${index}`;
      inputId = `labelPhotoInput_${index}`;
      break;
    case 'quality':
      previewId = `qualityPreview_${index}`;
      localKey = `qualityPhoto_${index}`;
      inputId = `qualityPhotoInput_${index}`;
      break;
        case 'temp':   // ✔️ UNIFICADO CON EL RESTO DEL SISTEMA
      previewId = `tempPreview_${index}`;
      localKey = `tempPhoto_${index}`;
      inputId = `tempPhotoInput_${index}`;
      break;

        case 'appe':
      previewId = `appePreview_${index}`;
      localKey = `appePhoto_${index}`;
      inputId = `appePhotoInput_${index}`;
      break;

    case 'sizing':
      previewId = `sizingPreview_${index}`;
      localKey = `sizingPhoto_${index}`;
      inputId = `sizingPhotoInput_${index}`;
      break;
    case 'stems':
      previewId = `stemsPreview_${index}`;
      localKey = `stemsPhoto_${index}`;
      inputId = `stemsPhotoInput_${index}`;
      break;
    case 'mold':
      previewId = `moldPreview_${index}`;
      localKey = `moldPhoto_${index}`;
      inputId = `moldPhotoInput_${index}`;
      break;
    default:
      previewId = `palletPreview_${index}`;
      localKey = `palletPhoto_${index}`;
      inputId = `palletPhotoInput_${index}`;
  }

  let previewContainer = document.getElementById(previewId);
  if (!previewContainer) {
    previewContainer = document.createElement("div");
    previewContainer.id = previewId;
    previewContainer.className = "photo-preview";
    const inputEl = document.getElementById(inputId);
    if (inputEl) inputEl.insertAdjacentElement("afterend", previewContainer);
    else {
      console.warn(`⚠️ No se pudo crear el contenedor para ${tipo} pallet ${index}`);
      enviarLogServidor(`⚠️ Contenedor ausente para ${tipo}`);
      return;
    }
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = async function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const maxWidth = 320;
      const maxHeight = 240;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      } else if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
      previewContainer.innerHTML = `
        <img src="${resizedDataUrl}" 
             alt="Preview for Pallet ${index}" 
             style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 4px;" />
      `;

      localStorage.setItem(localKey, resizedDataUrl);
      console.log(`🖼️ Foto ${tipo} redimensionada y guardada para pallet ${index}`);
      enviarLogServidor(`🖼️ Foto ${tipo} redimensionada y guardada`);

      try {
        const url = await subirFoto(file);
        const input = document.getElementById(inputId);

        console.log(`📤 Intentando asignar URL a ${tipo} (Pallet ${index})`);
        enviarLogServidor(`📤 Intentando asignar URL a ${tipo}`);

        if (url && input) {
          input.setAttribute("data-uploaded-url", url);
          console.log(`✅ URL asignada a ${inputId}: ${url}`);
          enviarLogServidor(`✅ URL asignada a ${inputId}`);
        } else {
          console.warn(`⚠️ Falló asignación. URL: ${url}, input:`, input);
          enviarLogServidor(`⚠️ Falló asignación de URL para ${tipo}`);
        }
      } catch (error) {
        console.error(`❌ Error al subir la foto de tipo ${tipo}:`, error);
        enviarLogServidor(`❌ Error al subir foto de ${tipo}`);
      }
    };

    img.src = e.target.result;
  };

  try {
    reader.readAsDataURL(file);
  } catch (err) {
    console.error("❌ Error con FileReader:", err);
    alert("❌ Error al leer la imagen");
    enviarLogServidor("❌ Error con FileReader");
  }
}

async function subirFoto(file) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("photo", file);

  try {
    const response = await fetch("/upload-photo", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    const url = `${window.location.origin}/uploads/${result.filename}`;
    return url;
  } catch (error) {
    console.error("❌ Error subiendo foto:", error);
    enviarLogServidor("❌ Error subiendo foto");
    return null;
  }
}

async function urlToFile(dataUrl, filename) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

function restaurarFotosDesdeLocalStorage(index) {
 const tipos = ['label', 'quality', 'appearance', 'sizing', 'stems', 'mold', 'pallet', 'temp'];


  tipos.forEach(async tipo => {
    const localKey = `${tipo}Photo_${index}`;
    const dataUrl = localStorage.getItem(localKey);
    const previewId = `${tipo}Preview_${index}`;
    const inputId = `${tipo}PhotoInput_${index}`;
    let container = document.getElementById(previewId);
    const input = document.getElementById(inputId);

    if (!container && dataUrl) {
      const wrapper = document.createElement("div");
      wrapper.id = `${tipo}Wrapper_${index}`;
      wrapper.innerHTML = `
        <label for="${inputId}">${tipo.toUpperCase()} PHOTO (PALLET ${index})</label>
        <button type="button" class="custom-photo-button" onclick="document.getElementById('${inputId}').click()">
          📷 Take ${tipo.toUpperCase()} PHOTO
        </button>
        <input type="file" name="${inputId}" id="${inputId}" accept="image/*" style="display:none" onchange="previewPhoto(event, ${index}, '${tipo}')">
        <div id="${previewId}" class="preview-container"></div>
      `;
      const anchor = document.querySelector(`[name="${tipo}_${index}"]`);
      if (anchor) anchor.insertAdjacentElement("afterend", wrapper);
      container = document.getElementById(previewId);
    }

    if (dataUrl && container) {
      container.innerHTML = `
        <img src="${dataUrl}" 
             alt="Saved ${tipo} preview for Pallet ${index}" 
             style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 4px;" />
      `;
      console.log(`♻️ Foto restaurada (${tipo}) para pallet ${index}`);

      if (input && dataUrl.startsWith("data:")) {
        const file = await urlToFile(dataUrl, `restored_${tipo}_${index}.jpg`);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
      }
    }
  });
}

function enviarLogServidor(mensaje) {
  fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensaje, fecha: new Date().toISOString() })
  }).catch(err => console.warn("⚠️ No se pudo enviar log al servidor:", err));
}
