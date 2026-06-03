import pytest
from unittest.mock import patch
from pathlib import Path
import sys


# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def mock_firebase_db():
    """Mock Firebase Firestore database"""
    with patch("firebase_service.db") as mock_db:
        yield mock_db


@pytest.fixture
def mock_auth():
    """Mock Firebase Authentication"""
    with patch("firebase_admin.auth") as mock_auth:
        yield mock_auth


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "email": "testuser@example.com",
        "displayName": "Test User",
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
def sample_admin_data():
    """Sample admin user data for testing"""
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


@pytest.fixture
def authenticated_user():
    """Sample authenticated user from auth_check"""
    return {"uid": "test_user_123", "email": "testuser@example.com"}


@pytest.fixture
def authenticated_admin():
    """Sample authenticated admin from auth_check"""
    return {"uid": "admin_user_456", "email": "admin@example.com"}
