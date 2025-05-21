from flask import Blueprint, request, jsonify, send_from_directory
import os, uuid
from datetime import datetime

rutas_bp = Blueprint('rutas_basicas', __name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@rutas_bp.route('/')
def index():
    return send_from_directory('.', 'FORMULARIO.html')

@rutas_bp.route('/login')
def login():
    return send_from_directory('.', 'login.html')

@rutas_bp.route('/formulario2')
def formulario2():
    return send_from_directory('.', 'FORMULARIO2.html')

@rutas_bp.route('/upload-photo', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    file = request.files['photo']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}_{timestamp}{extension}"
    path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(path)

    return jsonify({"status": "success", "filename": unique_filename}), 200

@rutas_bp.route('/uploads/<filename>')
def get_uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
