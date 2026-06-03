# Backend Unit Tests

This directory contains unit tests for the Puppli backend API.

## Setup

1. Install test dependencies:
```bash
pip install -r requirements.txt
```

The requirements include:
- `pytest` - Testing framework
- `pytest-asyncio` - Support for async test functions
- `httpx` - HTTP client for testing FastAPI endpoints

## Running Tests

### Run all tests:
```bash
pytest
```

### Run tests with verbose output:
```bash
pytest -v
```

### Run specific test file:
```bash
pytest tests/test_user_routers.py
```

### Run specific test class:
```bash
pytest tests/test_user_routers.py::TestGetUserEndpoint
```

### Run specific test:
```bash
pytest tests/test_user_routers.py::TestGetUserEndpoint::test_get_user_as_regular_user_own_profile
```

### Run tests with coverage:
```bash
pip install pytest-cov
pytest --cov=routers --cov-report=html
```

## Test Structure

- `conftest.py` - Shared fixtures and test configuration
- `test_user_routers.py` - Tests for user router endpoints
  - `TestGetUserEndpoint` - Tests for GET /users/{user_id} endpoint
  - `TestGetCurrentUserEndpoint` - Tests for GET /users/me endpoint

## Test Coverage

### Current Tests

#### TestGetUserEndpoint
- ✅ Regular user can retrieve their own profile
- ✅ Admin can retrieve any user's profile
- ✅ Deleted user returns 404
- ✅ Non-existent user handling
- ✅ Unauthenticated access fails
- ✅ All expected fields are returned
- ✅ Database errors are handled gracefully

#### TestGetCurrentUserEndpoint
- ✅ Successfully retrieve authenticated user's profile

## Mocking Strategy

Tests use Python's `unittest.mock` to mock:
- Firebase Firestore database (`db`)
- Firebase Authentication (`auth`)
- FastAPI dependencies (`auth_check`, `require_admin`)

This allows tests to run without actual Firebase credentials or a real database.

## Notes

- Tests use `TestClient` from FastAPI for endpoint testing
- Mocks ensure tests don't make actual Firebase calls
- Each test is independent and can run in any order
- Use fixtures from `conftest.py` to avoid code duplication
