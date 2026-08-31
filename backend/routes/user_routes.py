import json
from flask import Blueprint, jsonify, request, Response
from werkzeug.security import generate_password_hash
import mysql.connector
from db import get_db_connection

user_bp = Blueprint('users', __name__)

@user_bp.route("/users", methods=['GET'])
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

@user_bp.route("/user/<int:id>", methods=['GET'])
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

@user_bp.route("/user/<int:id>", methods=['DELETE'])
@user_bp.route("/api/users/<int:id>", methods=['DELETE'])
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

@user_bp.route("/user/<int:id>", methods=['PUT', 'PATCH'])
@user_bp.route("/api/users/<int:id>", methods=['PUT', 'PATCH'])
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

