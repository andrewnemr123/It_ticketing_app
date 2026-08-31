import json
from app import app

def run_tests():
    client = app.test_client()
    print("=" * 60)
    print("🧪 RUNNING BACKEND TESTS (WITH EDGE CASES)")
    print("=" * 60)

    # -------------------------------------------------------------
    # 1. Health & Root Endpoint
    # -------------------------------------------------------------
    print("\n[TEST 1] GET /health")
    res = client.get('/health')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"✅ Health OK: {res.get_json()}")

    # -------------------------------------------------------------
    # 2. Registration Edge Cases
    # -------------------------------------------------------------
    print("\n[TEST 2] POST /register - Edge Cases")

    # 2a. Missing fields
    res = client.post('/register', json={"email": "incomplete@company.com"})
    assert res.status_code == 400, f"Expected 400 for missing password/name, got {res.status_code}"
    print("  ✅ Missing fields rejected (400)")

    # 2b. Successful registration
    test_email = "tester.edgecase@company.com"
    test_pass = "MySecretPass!123"
    res = client.post('/register', json={
        "name": "Edge Case Tester",
        "email": f"  {test_email.upper()}  ",  # tests whitespace & case insensitivity
        "password": test_pass,
        "role": "EMPLOYEE"
    })
    assert res.status_code in [201, 409], f"Unexpected status: {res.status_code}"
    if res.status_code == 201:
        data = res.get_json()
        assert "access_token" in data, "JWT token missing from register response"
        user_id = data["user"]["id"]
        print(f"  ✅ Registration succeeded & returned JWT (201) - User ID: {user_id}")
    else:
        # User already in database from previous run, get ID from /users
        users_res = client.get('/users')
        users_list = json.loads(users_res.data)
        user_id = next(u["id"] for u in users_list if u["email"] == test_email)
        print(f"  ✅ User already exists (409) - User ID: {user_id}")

    # 2c. Duplicate Email
    res = client.post('/register', json={
        "name": "Duplicate Tester",
        "email": test_email,
        "password": "AnotherPassword123"
    })
    assert res.status_code == 409, f"Expected 409 for duplicate email, got {res.status_code}"
    print("  ✅ Duplicate email rejected (409)")

    # -------------------------------------------------------------
    # 3. Login Edge Cases & JWT Token Generation
    # -------------------------------------------------------------
    print("\n[TEST 3] POST /login - Edge Cases & JWT")

    # 3a. Missing email or password
    res = client.post('/login', json={"email": test_email})
    assert res.status_code == 400, "Expected 400 for missing password"
    print("  ✅ Missing login password rejected (400)")

    # 3b. Wrong password
    res = client.post('/login', json={"email": test_email, "password": "WrongPassword999"})
    assert res.status_code == 401, f"Expected 401 for wrong password, got {res.status_code}"
    print("  ✅ Incorrect password rejected (401)")

    # 3c. Non-existent email
    res = client.post('/login', json={"email": "nobody@doesnotexist.com", "password": "SomePassword"})
    assert res.status_code == 401, "Expected 401 for non-existent user"
    print("  ✅ Unknown email rejected (401)")

    # 3d. Valid login with case-insensitive whitespace email
    res = client.post('/login', json={
        "email": f"  {test_email.upper()}  ",
        "password": test_pass
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    login_data = res.get_json()
    token = login_data.get("access_token")
    assert token is not None, "Access token was not returned"
    print(f"  ✅ Login success (200), JWT token received: {token[:20]}...")

    # -------------------------------------------------------------
    # 4. Protected Route (/me) Edge Cases
    # -------------------------------------------------------------
    print("\n[TEST 4] GET /me - JWT Authorization Edge Cases")

    # 4a. Missing Authorization header
    res = client.get('/me')
    assert res.status_code == 401, "Expected 401 for missing token"
    print("  ✅ Missing Authorization header rejected (401)")

    # 4b. Malformed token (garbage string)
    res = client.get('/me', headers={"Authorization": "Bearer not-a-valid-token-xyz"})
    assert res.status_code == 401, "Expected 401 for invalid JWT"
    print("  ✅ Malformed token rejected (401)")

    # 4c. Valid JWT Token
    res = client.get('/me', headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    me_data = res.get_json()
    assert me_data["email"] == test_email
    print(f"  ✅ Valid JWT /me authenticated: {me_data['name']} ({me_data['role']})")

    # -------------------------------------------------------------
    # 5. User Update Edge Cases (PUT / PATCH)
    # -------------------------------------------------------------
    print(f"\n[TEST 5] PATCH /user/{user_id} - Update Edge Cases")

    # 5a. Non-existent user ID
    res = client.patch('/user/999999', json={"name": "Ghost"})
    assert res.status_code == 404, "Expected 404 for updating non-existent user"
    print("  ✅ Non-existent user ID update rejected (404)")

    # 5b. Update name and password
    new_pass = "BrandNewSecurePass2026!"
    res = client.patch(f'/user/{user_id}', json={
        "name": "Updated Edge Tester",
        "password": new_pass
    })
    assert res.status_code == 200
    assert res.get_json()["user"]["name"] == "Updated Edge Tester"
    print("  ✅ User name and password updated successfully (200)")

    # 5c. Verify login with NEW password
    res = client.post('/login', json={"email": test_email, "password": new_pass})
    assert res.status_code == 200, "Login failed with new password"
    print("  ✅ Login verified with newly updated password (200)")

    # 5d. Verify OLD password no longer works
    res = client.post('/login', json={"email": test_email, "password": test_pass})
    assert res.status_code == 401, "Old password should have been rejected"
    print("  ✅ Old password correctly rejected (401)")

    # -------------------------------------------------------------
    # 6. Delete User Edge Cases
    # -------------------------------------------------------------
    print(f"\n[TEST 6] DELETE /user/{user_id} - Edge Cases")

    # 6a. Delete the test user
    res = client.delete(f'/user/{user_id}')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("  ✅ User deleted successfully (200)")

    # 6b. Delete again (should now be 404)
    res = client.delete(f'/user/{user_id}')
    assert res.status_code == 404, "Expected 404 when deleting already deleted user"
    print("  ✅ Re-deleting same user returned 404 Not Found")

    # 6c. Verify login is rejected for deleted user
    res = client.post('/login', json={"email": test_email, "password": new_pass})
    assert res.status_code == 401, "Deleted user should not be able to log in"
    print("  ✅ Deleted user cannot log in (401)")

    print("\n" + "=" * 60)
    print("🎉 ALL EDGE CASE TESTS PASSED CLEANLY (100%)!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
