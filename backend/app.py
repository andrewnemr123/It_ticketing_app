import os
import json
import bcrypt
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.json.sort_keys = False
CORS(app)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'it_ticketing'),
    'port': int(os.getenv('DB_PORT', 3306)),
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

@app.route("/")
def home():
    return "<h2>IT Ticketing Backend Running (Flask)</h2>"

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

@app.route("/register", methods=['POST'])
@app.route("/api/auth/register", methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'USER')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    email = email.strip().lower()

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if user already exists
        cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"error": "An account with this email already exists"}), 409

        # Hash password with bcrypt
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        sql = "INSERT INTO user (email, password_hash, role) VALUES (%s, %s, %s)"
        cursor.execute(sql, (email, password_hash, role))
        conn.commit()

        new_id = cursor.lastrowid
        cursor.close()
        conn.close()

        new_user = {
            "id": new_id,
            "email": email,
            "role": role
        }
        return jsonify({
            "message": "User registered successfully",
            "user": new_user
        }), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/login", methods=['POST'])
@app.route("/api/auth/login", methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    email = email.strip().lower()

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Query user by email
        cursor.execute("SELECT id, email, password_hash, role FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        # Verify password with bcrypt
        stored_hash = user['password_hash'].encode('utf-8')
        if not bcrypt.checkpw(password.encode('utf-8'), stored_hash):
            return jsonify({"error": "Invalid email or password"}), 401

        user_data = {
            "id": user['id'],
            "email": user['email'],
            "role": user['role']
        }
        return jsonify({
            "message": "Login successful",
            "user": user_data
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/users", methods=['GET'])
def get_all_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, email, role FROM user")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return Response(
            json.dumps(users, sort_keys=False),
            mimetype='application/json'
        ), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/user/<int:id>", methods=['GET'])
def get_user_by_id(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, email, role FROM user WHERE id = %s", (id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": f"User {id} not found"}), 404

        return jsonify(user), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

