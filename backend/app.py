import os
import json
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.json.sort_keys = False
CORS(app) # Enable CORS for React frontend

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

@app.route("/login", methods=['POST'])
@app.route("/api/auth/login", methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, name, email, password_hash, role, is_deleted FROM user WHERE email = %s AND (is_deleted = FALSE OR is_deleted IS NULL)",
            (email,)
        )
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        stored_hash = user['password_hash']
        is_valid = False

        if stored_hash.startswith(('scrypt:', 'pbkdf2:', 'bcrypt:', '$2b$', '$2a$')):
            is_valid = check_password_hash(stored_hash, password)
        else:
            is_valid = (stored_hash == password)

        if not is_valid:
            return jsonify({"error": "Invalid email or password"}), 401

        user_data = {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role']
        }
        return jsonify({
            "message": "Login successful",
            "user": user_data
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/register", methods=['POST'])
@app.route("/api/auth/register", methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'EMPLOYEE')

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if role not in ['EMPLOYEE', 'ADMIN']:
        role = 'EMPLOYEE'

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, is_deleted FROM user WHERE email = %s", (email,))
        existing = cursor.fetchone()
        
        hashed_password = generate_password_hash(password)

        if existing:
            if existing.get('is_deleted'):
                cursor.execute(
                    "UPDATE user SET name = %s, password_hash = %s, role = %s, is_deleted = FALSE WHERE id = %s",
                    (name, hashed_password, role, existing['id'])
                )
                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({
                    "message": "User registered successfully",
                    "user": {"id": existing['id'], "name": name, "email": email, "role": role}
                }), 201
            else:
                cursor.close()
                conn.close()
                return jsonify({"error": "An account with this email already exists"}), 409

        sql = "INSERT INTO user (name, email, password_hash, role, is_deleted) VALUES (%s, %s, %s, %s, FALSE)"
        cursor.execute(sql, (name, email, hashed_password, role))
        conn.commit()

        new_id = cursor.lastrowid
        cursor.close()
        conn.close()

        new_user = {
            "id": new_id,
            "name": name,
            "email": email,
            "role": role
        }
        return jsonify({
            "message": "User registered successfully",
            "user": new_user
        }), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/users", methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, role, created_at FROM user WHERE (is_deleted = FALSE OR is_deleted IS NULL)")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return Response(json.dumps(users, default=str, sort_keys=False), mimetype='application/json'), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/user/<int:id>", methods=['GET'])
def get_user_by_id(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, role, created_at FROM user WHERE id = %s AND (is_deleted = FALSE OR is_deleted IS NULL)", (id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": f"User {id} not found"}), 404

        return jsonify(user), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/user/<int:id>", methods=['DELETE'])
@app.route("/api/users/<int:id>", methods=['DELETE'])
def delete_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, email FROM user WHERE id = %s AND (is_deleted = FALSE OR is_deleted IS NULL)", (id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": f"User {id} not found"}), 404

        cursor.execute("UPDATE user SET is_deleted = TRUE WHERE id = %s", (id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": f"User {id} ({user['email']}) deleted successfully"
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/user/<int:id>", methods=['PUT', 'PATCH'])
@app.route("/api/users/<int:id>", methods=['PUT', 'PATCH'])
def update_user(id):
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, email, role FROM user WHERE id = %s AND (is_deleted = FALSE OR is_deleted IS NULL)", (id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": f"User {id} not found"}), 404

        updates = []
        params = []

        if name is not None:
            updates.append("name = %s")
            params.append(name.strip())

        if email is not None:
            email_clean = email.strip().lower()
            cursor.execute("SELECT id FROM user WHERE email = %s AND id != %s AND (is_deleted = FALSE OR is_deleted IS NULL)", (email_clean, id))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "This email is already in use by another account"}), 409
            updates.append("email = %s")
            params.append(email_clean)

        if password is not None and password != "":
            hashed_password = generate_password_hash(password)
            updates.append("password_hash = %s")
            params.append(hashed_password)

        if role is not None:
            if role in ['EMPLOYEE', 'ADMIN']:
                updates.append("role = %s")
                params.append(role)

        if not updates:
            cursor.close()
            conn.close()
            return jsonify({"message": "No changes provided", "user": user}), 200

        params.append(id)
        sql = f"UPDATE user SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(sql, tuple(params))
        conn.commit()

        cursor.execute("SELECT id, name, email, role, created_at FROM user WHERE id = %s", (id,))
        updated_user = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            "message": f"User {id} updated successfully",
            "user": updated_user
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)