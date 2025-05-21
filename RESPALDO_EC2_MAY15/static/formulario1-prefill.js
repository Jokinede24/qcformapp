document.getElementById('btn-prefill').addEventListener('click', () => {
  console.log("✅ Botón Prefill presionado");

  const orderNumber = document.getElementById('order').value.trim();
  if (!orderNumber) {
    alert("Please enter an Order Number first.");
    return;
  }

  fetch('./data/prefill.csv')
    .then(response => response.text())
    .then(csvText => {
      csvText = csvText.replace(/^﻿/, '');

      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0) {
        console.error("❌ Errores de PapaParse:", parsed.errors);
        alert("CSV parse failed. Check console.");
        return;
      }

      const rows = parsed.data;
      const matches = rows.filter(row => row.ordnum === orderNumber);
      console.log(`🔍 Coincidencias para orden ${orderNumber}: ${matches.length}`);

      if (matches.length === 0) {
        alert("Order not found in file.");
        return;
      }

      const rawCustomer = (matches[0].name || "").trim().replace(/\s+/g, " ").toUpperCase();
      const customerSelect = document.querySelector('#customer');
      const tom = customerSelect.tomselect;

      let match = Object.values(tom.options).find(opt =>
        opt.text.toUpperCase().replace(/\s+/g, " ") === rawCustomer
      );

      if (!match) {
        const candidatos = Object.values(tom.options);
        match = candidatos.find(opt =>
          rawCustomer.includes(opt.text.toUpperCase().replace(/\s+/g, " "))
        );
      }

      if (!match && window.Fuse) {
        const fuse = new Fuse(Object.values(tom.options), {
          keys: ['text'],
          threshold: 0.3,
          includeScore: true
        });
        const result = fuse.search(rawCustomer);
        if (result.length > 0) match = result[0].item;
      }

      if (match) {
        tom.setValue(match.value);
        console.log(`👤 Cliente seleccionado: ${match.text}`);
      } else {
        console.warn(`⚠️ Cliente no encontrado: '${rawCustomer}'`);
      }

      document.querySelectorAll('#packSizeGroup input[type="checkbox"]').forEach(cb => cb.checked = false);

      const packTranslations = {
        "18OZX12": "12 X 18OZ",
        "6OZX12": "12 X 6OZ",
        "8OZX12": "8 X 18OZ",
        "9.8OZX12": "12 X 9.8OZ JUMBO",
        "DRYPINTX12": "12 X PINT",
        "18OZX8": "8 X 18OZ",
        "6OZX6": "6 X 6OZ"
      };

      const resumen = {};

      matches.forEach(row => {
        const rawCode = (row["count size"] || "").trim().toUpperCase();
        const condition = (row["Condition"] || "").trim().toUpperCase();
        const qty = parseFloat(row["Sum of qty"]);
        const pallets = parseFloat(row["Pallet"]);
        const varietyRaw = row["variety"] || "";
        const variety = varietyRaw.trim().toUpperCase();

        console.log(`📌 VARIETY DETECTADO: "${variety}"`);

        if (isNaN(qty) || isNaN(pallets)) {
          console.warn(`⚠️ Fila ignorada por falta de datos (qty/pallet). Código: ${rawCode}, Condición: ${condition}`);
          return;
        }

        let baseText = packTranslations[rawCode];
        if (!baseText) {
          console.warn(`⚠️ Código de Pack Size no reconocido: '${rawCode}'`);
          return;
        }

        if (condition === "OR") {
          baseText += " (ORGANIC)";
        }

        const isSekoya = variety.includes("SEKO");

        console.log(`→ Código CSV: ${rawCode}, Traducción: ${baseText}, Pallets: ${pallets}, Cajas: ${qty}, Variety CSV: ${variety}`);

        if (!resumen[baseText]) {
          resumen[baseText] = {
            pallets: 0,
            cajas: 0,
            variety: isSekoya ? "SEKOYA" : ""
          };
        }

        resumen[baseText].pallets += pallets;
        resumen[baseText].cajas += qty;

        if (isSekoya) {
          if (resumen[baseText].variety !== "SEKOYA") {
            resumen[baseText].variety = "SEKOYA";
            console.log(`✅ SEKOYA registrado en resumen para ${baseText}`);
          } else {
            console.log(`ℹ️ SEKOYA ya estaba registrado para ${baseText}`);
          }
        } else {
          console.log(`ℹ️ Variety no coincide con SEKO para ${baseText}: ${variety}`);
        }
      });

      console.log("📦 RESUMEN FINAL DE PACKS:", JSON.stringify(resumen, null, 2));

      Object.keys(resumen).forEach(pack => {
        const cb = Array.from(document.querySelectorAll('#packSizeGroup input[type="checkbox"]'))
          .find(input => input.value === pack);
        if (cb) {
          cb.checked = true;
          console.log(`✅ Pack seleccionado: ${pack}`);

          if (resumen[pack].variety === "SEKOYA") {
            const section = document.querySelector(`[data-pack="${pack}"]`);
            if (section && !section.querySelector(".varietyField")) {
              const varietyDiv = document.createElement("div");
              varietyDiv.className = "varietyField";
              varietyDiv.innerHTML = `
                <label for="variety_${pack}">VARIETY</label>
                <input type="text" id="variety_${pack}" value="SEKOYA" readonly style="background:#eef; font-weight:bold;" />
              `;
              section.appendChild(varietyDiv);
            }
          }
        } else {
          console.warn(`⚠️ No se encontró checkbox para: ${pack}`);
        }
      });

      updatePalletSection();

      Object.entries(resumen).forEach(([pack, datos]) => {
        const palletSelect = document.querySelector(`.pallet-count[data-pack="${pack}"]`);
        const cajasInput = document.querySelector(`.qty-input[data-pack="${pack}"]`);
        if (palletSelect) palletSelect.value = Math.round(datos.pallets);
        if (cajasInput) cajasInput.value = Math.round(datos.cajas);
      });

      localStorage.setItem("resumenPorPack", JSON.stringify(resumen));

      updateTotalPallets();
      console.log("✅ Prefill completado para la orden", orderNumber);
    })
    .catch(error => {
      console.error("❌ Error real del fetch o ejecución:", error);
      alert("There was an error loading the CSV file.");
    });
});
