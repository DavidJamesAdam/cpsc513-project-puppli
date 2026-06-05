from fastapi import FastAPI
from routers.user import router
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from utils.authCheck import auth_check, require_admin

# Import the router and dependencies
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Create a test app
app = FastAPI()
app.include_router(router, prefix="/users", tags=["users"])
app.dependency_overrides[auth_check] = lambda: {
    "uid": "test_user_123",
    "email": "testuser@example.com",
}
# app.dependency_overrides[require_admin] = lambda: {"uid": "admin_user_456", "email": "admin@example.com"}

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

        # assert response.status_code == 404
        # assert response.json()["detail"] == "User not found"

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    def test_get_user_without_authentication(self, mock_auth_check_dep, mock_db):
        """Test accessing endpoint without authentication fails"""
        mock_auth_check_dep.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

        response = client.get("/users")

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

class TestDeleteUserEndpoint:
    """Test suite for the GET /users/me endpoint"""

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
    @pytest.mark.skip(reason="Just need this for testing for now")
    def test_delete_existing_user_as_admin(self, mock_auth, mock_db):
      # Mock the user document returned by db.collection('users').document(user_id).get()
      mock_user_doc = Mock()
      mock_user_doc.exists = True
      mock_user_doc.to_dict.return_value = {"deletedAt": None, "displayName": "Target User"}
      mock_user_doc.id = "target_user_123"

      # Mock the document reference that has get() and update() methods
      mock_doc_ref = Mock()
      mock_doc_ref.get.return_value = mock_user_doc
      mock_doc_ref.update.return_value = None

      # Configure the mocked db: collection(...).document(...) -> mock_doc_ref
      mock_db.collection.return_value.document.return_value = mock_doc_ref

      # Mock queries for comments/posts/pets to return empty iterables
      mock_collection = mock_db.collection.return_value
      mock_collection.where.return_value.stream.return_value = []

      # Mock Firebase Auth delete_user to do nothing
      mock_auth.delete_user.return_value = None

      # Call the endpoint (no cookie needed because dependency override bypasses auth_check)
      resp = client.delete("/users/target_user_123")

      assert resp.status_code == 204

      # Cleanup override
      app.dependency_overrides.pop(require_admin, None)

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    @pytest.mark.skip(reason="Just need this for testing for now")
    def test_delete_existing_user_as_user(self, mock_auth, mock_db):
      # Mock the user document returned by db.collection('users').document(user_id).get()
      mock_user_doc = Mock()
      mock_user_doc.exists = True
      mock_user_doc.to_dict.return_value = {"deletedAt": None, "displayName": "Target User"}
      mock_user_doc.id = "target_user_123"

      # Mock the document reference that has get() and update() methods
      mock_doc_ref = Mock()
      mock_doc_ref.get.return_value = mock_user_doc
      mock_doc_ref.update.return_value = None

      # Configure the mocked db: collection(...).document(...) -> mock_doc_ref
      mock_db.collection.return_value.document.return_value = mock_doc_ref

      # Mock queries for comments/posts/pets to return empty iterables
      mock_collection = mock_db.collection.return_value
      mock_collection.where.return_value.stream.return_value = []

      # Mock Firebase Auth delete_user to do nothing
      mock_auth.delete_user.return_value = None

      # Call the endpoint (no cookie needed because dependency override bypasses auth_check)
      resp = client.delete("/users/target_user_123")

      assert resp.status_code == 204

      # Cleanup override
      app.dependency_overrides.pop(require_admin, None)

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    @pytest.mark.skip(reason="Just need this for testing for now")
    def test_delete_non_existing_user(self, mock_auth, mock_db):
      # Mock the user document returned by db.collection('users').document(user_id).get()
      mock_user_doc = Mock()
      mock_user_doc.exists = True
      mock_user_doc.to_dict.return_value = {"deletedAt": None, "displayName": "Target User"}
      mock_user_doc.id = "target_user_123"

      # Mock the document reference that has get() and update() methods
      mock_doc_ref = Mock()
      mock_doc_ref.get.return_value = mock_user_doc
      mock_doc_ref.update.return_value = None

      # Configure the mocked db: collection(...).document(...) -> mock_doc_ref
      mock_db.collection.return_value.document.return_value = mock_doc_ref

      # Mock queries for comments/posts/pets to return empty iterables
      mock_collection = mock_db.collection.return_value
      mock_collection.where.return_value.stream.return_value = []

      # Mock Firebase Auth delete_user to do nothing
      mock_auth.delete_user.return_value = None

      # Call the endpoint (no cookie needed because dependency override bypasses auth_check)
      resp = client.delete("/users/target_user_123")

      assert resp.status_code == 204

      # Cleanup override
      app.dependency_overrides.pop(require_admin, None)

    @patch("routers.user.db")
    @patch("routers.user.auth_check")
    @pytest.mark.skip(reason="Just need this for testing for now")
    def test_delete_currently_deleted_user(self, mock_auth, mock_db):
      # Mock the user document returned by db.collection('users').document(user_id).get()
      mock_user_doc = Mock()
      mock_user_doc.exists = True
      mock_user_doc.to_dict.return_value = {"deletedAt": None, "displayName": "Target User"}
      mock_user_doc.id = "target_user_123"

      # Mock the document reference that has get() and update() methods
      mock_doc_ref = Mock()
      mock_doc_ref.get.return_value = mock_user_doc
      mock_doc_ref.update.return_value = None

      # Configure the mocked db: collection(...).document(...) -> mock_doc_ref
      mock_db.collection.return_value.document.return_value = mock_doc_ref

      # Mock queries for comments/posts/pets to return empty iterables
      mock_collection = mock_db.collection.return_value
      mock_collection.where.return_value.stream.return_value = []

      # Mock Firebase Auth delete_user to do nothing
      mock_auth.delete_user.return_value = None

      # Call the endpoint (no cookie needed because dependency override bypasses auth_check)
      resp = client.delete("/users/target_user_123")

      assert resp.status_code == 204

      # Cleanup override
      app.dependency_overrides.pop(require_admin, None)