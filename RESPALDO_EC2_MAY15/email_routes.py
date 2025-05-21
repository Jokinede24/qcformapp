from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
from dotenv import load_dotenv

# 🔐 Cargar variables de entorno
load_dotenv()

email_bp = Blueprint('email', __name__)

# Configuración del correo
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
UPLOAD_FOLDER = 'uploads'

@email_bp.route('/api/send-email', methods=['POST'])
def send_email():
    try:
        data = request.json
        destinatario = data['to']
        asunto = data['subject']
        cuerpo_html = data['message']
        pdf_filename = data.get('pdfFilename')

        mensaje = MIMEMultipart("mixed")
        mensaje['From'] = EMAIL_USER
        mensaje['To'] = destinatario
        mensaje['Subject'] = asunto
        mensaje.attach(MIMEText(cuerpo_html, 'html'))

        if pdf_filename:
            pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
            if os.path.exists(pdf_path):
                with open(pdf_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=pdf_filename)
                    part['Content-Disposition'] = f'attachment; filename="{pdf_filename}"'
                    mensaje.attach(part)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(mensaje)

        return jsonify({"status": "success", "message": "Correo enviado correctamente."})

    except Exception as e:
        print("❌ Error al enviar correo:", e)
        return jsonify({"status": "error", "message": str(e)}), 500
