from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from db import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/login", methods=['POST'])
@auth_bp.route("/api/auth/login", methods=['POST'])
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

@auth_bp.route("/register", methods=['POST'])
@auth_bp.route("/api/auth/register", methods=['POST'])
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

