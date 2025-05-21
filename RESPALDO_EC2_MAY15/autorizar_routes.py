from flask import Blueprint, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os




import os
from dotenv import load_dotenv

load_dotenv()





autorizar_bp = Blueprint('autorizar_supervisor_email_v1', __name__)
print("✅ autorizar_routes.py cargado")

CORS(autorizar_bp)

DECISIONES_FILE = "decisiones_registradas.json"
FALLIDOS_FILE = "ordenes_fallidas.json"

def cargar_json(path):
    if os.path.exists(path):
        if os.stat(path).st_size == 0:
            print(f"⚠️ Archivo {path} está vacío. Retornando dict vacío.")
            return {}
        with open(path, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError as e:
                print(f"❌ Error al cargar JSON desde {path}: {e}")
                return {}
    return {}


def guardar_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def guardar_decision(pallet, order, customer, action):
    decisiones = cargar_json(DECISIONES_FILE)
    key = f"{order}_{pallet}_{customer}"
    decisiones[key] = action
    print(f"📝 Guardando decisión: {key} = {action}")
    guardar_json(DECISIONES_FILE, decisiones)

def ya_decidido(pallet, order, customer):
    decisiones = cargar_json(DECISIONES_FILE)
    key = f"{order}_{pallet}_{customer}"
    return decisiones.get(key)

def obtener_tag(order, customer, numero_pallet):
    fallidos_dict = cargar_json(FALLIDOS_FILE)
    pallets = fallidos_dict.get(order, {}).get(customer, [])
    for item in pallets:
        if isinstance(item, dict) and item.get("numero") == int(numero_pallet):
            return item.get("tag")
    return None

def construir_texto_pallet(pallet_num, tag, status_color, status_label):
    if tag:
        return f"<li>Pallet #{pallet_num} (TAG: {tag}): <span style='color:{status_color};font-weight:bold;'>{status_label}</span></li>"
    else:
        return f"<li>Pallet #{pallet_num}: <span style='color:{status_color};font-weight:bold;'>{status_label}</span></li>"

def verificar_si_orden_resuelta_directo(order, customer):
    fallidos_dict = cargar_json(FALLIDOS_FILE)

    if order not in fallidos_dict:
        print(f"⚠️ Orden {order} no encontrada en {FALLIDOS_FILE}")
        return False
    if customer not in fallidos_dict[order]:
        print(f"⚠️ Cliente {customer} no encontrado para orden {order} en {FALLIDOS_FILE}")
        return False

    fallidos = fallidos_dict[order][customer]
    print(f"🔎 Verificando orden {order} del cliente {customer}")
    print(f"📦 Pallets fallidos registrados: {fallidos}")

    decisiones = cargar_json(DECISIONES_FILE)
    completados = []

    for pallet in fallidos:
        if isinstance(pallet, dict):
            numero = pallet.get("numero")
        else:
            numero = pallet
        key = f"{order}_{numero}_{customer}"
        action = decisiones.get(key)
        print(f"🔍 Decisión para {key}: {action}")
        if action in ["approve", "cut", "reject"]:
            completados.append(numero)

    todos_resueltos = len(fallidos) > 0 and len(completados) == len(fallidos)
    print(f"✅ ¿Orden resuelta? {todos_resueltos} ({len(completados)}/{len(fallidos)})")
    return todos_resueltos

@autorizar_bp.route('/api/authorize', methods=['GET'])
def autorizar_pallet():
    pallet = request.args.get('pallet')
    order = request.args.get('order')
    customer = request.args.get('customer')
    action = request.args.get('action')

    print(f"\n➡️ AUTORIZAR - pallet: {pallet}, order: {order}, customer: {customer}, action: {action}")

    if not pallet or not order or not customer or action not in ["approve", "reject", "cut"]:
        return jsonify({"status": "error", "message": "Missing or invalid parameters."}), 400

    decision_anterior = ya_decidido(pallet, order, customer)
    if decision_anterior:
        print(f"⚠️ Pallet ya tenía decisión previa: {decision_anterior}")
        return f"⚠️ This pallet was already marked as '{decision_anterior.upper()}'. No further action is allowed."

    tag = obtener_tag(order, customer, pallet)
    tag_str = f" (TAG: {tag})" if tag else ""

    if action == "approve":
        subject = f"Pallet #{pallet} APPROVED - Order {order} - {customer}"
        message_html = f"""
        <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 1.6;">
          <p>Pallet <strong>#{pallet}{tag_str}</strong> from order <strong>{order}</strong> for customer <strong>{customer}</strong>
          has been <span style='color:green;font-weight:bold;'>APPROVED</span> by the supervisor.</p>
        </div>
        """
    elif action == "reject":
        subject = f"Pallet #{pallet} REJECTED - Order {order} - {customer}"
        message_html = f"""
        <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 1.6;">
          <p>Pallet <strong>#{pallet}{tag_str}</strong> from order <strong>{order}</strong> for customer <strong>{customer}</strong>
          has been <span style='color:red;font-weight:bold;'>REJECTED</span> by the supervisor.</p>
        </div>
        """
    elif action == "cut":
        subject = f"Pallet #{pallet} CUT FROM ORDER - Order {order} - {customer}"
        message_html = f"""
        <div style="font-family: Arial, sans-serif; font-size: 18px; line-height: 1.6;">
          <p>Pallet <strong>#{pallet}{tag_str}</strong> from order <strong>{order}</strong> for customer <strong>{customer}</strong>
          has been <span style='color:orange;font-weight:bold;'>CUT FROM THE ORDER</span> by the supervisor.</p>
        </div>
        """

    try:
        enviar_correo_alerta(subject, message_html)
        guardar_decision(pallet, order, customer, action)

        if verificar_si_orden_resuelta_directo(order, customer):
            print(f"📤 Enviando correo final para orden {order}")
            enviar_correo_final_orden_pasada(order, customer)
        else:
            print("🕓 Aún hay pallets pendientes por resolver")

        return f"✅ Email sent: {subject}"
    except Exception as e:
        print("❌ Error sending email:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

def enviar_correo_final_orden_pasada(order, customer):
    decisiones = cargar_json(DECISIONES_FILE)
    fallidos = cargar_json(FALLIDOS_FILE).get(order, {}).get(customer, [])

    aprobados = []
    cortados = []
    rechazados = []

    for pallet in fallidos:
        if isinstance(pallet, dict):
            numero = pallet.get("numero")
            tag = pallet.get("tag")
        else:
            numero = pallet
            tag = None

        key = f"{order}_{numero}_{customer}"
        action = decisiones.get(key)
        if action == "approve":
            aprobados.append((numero, tag))
        elif action == "cut":
            cortados.append((numero, tag))
        elif action == "reject":
            rechazados.append((numero, tag))

    if len(rechazados) == 0:
        subject = f"✅ ORDER PASSED - Order {order} - {customer}"
        mensaje = f"""
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <h2 style="color:green;">✅ ORDER PASSED</h2>
          <p>All previously failed pallets for order <strong>{order}</strong> have been resolved.</p>
          <p>Customer: <strong>{customer}</strong></p>
          <ul>
        """
        for p, tag in aprobados:
            mensaje += construir_texto_pallet(p, tag, "green", "APPROVE")
        for p, tag in cortados:
            mensaje += construir_texto_pallet(p, tag, "orange", "CUT")
        mensaje += """
          </ul>
          <p style="margin-top:10px;">The order has now been marked as <strong style="color:green;">PASSED</strong>.</p>
        </div>
        """
    else:
        subject = f"⏳ ORDER PENDING - Order {order} - {customer}"
        mensaje = f"""
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <h2 style="color:orange;">⏳ ORDER PENDING</h2>
          <p>Some failed pallets from order <strong>{order}</strong> are still unresolved.</p>
          <p>Customer: <strong>{customer}</strong></p>
        """
        if aprobados or cortados:
            mensaje += "<h3>✅ Approved / Cut Pallets:</h3><ul>"
            for p, tag in aprobados:
                mensaje += construir_texto_pallet(p, tag, "green", "APPROVE")
            for p, tag in cortados:
                mensaje += construir_texto_pallet(p, tag, "orange", "CUT")
            mensaje += "</ul>"

        mensaje += "<h3>❌ Rejected Pallets:</h3><ul>"
        for p, tag in rechazados:
            mensaje += construir_texto_pallet(p, tag, "red", "REJECT")
        mensaje += "</ul>"

        mensaje += """
          <p style="color:red; font-weight:bold; font-size: 17px; margin-top:20px;">
            ❌ A new inspection form must be submitted to include the rejected pallet(s).
          </p>
          <p>The order has now been marked as <strong style="color:orange;">PENDING</strong>.</p>
        </div>
        """

    enviar_correo_alerta(subject, mensaje)

def enviar_correo_alerta(subject, message_html):
    SMTP_SERVER = 'smtp.gmail.com'
    SMTP_PORT = 587
    SMTP_USER = os.getenv("EMAIL_USER")
    SMTP_PASS = os.getenv("EMAIL_PASSWORD")

    DESTINATARIO = 'formquality0@gmail.com'

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = DESTINATARIO
    msg['Subject'] = subject
    msg.attach(MIMEText(message_html, 'html'))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, DESTINATARIO, msg.as_string())

    print(f"📧 Email sent to {DESTINATARIO} with subject: {subject}")

@autorizar_bp.route('/api/registrar-fallidos', methods=['POST'])
def registrar_fallidos():
    data = request.json
    order = data.get("order")
    customer = data.get("customer")
    fallidos = data.get("fallidos")

    if not order or not customer or not isinstance(fallidos, list):
        return jsonify({"status": "error", "message": "Datos incompletos o inválidos"}), 400

    path = FALLIDOS_FILE
    if os.path.exists(path):
        with open(path, "r") as f:
            all_data = json.load(f)
    else:
        all_data = {}

    if order not in all_data:
        all_data[order] = {}
    all_data[order][customer] = fallidos

    with open(path, "w") as f:
        json.dump(all_data, f, indent=2)

    print(f"📦 Pallets fallidos registrados para orden {order} / {customer}: {fallidos}")
    return jsonify({"status": "ok", "message": "Fallidos registrados"})
