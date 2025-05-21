// formulario2-utils.js

/**
 * Redimensiona una imagen a un máximo de tamaño y la convierte en un Blob JPEG comprimido.
 * @param {File} file - Archivo original de imagen.
 * @param {number} maxWidth - Ancho máximo deseado.
 * @param {number} maxHeight - Alto máximo deseado.
 * @returns {Promise<Blob>} - Blob de imagen redimensionada y comprimida.
 */
function resizeImageToBlob(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        } else if (height > width && height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("No se pudo convertir la imagen a blob."));
          }
        }, "image/jpeg", 0.7);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
