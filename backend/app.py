import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from db import get_db_connection
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp

load_dotenv()

app = Flask(__name__)
app.json.sort_keys = False
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)

@app.route("/")
def home():
    return "<h2>IT Ticketing Backend</h2>"

@app.route("/health")
def health():
    try:
        conn = get_db_connection()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "status": "ok",
        "database": db_status
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)