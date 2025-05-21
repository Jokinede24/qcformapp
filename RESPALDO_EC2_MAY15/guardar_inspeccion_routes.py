from flask import Blueprint, request, jsonify
import pyodbc

guardar_inspeccion_bp = Blueprint('guardar_inspeccion_bp', __name__)

@guardar_inspeccion_bp.route("/api/guardar-inspeccion", methods=["POST"])
def guardar_inspeccion():
    try:
        data = request.get_json()

        print("\n📦 Recibido JSON para inspección:")
        print("  - ORDERNUMBER:", data.get("ORDERNUMBER"))
        print("  - CUSTOMER:", data.get("CUSTOMER"))
        print("  - TOTAL PALLETS:", len(data.get("PALLETS", [])))

        # Conexión a la base de datos
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=database-shippingform.crcaq60w6r05.us-east-1.rds.amazonaws.com;"
            "DATABASE=ShippingForm;"
            "UID=admin;"
            "PWD=cristobaljokin2025"
        )
        cursor = conn.cursor()

        # Insertar en tabla INSPECTION
        cursor.execute("""
            INSERT INTO INSPECTION (
                ORDERNUMBER, COMMODITY, CUSTOMER, HEADOFFICE, INSPECTOR,
                DATE, LOADINGLOCATION, TOTAL_PALLETS, TOTAL_CAJAS, PACKSIZE_COUNT
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("ORDERNUMBER", ""),
            "BLUEBERRIES",
            data.get("CUSTOMER", ""),
            data.get("HEADOFFICE", ""),
            data.get("INSPECTOR", ""),
            data.get("DATE", ""),
            data.get("LOADINGLOCATION", ""),
            len(data.get("PALLETS", [])),
            sum(int(p.get("BOXES", 0) or 0) for p in data.get("PALLETS", [])),
            str(data.get("PACKSIZE_COUNT", {}))
        ))

        # Lista oficial de campos por pallet
        campos = [
            "ORDERNUMBER", "COMMODITY", "PALLETNUMBER", "PALLETTAG", "BOXES", "PACKSIZE", "LABEL", "UPC",
            "COUNTRY", "LABELLANGUAGE", "CLAMSHELLMATCHES", "PALLETTYPE", "BOXESCONDITION", "PTI CHECK",
            "CLAMSHELLTYPE", "CLOSURETYPE", "VARIETY", "FRUITAPPEARANCE", "SIZING", "STEMS", "MOLDDECAY",
            "BAXLOREADING", "LABELSTATUS", "PACKAGINGSTATUS", "QUALITYSTATUS", "TOTALSTATUS", "AUTHORIZEDBY",
            "PALLETPHOTO", "LABELPHOTO", "QUALITYPHOTO", "TEMPPHOTO",
            "FRUITAPPEARANCEPHOTO", "SIZINGPHOTO", "STEMSPHOTO", "MOLDPHOTO"
        ]

        # Insertar cada pallet
        for i, p in enumerate(data.get("PALLETS", []), start=1):
            print(f"\n🔪 Insertando pallet {i}:")
            valores = [p.get(campo, "") for campo in campos]

            print(f"🧪 VERIFICACIÓN FINAL → Total parámetros: {len(valores)}")
            for idx, (campo, valor) in enumerate(zip(campos, valores), start=1):
                estado = "✅ OK" if valor not in [None, ""] else "❌ VACÍO o NULL"
                print(f"{idx:02d}. {campo}: {valor}  --> {estado}")

            # Protección extra
            if len(valores) != 36:
                print("❌ ERROR: longitud inesperada en valores →", len(valores))
                raise ValueError(f"INSERT PALLET requiere 36 valores, se recibieron {len(valores)}")

            cursor.execute("""
                INSERT INTO PALLETS (
                    ORDERNUMBER, COMMODITY, PALLETNUMBER, PALLETTAG, BOXES, PACKSIZE,
                    LABEL, UPC, COUNTRY, LABELLANGUAGE, CLAMSHELLMATCHES, PALLETTYPE,
                    BOXESCONDITION, [PTI CHECK], CLAMSHELLTYPE, CLOSURETYPE, VARIETY,
                    FRUITAPPEARANCE, SIZING, STEMS, MOLDDECAY, BAXLOREADING,
                    LABELSTATUS, PACKAGINGSTATUS, QUALITYSTATUS, TOTALSTATUS, AUTHORIZEDBY,
                    PALLETPHOTO, LABELPHOTO, QUALITYPHOTO, TEMPPHOTO,
                    FRUITAPPEARANCEPHOTO, SIZINGPHOTO, STEMSPHOTO, MOLDPHOTO
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, valores)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Inspección guardada correctamente"}), 200

    except Exception as e:
        print("\n❌ Error en guardar_inspeccion:", e)
        return jsonify({"error": str(e)}), 500


@guardar_inspeccion_bp.route("/api/test-db", methods=["GET"])
def test_db():
    return jsonify({"message": "🚀 Ruta activa y blueprint funcionando"})
