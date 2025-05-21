from flask import Blueprint, request, jsonify
import os
import uuid
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

pdf_bp = Blueprint('pdf', __name__)

UPLOAD_FOLDER = 'uploads'

@pdf_bp.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.json
        print("📨 JSON recibido para PDF:", data)

        order_number = data.get("ORDERNUMBER", "N/A")
        customer = data.get("CUSTOMER", "N/A")
        head_office = data.get("HEADOFFICE", "N/A")
        inspector = data.get("INSPECTOR", "N/A")
        date = data.get("DATE", datetime.now().strftime("%Y-%m-%d"))
        loading_location = data.get("LOADINGLOCATION", "N/A")  # ✅ agregado
        status = "FAILED" if any(p.get("TOTALSTATUS") == "FAILED" for p in data.get("PALLETS", [])) else "PASSED"
        resumen = data.get("PACKSIZE_COUNT", {})
        pallets = data.get("PALLETS", [])

        pdf_filename = f"inspection_{order_number}_{uuid.uuid4().hex}.pdf"
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        c = canvas.Canvas(pdf_path, pagesize=letter)
        width, height = letter

        def titulo(text):
            nonlocal y
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y, text)
            y -= 25

        def label_valor(label, valor):
            nonlocal y
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, label)
            y -= 14
            c.setFont("Helvetica", 11)
            c.drawString(60, y, valor)
            y -= 18

        def imagen(titulo, url):
            nonlocal y
            if not url:
                return
            filename = os.path.basename(url)
            path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(path):
                c.setFont("Helvetica-Bold", 11)
                c.drawCentredString(width / 2, y, titulo)
                y -= 10
                try:
                    c.drawImage(ImageReader(path), (width - 120) / 2, y - 90, width=120, height=90)
                    y -= 100
                except:
                    y -= 20
                y -= 10

        def imagen_2x2(titulo, url, x, y_pos):
            if not url: return
            filename = os.path.basename(url)
            path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(path):
                try:
                    c.setFont("Helvetica-Bold", 10)
                    c.drawCentredString(x + 60, y_pos + 95, titulo)
                    c.drawImage(ImageReader(path), x, y_pos, width=120, height=90)
                except:
                    pass

        # === PAGE 1: GENERAL SUMMARY ===
        y = height - 50
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width / 2, y, "ORDER GENERAL SUMMARY")
        y -= 40

        label_valor("ORDER NUMBER:", order_number)
        label_valor("STATUS:", status)
        label_valor("CUSTOMER:", customer)
        label_valor("HEAD OFFICE:", head_office)
        label_valor("LOADING LOCATION:", loading_location)  # ✅ insertado aquí
        label_valor("LOAD DATE:", date)
        label_valor("INSPECTOR NAME:", inspector)

        if isinstance(resumen, dict):
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y, "TOTAL PALLET / CASES")
            y -= 20
            c.setFont("Helvetica", 11)
            for pack, info in resumen.items():
                c.drawString(60, y, f"{pack} PALLETS: {info.get('pallets', 0)}")
                y -= 15
                c.drawString(60, y, f"{pack} QTY: {info.get('cajas', 0)}")
                y -= 20

        passed = sum(1 for p in pallets if p.get("TOTALSTATUS") == "PASSED")
        failed = sum(1 for p in pallets if p.get("TOTALSTATUS") == "FAILED")

        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "PALLET STATUS SUMMARY")
        y -= 20
        c.setFont("Helvetica", 11)
        c.drawString(60, y, f"PASSED PALLETS: {passed}")
        y -= 15
        c.drawString(60, y, f"FAILED PALLETS: {failed}")
        y -= 20




        c.showPage()

        for pallet in pallets:
            pnum = pallet.get("PALLETNUMBER", pallet.get("pallet", "X"))
            y = height - 50

            # === PALLET PAGE 1 ===
            titulo(f"PALLET {pnum} - DETAILS")
            label_valor(f"ALPINE FRESH PALLET TAG # (PALLET {pnum})", pallet.get("PALLETTAG", ""))
            imagen(f"PALLET TAG PHOTO (PALLET {pnum})", pallet.get("PALLETPHOTO"))
            label_valor(f"NUMBER OF BOXES (PALLET {pnum})", pallet.get("BOXES", ""))
            label_valor(f"LABEL (PALLET {pnum})", pallet.get("LABEL", ""))
            label_valor(f"PACK SIZE (PALLET {pnum})", pallet.get("PACKSIZE", ""))
            imagen(f"LABEL PHOTO (PALLET {pnum})", pallet.get("LABELPHOTO"))
            label_valor(f"UPC (PALLET {pnum})", pallet.get("UPC", ""))
            label_valor(f"COUNTRY OF ORIGIN (PALLET {pnum})", pallet.get("COUNTRY", ""))
            label_valor(f"LABEL LANGUAGE (PALLET {pnum})", pallet.get("LABELLANGUAGE", ""))
            label_valor(f"CLAMSHELL WEIGHT MATCHES LABEL WEIGHT (PALLET {pnum})", pallet.get("CLAMSHELLMATCHES", ""))

            titulo(f"PACKAGING - PALLET {pnum}")
            label_valor(f"PALLET TYPE (PALLET {pnum})", pallet.get("PALLETTYPE", ""))
            label_valor(f"BOXES / PALLET/ STRAPS & CORNERS BOARDS ARE IN GOOD CONDITION (PALLET {pnum})", pallet.get("BOXESCONDITION", ""))
            label_valor(f"PTI INFORMATION IS CORRECT? CONFIRM PTI SAYS 'PACKED ON' FOR DATE (PALLET {pnum})", pallet.get("PTI CHECK", ""))
            label_valor(f"CLAMSHELL TYPE (PALLET {pnum})", pallet.get("CLAMSHELLTYPE", ""))
            label_valor(f"CLOSURE TYPE (PALLET {pnum})", pallet.get("CLOSURETYPE", ""))
            c.showPage()

            # === PALLET PAGE 2 ===
            y = height - 50
            titulo(f"QUALITY - PALLET {pnum}")
            label_valor(f"VARIETY (PALLET {pnum})", pallet.get("VARIETY", ""))
            label_valor(f"FRUIT APPEARANCE (PALLET {pnum})", pallet.get("FRUITAPPEARANCE", ""))
            label_valor(f"SIZING (PALLET {pnum})", pallet.get("SIZING", ""))
            label_valor(f"STEMS (PALLET {pnum})", pallet.get("STEMS", ""))
            label_valor(f"MOLD / DECAY (PALLET {pnum})", pallet.get("MOLDDECAY", ""))
            label_valor(f"BAXLO READING (PALLET {pnum})", pallet.get("BAXLOREADING", ""))

            imagen(f"QUALITY PHOTO (PALLET {pnum})", pallet.get("QUALITYPHOTO"))
            imagen(f"TEMPERATURE PHOTO (PALLET {pnum})", pallet.get("TEMPPHOTO"))

            c.showPage()

            # === PALLET PAGE 3 ===
            y = height - 50
            titulo(f"ADDITIONAL PHOTOS - PALLET {pnum}")

            imagen(f"FRUIT APPEARANCE PHOTO (PALLET {pnum})", pallet.get("FRUITAPPEARANCEPHOTO"))
            imagen(f"SIZING PHOTO (PALLET {pnum})", pallet.get("SIZINGPHOTO"))
            imagen(f"STEMS PHOTO (PALLET {pnum})", pallet.get("STEMSPHOTO"))
            imagen(f"MOLD / DECAY PHOTO (PALLET {pnum})", pallet.get("MOLDPHOTO"))

            titulo(f"INSPECTION SUMMARY - PALLET {pnum}")
            label_valor(f"LABEL PALLET STATUS (PALLET {pnum})", pallet.get("LABELSTATUS", ""))
            label_valor(f"PACKAGING PALLET STATUS (PALLET {pnum})", pallet.get("PACKAGINGSTATUS", ""))
            label_valor(f"QUALITY PALLET STATUS (PALLET {pnum})", pallet.get("QUALITYSTATUS", ""))
            label_valor(f"PALLET ORDER STATUS (PALLET {pnum})", pallet.get("TOTALSTATUS", ""))

            c.showPage()

        c.save()
        return jsonify({"status": "success", "pdf": pdf_filename})

    except Exception as e:
        print("❌ Error al generar PDF:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@pdf_bp.route('/generate-pdf', methods=['GET'])
def no_get_pdf():
    return jsonify({"status": "error", "message": "GET not allowed"}), 405
