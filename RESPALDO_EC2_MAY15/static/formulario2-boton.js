window.BASE_URL = window.BASE_URL || window.location.origin;


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
  const tags = {};
  const totalPallets = parseInt(localStorage.getItem('totalPallets'), 10);
  let duplicado = false;

  for (let i = 1; i <= totalPallets; i++) {
    const tag = document.querySelector(`[name="palletTag_${i}"]`)?.value.trim();
    if (tag) {
      if (tags[tag]) {
        console.warn(`❌ TAG duplicado: "${tag}" ya fue usado en Pallet ${tags[tag]} y ahora en Pallet ${i}`);
        duplicado = true;
      } else {
        tags[tag] = i;
      }
    }
  }

  return duplicado;
}

async function subirFotoFinal() {
  const totalPallets = parseInt(localStorage.getItem("totalPallets") || "0", 10);
  for (let i = 1; i <= totalPallets; i++) {
    const palletInput = document.querySelector(`[name="palletPhotoInput_${i}"]`);
    const labelInput = document.querySelector(`[name="labelPhotoInput_${i}"]`);
    const qualityInput = document.querySelector(`[name="qualityPhotoInput_${i}"]`);
    const tempInput = document.querySelector(`[name="tempPhotoInput_${i}"]`);

    const inputs = [palletInput, labelInput, qualityInput, tempInput];
    for (const input of inputs) {


      if (input && input.files.length > 0) {
  const originalFile = input.files[0];

  if (!input.getAttribute("data-uploaded-url")) {
    console.warn(`⚠️ ${input.name} no tiene data-uploaded-url, reintentando subida...`);

    try {
      const resizedBlob = await resizeImageToBlob(originalFile, 640, 480);
      const formData = new FormData();
      formData.append("photo", resizedBlob, originalFile.name);

      const response = await fetch(`${BASE_URL}/upload-photo`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!data.filename) throw new Error("No se recibió filename del backend");

      const fileUrl = `${window.location.origin}/uploads/${data.filename}`;
      input.setAttribute("data-uploaded-url", fileUrl);
      console.log(`📤 Foto subida exitosamente (${input.name}):`, data.filename);
    } catch (err) {
      console.error(`❌ Fallo subida final para ${input.name}:`, err);
    }
  } else {
    console.log(`✅ ${input.name} ya tiene data-uploaded-url asignado, no se repite subida.`);
  }
}

    }
  }
}


function registrarPalletsFallidos() {
  console.log("🚨 Ejecutando registrarPalletsFallidos()");
  const resumen = JSON.parse(localStorage.getItem('resumenFormulario') || '{}');
  const pallets = JSON.parse(localStorage.getItem('palletsFormulario') || '[]');

  const order = resumen.ORDERNUMBER || '';
  const customer = resumen.CUSTOMER || '';
  const fallidos = pallets
    .filter(p => p.TOTALSTATUS === "FAILED")
    .map(p => p.PALLETNUMBER);

  console.log("🔍 Intentando registrar pallets fallidos:");
  console.log("🧾 ORDER:", order);
  console.log("🏢 CUSTOMER:", customer);
  console.log("📦 PALLETS FALLIDOS:", fallidos);

  if (order && customer && fallidos.length > 0) {
    const fallidosConTags = fallidos.map(num => {
      const tag = localStorage.getItem(`palletTag_${num}`) || "";
      return { numero: num, tag };
    });
  
    console.log("📤 Enviando a /api/registrar-fallidos:", { order, customer, fallidos: fallidosConTags });
  
    fetch(`${BASE_URL}/api/registrar-fallidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order, customer, fallidos: fallidosConTags })
    })
  
      .then(res => res.json())
      .then(data => console.log("✅ Fallidos registrados con backend:", data))
      .catch(err => console.error("❌ Error registrando fallidos:", err));
  } else {
    console.warn("⚠️ No se registraron fallidos porque faltan datos o no hay pallets fallidos.");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const wizard = document.getElementById('form-wizard');
  const { totalCajas, totalPallets, promedio } = calcularPromedios();
  

  wizard.addEventListener("click", (e) => {
    const isNext = e.target.classList.contains("btn-next");
    if (!isNext) return;

    const currentPage = e.target.closest('.wizard-page');
    const palletBtn = currentPage.querySelector('.btn-evaluate');
    const palletIndex = palletBtn?.getAttribute('data-pallet');

    if (currentPage) {
      const camposRequeridos = currentPage.querySelectorAll('input[required], select[required], textarea[required]');
      for (const campo of camposRequeridos) {
        if (!campo.value || campo.value.trim() === "") {
          campo.classList.add('error-field');
          campo.focus();
          alert("Por favor completa todos los campos obligatorios antes de continuar.");
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
      }
    }

    if (hayTagsDuplicados()) {
      alert("Hay PALLET TAG duplicados. Por favor corrige antes de continuar.");
      return;
    }

    if (!palletIndex) return;

    evaluarCondicionesBase(palletIndex);
evaluarCondicionesCostco(palletIndex);

setTimeout(() => {
  actualizarColoresStatus(palletIndex);
  actualizarTotalStatus(palletIndex);
}, 10);


    if (!validarCajasPorPallet(palletIndex, promedio)) {
      return;
    }

    const totalStatus = document.getElementById(`totalStatus${palletIndex}`)?.textContent.trim() || "";
    const authBlock = document.getElementById(`authBlock_${palletIndex}`);
    if (authBlock) authBlock.style.display = totalStatus === "FAILED" ? "block" : "none";
    const authSelect = document.getElementById(`auth_${palletIndex}`);
    const authValue = authSelect?.value || "";
    const puedeContinuar = totalStatus === "PASSED" || (totalStatus === "FAILED" && authValue !== "");
    if (!puedeContinuar) return;

    const pages = document.querySelectorAll('.wizard-page');
    const currentIndex = [...pages].findIndex(p => p === currentPage);

    if (parseInt(palletIndex) === totalPallets) {
      if (!validarTotalCajas()) return;

      for (let i = 1; i <= totalPallets; i++) {
        evaluarCondicionesBase(i);
        evaluarCondicionesCostco(i);
        actualizarColoresStatus(i);
        actualizarTotalStatus(i);
      }

      calcularFinalOrderStatus();

      try {
        actualizarEstadoPacks();
        console.log("📦 Stock actualizado al finalizar último pallet.");
      } catch (err) {
        console.warn("⚠️ No se pudo actualizar stock al final:", err);
      }

      const jsonFinal = generarJSONInspeccion();
      localStorage.setItem('resumenFormulario', JSON.stringify(jsonFinal)); // 🔧 SOLUCIÓN
      localStorage.setItem('palletsFormulario', JSON.stringify(jsonFinal.PALLETS));
      enviarDatosABaseDeDatos(jsonFinal); // ✅ llama a la función de formulario2-db.js
      enviarCorreoResumen();
      enviarCorreoAlertaPalletsFailed();
      subirFotoFinal();
      registrarPalletsFallidos();
      
      localStorage.setItem("formularioTerminado", "true");


      const finalPage = document.querySelector(".wizard-page.final-page");
      if (finalPage) {
        pages[currentIndex].style.display = "none";
        finalPage.style.display = "block";
        
        finalPage.scrollIntoView({ behavior: "smooth", block: "start" });
      }

    } else {
      pages[currentIndex].style.display = 'none';
      if (window.updateWizardCurrent) window.updateWizardCurrent(+1);

      const nextPage = pages[currentIndex + 1];
      if (nextPage) {
        nextPage.style.display = 'block';
        nextPage.scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
          try {
            actualizarEstadoPacks();
            console.log("♻️ Selects actualizados tras mostrar el nuevo pallet.");
          } catch (err) {
            console.warn("No se pudo actualizar selects tras Next:", err);
          }
        }, 50);
      }
    }

    try {
      const cajasInput = document.querySelector(`[name="boxes_${palletIndex}"]`);
      const packSelect = document.querySelector(`.packsize-select[data-pallet="${palletIndex}"]`);
      if (cajasInput) cajasInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (packSelect) packSelect.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
      console.warn("❌ No se pudo actualizar stock o selects:", err);
    }
  });
});
