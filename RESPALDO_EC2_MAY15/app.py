from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import uuid
import json

load_dotenv()

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Importar los blueprints
from rutas_basicas import rutas_bp
from email_routes import email_bp
from pdf_routes import pdf_bp
from autorizar_routes import autorizar_bp
from guardar_inspeccion_routes import guardar_inspeccion_bp

# Registrar los blueprints
app.register_blueprint(rutas_bp)
app.register_blueprint(email_bp)
app.register_blueprint(pdf_bp)
app.register_blueprint(autorizar_bp)
app.register_blueprint(guardar_inspeccion_bp)

# 📱 Ruta para recibir logs desde el navegador
@app.route('/upload-photo', methods=['POST'])
def upload_photo():
    print("\n🟣 [UPLOAD] INICIO")

    # Paso 1: Validar existencia de archivo
    if 'photo' not in request.files:
        print("❌ [UPLOAD] No se encontró campo 'photo' en request.files")
        return jsonify({"error": "No file part"}), 400

    file = request.files['photo']
    filename = file.filename or "SIN_NOMBRE"
    print(f"📥 Archivo recibido: {filename}")

    # Paso 2: Detectar tipo de foto por nombre (no requiere frontend)
    tipo = "OTRO"
    filename_lower = filename.lower()
    if "quality" in filename_lower:
        tipo = "QUALITY"
    elif "temp" in filename_lower or "temperature" in filename_lower:
        tipo = "TEMPERATURE"

    print(f"🔍 Tipo detectado por nombre: {tipo}")

    # Paso 3: Crear carpeta de uploads
    try:
        os.makedirs('uploads', exist_ok=True)
        print("📂 Carpeta 'uploads/' lista")
    except Exception as e:
        print(f"❌ Error al crear carpeta: {e}")
        return jsonify({"error": "Failed to create upload directory"}), 500

    # Paso 4: Verificar tamaño
    try:
        file_bytes = file.read()
        size_kb = len(file_bytes) // 1024
        file.seek(0)

        if size_kb == 0:
            print(f"⚠️ El archivo '{filename}' tiene tamaño 0 KB. Podría ser inválido.")
        else:
            print(f"📏 Tamaño del archivo: {size_kb} KB")

    except Exception as e:
        print(f"❌ Error al leer archivo: {e}")
        return jsonify({"error": "Failed to read file"}), 500

    # Paso 5: Guardar con nombre único
    unique_filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join("uploads", unique_filename)

    try:
        file.save(filepath)
        print(f"✅ Archivo guardado como: {filepath}")
    except Exception as e:
        print(f"❌ Error al guardar archivo: {e}")
        return jsonify({"error": "Failed to save file"}), 500

    # Paso 6: Construir URL pública
    url = f"http://qcformapp.com/uploads/{unique_filename}"
    print(f"🔗 URL generada: {url}")
    print(f"✅ [UPLOAD {tipo}] COMPLETADO\n")

    return jsonify({
        "status": "success",  # ✅ agregado para frontend
        "filename": unique_filename,
        "url": url
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
