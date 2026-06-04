from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import pytest
from routers.user import router, auth_check
from fastapi import FastAPI, HTTPException, status
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Create a test app
app = FastAPI()
app.include_router(router, prefix="/users", tags=["users"])

# Create test client
client = TestClient(app)


def override_auth_check(value):
    app.dependency_overrides[auth_check] = lambda: value


def override_auth_check_exception(exc):
    def _raise():
        raise exc

    app.dependency_overrides[auth_check] = _raise


def clear_auth_override():
    app.dependency_overrides.pop(auth_check, None)


class TestGetUserEndpoint:
    """Test suite for the GET /users/{user_id} endpoint"""

    @pytest.fixture
    def mock_auth_check(self):
        """Mock the auth_check dependency"""
        return {"uid": "test_user_123", "email": "testuser@example.com"}

    @pytest.fixture
    def mock_user_doc(self):
        """Mock a user document from Firestore"""
        return {
            "email": "targetuser@example.com",
            "displayName": "Target User",
            "cityName": "Vancouver",
            "provinceName": "BC",
            "bio": "Test bio",
            "role": "user",
            "totalBronze": 5,
            "totalSilver": 2,
            "totalGold": 0,
            "deletedAt": None,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": None,
        }

    @pytest.fixture
    def mock_admin_doc(self):
        """Mock an admin user document"""
        return {
            "email": "admin@example.com",
            "displayName": "Admin User",
            "cityName": "Toronto",
            "provinceName": "ON",
            "bio": "",
            "role": "admin",
            "totalBronze": 0,
            "totalSilver": 0,
            "totalGold": 0,
            "deletedAt": None,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": None,
        }

    @patch("routers.user.db")
    def test_get_user_as_regular_user_own_profile(
        self, mock_db, mock_auth_check, mock_user_doc
    ):
        """Test regular user can retrieve their own profile"""
        override_auth_check(mock_auth_check)
        try:
            mock_get_response = Mock()
            mock_get_response.exists = True
            mock_get_response.to_dict.return_value = mock_user_doc
            mock_get_response.id = "test_user_123"

            mock_db.collection.return_value.document.return_value.get.return_value = (
                mock_get_response
            )

            response = client.get(
                "/users/test_user_123", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 200
            assert response.json()["email"] == "targetuser@example.com"
            assert response.json()["displayName"] == "Target User"
        finally:
            clear_auth_override()

    @patch("routers.user.db")
    def test_get_user_as_admin_can_fetch_any_user(
        self,
        mock_db,
        mock_admin_doc,
        mock_user_doc,
    ):
        """Test admin user can retrieve any user's profile"""
        admin_user = {"uid": "admin_user_456", "email": "admin@example.com"}
        override_auth_check(admin_user)
        try:
            mock_admin_get = Mock()
            mock_admin_get.exists = True
            mock_admin_get.to_dict.return_value = mock_admin_doc

            mock_user_get = Mock()
            mock_user_get.exists = True
            mock_user_get.to_dict.return_value = mock_user_doc

            def get_side_effect(user_id):
                mock_doc = Mock()
                if user_id == "admin_user_456":
                    mock_doc.get.return_value = mock_admin_get
                else:
                    mock_doc.get.return_value = mock_user_get
                return mock_doc

            mock_db.collection.return_value.document.side_effect = get_side_effect

            response = client.get(
                "/users/test_user_123", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 200
            assert response.json()["email"] == "targetuser@example.com"
        finally:
            clear_auth_override()

    @patch("routers.user.db")
    def test_get_user_deleted_user_not_found(
        self, mock_db, mock_auth_check, mock_user_doc
    ):
        """Test retrieving a deleted user returns 404"""
        override_auth_check(mock_auth_check)
        try:
            deleted_user = mock_user_doc.copy()
            deleted_user["deletedAt"] = "2024-05-01T00:00:00Z"

            mock_get_response = Mock()
            mock_get_response.exists = True
            mock_get_response.to_dict.return_value = deleted_user
            mock_get_response.id = "deleted_user"

            mock_db.collection.return_value.document.return_value.get.return_value = (
                mock_get_response
            )

            response = client.get(
                "/users/deleted_user", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 404
            assert response.json()["detail"] == "User not found"
        finally:
            clear_auth_override()

    @patch("routers.user.db")
    def test_get_user_not_found(self, mock_db):
        """Test admin retrieving a non-existent user returns 404"""
        admin_auth = {"uid": "admin_user_456", "email": "admin@example.com"}
        override_auth_check(admin_auth)
        try:
            mock_auth_get_response = Mock()
            mock_auth_get_response.exists = True
            mock_auth_get_response.to_dict.return_value = {
                "role": "admin",
                "deletedAt": None,
            }
            mock_auth_get_response.id = "admin_user_456"

            mock_target_get_response = Mock()
            mock_target_get_response.exists = False
            mock_target_get_response.to_dict.return_value = None
            mock_target_get_response.id = "nonexistent_user"

            def document_side_effect(user_id):
                if user_id == "admin_user_456":
                    return Mock(get=Mock(return_value=mock_auth_get_response))
                return Mock(get=Mock(return_value=mock_target_get_response))

            mock_db.collection.return_value.document.side_effect = document_side_effect

            response = client.get(
                "/users/nonexistent_user", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 404
            assert response.json()["detail"] == "User not found"
        finally:
            clear_auth_override()

    def test_get_user_without_authentication(self):
        """Test accessing endpoint without authentication fails"""
        override_auth_check_exception(
            HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
            )
        )
        try:
            response = client.get("/users/some_user_id")
            assert response.status_code == 401
        finally:
            clear_auth_override()

    @patch("routers.user.db")
    def test_get_user_with_all_fields(self, mock_db, mock_auth_check, mock_user_doc):
        """Test that all expected user fields are returned"""
        override_auth_check(mock_auth_check)
        try:
            mock_get_response = Mock()
            mock_get_response.exists = True
            mock_get_response.to_dict.return_value = mock_user_doc
            mock_get_response.id = "test_user_123"

            mock_db.collection.return_value.document.return_value.get.return_value = (
                mock_get_response
            )

            response = client.get(
                "/users/test_user_123", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 200
            user_data = response.json()
            assert "email" in user_data
            assert "displayName" in user_data
            assert "cityName" in user_data
            assert "provinceName" in user_data
            assert user_data["email"] == "targetuser@example.com"
            assert user_data["displayName"] == "Target User"
            assert user_data["cityName"] == "Vancouver"
            assert user_data["provinceName"] == "BC"
        finally:
            clear_auth_override()

    @patch("routers.user.db")
    def test_get_user_database_error(self, mock_db, mock_auth_check):
        """Test handling of database errors"""
        override_auth_check(mock_auth_check)
        try:
            mock_db.collection.return_value.document.return_value.get.side_effect = (
                Exception("Database connection error")
            )

            response = client.get(
                "/users/test_user_123", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 500
            assert "Error fetching user" in response.json()["detail"]
        finally:
            clear_auth_override()


class TestGetCurrentUserEndpoint:
    """Test suite for the GET /users/me endpoint"""

    @patch("routers.user.db")
    def test_get_current_user_success(self, mock_db):
        """Test retrieving current authenticated user's profile"""
        current_user = {"uid": "current_user_123", "email": "current@example.com"}
        override_auth_check(current_user)
        try:
            mock_user_data = {
                "email": "current@example.com",
                "displayName": "Current User",
                "cityName": "Calgary",
                "provinceName": "AB",
                "bio": "My bio",
                "role": "user",
            }

            mock_get_response = Mock()
            mock_get_response.exists = True
            mock_get_response.to_dict.return_value = mock_user_data
            mock_get_response.id = "current_user_123"

            mock_db.collection.return_value.document.return_value.get.return_value = (
                mock_get_response
            )

            response = client.get(
                "/users/me", cookies={"session": "fake_session_token"}
            )

            assert response.status_code == 200
            assert response.json()["email"] == "current@example.com"
            assert response.json()["id"] == "current_user_123"
        finally:
            clear_auth_override()
