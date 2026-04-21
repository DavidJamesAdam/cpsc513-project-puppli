# Backend

## Setup

1. Store your service account key JSON file in the `keys/` folder
   - MUST Ensure the `keys/` folder is listed in `.gitignore` to prevent committing sensitive credentials

## Running the Backend

1. Navigate to the backend directory:
   cd backend

2. Start the FastAPI development server:
   python -m fastapi dev main.py --port 8000

## Database Setup

The `seed_database.py` script populates the Firestore database with initial test data for development purposes (5 users, 10 pets, 10 posts).

The `clear_database.py` script is for **testing purposes only** and removes all documents from specified Firestore collections (users, pets, posts).

### Seed Data Structures

**User:**
```json
{
  "usernameLower": "string",
  "email": "string",
  "displayName": "string",
  "avatarUrl": "string",
  "bio": "string",
  "location": "string",
  "totalGold": 0,
  "totalSilver": 0,
  "totalBronze": 0,
  "notificationsEnabled": true/false
}
```

**Pet:**
```json
{
  "UserId": "string",
  "name": "string",
  "breed": "string",
  "birthday": "YYYY-MM-DD",
  "favouriteTreat": "string",
  "favouriteToy": "string",
  "about": "string"
}
```

**Post:**
```json
{
  "UserId": "string",
  "petId": "string",
  "imageUrl": "string",
  "caption": "string",
  "createdAt": "ISO8601 timestamp",
  "voteCount": 0,
  "favouriteCount": 0
}
```
