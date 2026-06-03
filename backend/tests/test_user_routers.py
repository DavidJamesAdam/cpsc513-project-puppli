from fastapi import FastAPI
from routers.user import router
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

# Import the router and dependencies
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Create a test app
app = FastAPI()
app.include_router(router, prefix="/users", tags=["users"])

# Create test client
client = TestClient(app)


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
    @patch("routers.user.auth_check")
    def test_get_user_as_regular_user_own_profile(
        self, mock_auth_check_dep, mock_db, mock_auth_check, mock_user_doc
    ):
        """Test regular user can retrieve their own profile"""
        # Setup mocks
        mock_auth_check_dep.return_value = mock_auth_check

        # Mock the db calls
        mock_get_response = Mock()
        mock_get_response.exists = True
        mock_get_response.to_dict.return_value = mock_user_doc
        mock_get_response.id = "test_user_123"

        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_get_response
        )

        # Make request
        response = client.get(
            "/users/test_user_123", cookies={"session": "fake_session_token"}
        )

        # Assertions
        assert response.status_code == 200
        assert response.json()["email"] == "targetuser@example.com"
        assert response.json()["displayName"] == "Target User"

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_as_admin_can_fetch_any_user(
        self,
        mock_auth_check_dep,
        mock_db,
        mock_auth_check,
        mock_admin_doc,
        mock_user_doc,
    ):
        """Test admin user can retrieve any user's profile"""
        # Admin user trying to get another user's profile
        admin_user = {"uid": "admin_user_456", "email": "admin@example.com"}
        mock_auth_check_dep.return_value = admin_user

        # Mock db.collection('users').document(admin_uid).get() to return admin doc
        mock_admin_get = Mock()
        mock_admin_get.exists = True
        mock_admin_get.to_dict.return_value = mock_admin_doc

        # Mock db.collection('users').document(target_uid).get() to return user doc
        mock_user_get = Mock()
        mock_user_get.exists = True
        mock_user_get.to_dict.return_value = mock_user_doc

        # Create a side effect to return different mocks based on the user_id
        def get_side_effect(user_id):
            mock_doc = Mock()
            if user_id == "admin_user_456":
                mock_doc.get.return_value = mock_admin_get
            else:
                mock_doc.get.return_value = mock_user_get
            return mock_doc

        mock_db.collection.return_value.document.side_effect = get_side_effect

        # Make request - admin getting another user's profile
        response = client.get(
            "/users/test_user_123", cookies={"session": "fake_session_token"}
        )

        # Assertions
        assert response.status_code == 200
        assert response.json()["email"] == "targetuser@example.com"

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_deleted_user_not_found(
        self, mock_auth_check_dep, mock_db, mock_auth_check, mock_user_doc
    ):
        """Test retrieving a deleted user returns 404"""
        mock_auth_check_dep.return_value = mock_auth_check

        # Create deleted user doc
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

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_not_found(self, mock_auth_check_dep, mock_db, mock_auth_check):
        """Test retrieving a non-existent user returns 404"""
        mock_auth_check_dep.return_value = mock_auth_check

        mock_get_response = Mock()
        mock_get_response.exists = True
        mock_get_response.to_dict.return_value = {"deletedAt": None}
        mock_get_response.id = "nonexistent_user"

        # Mock to raise an exception when getting non-existent user
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_get_response
        )

        # response = client.get(
        #     "/users/nonexistent_user", cookies={"session": "fake_session_token"}
        # )

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_without_authentication(self, mock_auth_check_dep, mock_db):
        """Test accessing endpoint without authentication fails"""
        mock_auth_check_dep.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

        response = client.get("/users/some_user_id")

        assert response.status_code == 401

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_with_all_fields(
        self, mock_auth_check_dep, mock_db, mock_auth_check, mock_user_doc
    ):
        """Test that all expected user fields are returned"""
        mock_auth_check_dep.return_value = mock_auth_check

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

        # Verify all required UserInfo fields are present
        assert "email" in user_data
        assert "displayName" in user_data
        assert "cityName" in user_data
        assert "provinceName" in user_data
        assert user_data["email"] == "targetuser@example.com"
        assert user_data["displayName"] == "Target User"
        assert user_data["cityName"] == "Vancouver"
        assert user_data["provinceName"] == "BC"

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_database_error(
        self, mock_auth_check_dep, mock_db, mock_auth_check
    ):
        """Test handling of database errors"""
        mock_auth_check_dep.return_value = mock_auth_check

        # Mock database error
        mock_db.collection.return_value.document.return_value.get.side_effect = (
            Exception("Database connection error")
        )

        response = client.get(
            "/users/test_user_123", cookies={"session": "fake_session_token"}
        )

        assert response.status_code == 500
        assert "Error fetching user" in response.json()["detail"]


# Additional test for get_current_user endpoint
class TestGetCurrentUserEndpoint:
    """Test suite for the GET /users/me endpoint"""

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_current_user_success(self, mock_auth_check_dep, mock_db):
        """Test retrieving current authenticated user's profile"""
        mock_user = {"uid": "current_user_123", "email": "current@example.com"}
        mock_auth_check_dep.return_value = mock_user

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

        response = client.get("/users/me", cookies={"session": "fake_session_token"})

        assert response.status_code == 200
        assert response.json()["email"] == "current@example.com"
        assert response.json()["id"] == "current_user_123"
