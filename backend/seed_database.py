"""
Database Seeding Script for Pet Social Media Application

This script populates Firebase Authentication and Firestore with test data:
- 5 users with Firebase Auth accounts and Firestore profiles
- 1-2 pets per user in the pets collection
- At least 1 post per pet (max 10 posts total to match available images)
- Strategic location distribution for diverse city/provincial rankings

Run with: python seed_database.py
"""

import random
from datetime import datetime, timedelta
from faker import Faker
from firebase_admin import auth
from firebase_service import db

# ============================================================================
# CONFIGURATION CONSTANTS
# ============================================================================

# Firebase Storage image URLs
FIREBASE_STORAGE_IMAGES = [
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fcute.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fcutie.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fdalm.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fdoggo.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fdoggy.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Ffluffy.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fhuskie.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fhusky.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fpupp.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fpupper.jpg?alt=media"
]

def get_pet_image_url(index=0):
    """Get a Firebase Storage image URL for posts"""
    return FIREBASE_STORAGE_IMAGES[index % len(FIREBASE_STORAGE_IMAGES)]

# Post captions templates
POST_CAPTIONS = [
    "{name} at the park today!",
    "Look at this cutie {name}!",
    "{name} being adorable as always",
    "Afternoon walk with {name}",
    "{name}'s favorite spot",
    "Can't get enough of {name}",
    "{name} living their best life",
    "Happy {name}!",
    "Play time with {name}",
    "{name} enjoying the sunshine",
    "Best friends with {name}",
    "{name} says hello!",
    "Weekend vibes with {name}",
    "Adventure time!"
]

# ============================================================================
# TEST USER DATA
# ============================================================================

TEST_USERS = [
    {
        "email": "alice.johnson@example.com",
        "password": "AlicePass123!",
        "displayName": "Alice Johnson",
        "userName": "alice.johnson",
        "bio": "Dog lover and outdoor enthusiast",
        "role": "admin",
        "totalBronze": 5,
        "totalSilver": 3,
        "totalGold": 2
    },
    {
        "email": "bob.smith@example.com",
        "password": "BobPass123!",
        "displayName": "Bob Smith",
        "userName": "bob.smith",
        "bio": "Software engineer and proud dog dad",
        "role": "user",
        "totalBronze": 8,
        "totalSilver": 4,
        "totalGold": 1
    },
    {
        "email": "charlie.brown@example.com",
        "password": "CharliePass123!",
        "displayName": "Charlie Brown",
        "userName": "charlie.brown",
        "bio": "Adventure seeker and photography lover",
        "role": "user",
        "totalBronze": 3,
        "totalSilver": 2,
        "totalGold": 0
    },
    {
        "email": "diana.prince@example.com",
        "password": "DianaPass123!",
        "displayName": "Diana Prince",
        "userName": "diana.prince",
        "bio": "Rescue dog advocate",
        "role": "user",
        "totalBronze": 10,
        "totalSilver": 5,
        "totalGold": 3
    },
    {
        "email": "ethan.hunt@example.com",
        "password": "EthanPass123!",
        "displayName": "Ethan Hunt",
        "userName": "ethan.hunt",
        "bio": "Full-time dog enthusiast",
        "role": "user",
        "totalBronze": 6,
        "totalSilver": 1,
        "totalGold": 0
    }
]

# ============================================================================
# DATA GENERATION FUNCTIONS
# ============================================================================

fake = Faker()

def create_firebase_user(email, password, display_name):
    """Create a user in Firebase Authentication"""
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        return user.uid
    except auth.EmailAlreadyExistsError:
        # If user already exists, get their UID
        user = auth.get_user_by_email(email)
        return user.uid

def generate_firestore_user(uid, user_data, user_index):
    """Generate a Firestore user document with strategic location assignment"""
    # Strategic location assignment to create diverse rankings:
    # User 1-2: Calgary, Alberta (same city, same province)
    # User 3: Edmonton, Alberta (different city, same province)
    # User 4-5: Vancouver, British Columbia (different province)
    location_strategy = {
        1: "Calgary, Alberta",
        2: "Calgary, Alberta",
        3: "Edmonton, Alberta",
        4: "Vancouver, British Columbia",
        5: "Vancouver, British Columbia"
    }

    return {
        "uid": uid,
        "email": user_data["email"],
        "displayName": user_data["displayName"],
        "userName": user_data["userName"],
        "bio": user_data["bio"],
        "location": location_strategy[user_index],  # Fixed location for each user
        "role": user_data["role"],
        "totalBronze": user_data["totalBronze"],
        "totalSilver": user_data["totalSilver"],
        "totalGold": user_data["totalGold"],
        "createdAt": datetime.now()
    }

# Fixed pet data (up to 10 unique pets with deterministic attributes)
FIXED_PETS = [
    {"name": "Bella", "breed": "Golden Retriever", "toy": "Tennis ball", "treat": "Peanut butter", "age_days": 730},
    {"name": "Max", "breed": "German Shepherd", "toy": "Rope toy", "treat": "Chicken jerky", "age_days": 1095},
    {"name": "Luna", "breed": "Siberian Husky", "toy": "Frisbee", "treat": "Salmon treats", "age_days": 365},
    {"name": "Charlie", "breed": "Labrador Retriever", "toy": "Kong toy", "treat": "Bacon strips", "age_days": 1825},
    {"name": "Lucy", "breed": "French Bulldog", "toy": "Squeaky toy", "treat": "Cheese cubes", "age_days": 548},
    {"name": "Cooper", "breed": "Beagle", "toy": "Puzzle feeder", "treat": "Turkey bites", "age_days": 912},
    {"name": "Daisy", "breed": "Pembroke Welsh Corgi", "toy": "Plush toy", "treat": "Sweet potato chews", "age_days": 1460},
    {"name": "Milo", "breed": "Poodle", "toy": "Chew bone", "treat": "Apple slices", "age_days": 456},
    {"name": "Bailey", "breed": "Australian Shepherd", "toy": "Crinkle ball", "treat": "Blueberries", "age_days": 1200},
    {"name": "Buddy", "breed": "Border Collie", "toy": "Ball launcher", "treat": "Carrot sticks", "age_days": 2190}
]

def generate_pet(user_id, pet_index):
    """Generate a pet document with fixed attributes"""
    # Use fixed pet data based on index
    pet_template = FIXED_PETS[pet_index % len(FIXED_PETS)]

    # Calculate birthday from fixed age
    birthday = (datetime.now() - timedelta(days=pet_template["age_days"])).strftime("%Y-%m-%d")

    return {
        "userId": user_id,
        "name": pet_template["name"],
        "breed": pet_template["breed"],
        "about": fake.sentence(nb_words=12),
        "birthday": birthday,
        "favouriteToy": pet_template["toy"],
        "favouriteTreat": pet_template["treat"]
    }

def generate_post(user_id, pet_id, pet_name, post_index):
    """Generate a post document"""
    # Random date within last 90 days
    days_ago = random.randint(0, 90)
    created_at = datetime.now() - timedelta(days=days_ago)

    # Generate vote counts with realistic distribution
    vote_distribution = [
        (0, 20, 0.4),    # 40% of posts have 0-20 votes
        (21, 50, 0.3),   # 30% have 21-50 votes
        (51, 80, 0.2),   # 20% have 51-80 votes
        (81, 150, 0.1)   # 10% have 81-150 votes
    ]

    rand = random.random()
    cumulative = 0
    vote_count = 0

    for min_votes, max_votes, probability in vote_distribution:
        cumulative += probability
        if rand <= cumulative:
            vote_count = random.randint(min_votes, max_votes)
            break

    # Favourite count is typically 20-40% of vote count
    favourite_count = int(vote_count * random.uniform(0.2, 0.4))

    caption = random.choice(POST_CAPTIONS).format(name=pet_name)

    return {
        "userId": user_id,
        "petId": pet_id,
        "imageUrl": get_pet_image_url(post_index),
        "caption": caption,
        "createdAt": created_at.isoformat() + "Z",
        "voteCount": vote_count,
        "favouriteCount": favourite_count,
        "favouritedBy": [],  # Empty initially
        "comments": []  # Empty initially
    }

# ============================================================================
# MAIN SEEDING LOGIC
# ============================================================================

def seed_database():
    """Main function to seed the database"""
    all_users = []
    all_pets = []
    all_posts = []

    # Create users in Firebase Auth and Firestore
    for i, user_data in enumerate(TEST_USERS, start=1):
        # Create user in Firebase Authentication
        uid = create_firebase_user(
            user_data["email"],
            user_data["password"],
            user_data["displayName"]
        )

        # Generate Firestore user document
        firestore_user_data = generate_firestore_user(uid, user_data, i)

        # Store user reference with UID as document ID
        user_ref = db.collection('users').document(uid)
        all_users.append({
            "ref": user_ref,
            "data": firestore_user_data,
            "uid": uid
        })

    # Create exactly 10 pets (2 per user)
    pet_counter = 0
    for user in all_users:
        for _ in range(2):  # Exactly 2 pets per user
            pet_data = generate_pet(user["uid"], pet_counter)
            pet_ref = db.collection('pets').document()
            pet_id = pet_ref.id

            all_pets.append({
                "id": pet_id,
                "data": pet_data,
                "ref": pet_ref,
                "user_id": user["uid"]
            })

            pet_counter += 1

    # Create exactly 10 posts (1 per pet)
    for i, pet in enumerate(all_pets):
        post_data = generate_post(
            pet["user_id"],
            pet["id"],
            pet["data"]["name"],
            i
        )
        post_ref = db.collection('posts').document()

        all_posts.append({
            "ref": post_ref,
            "data": post_data
        })

    # Write all data to Firestore
    for user in all_users:
        user["ref"].set(user["data"])

    for pet in all_pets:
        pet["ref"].set(pet["data"])

    for post in all_posts:
        post["ref"].set(post["data"])

    print(f"Added {len(all_users)} users, {len(all_pets)} pets, {len(all_posts)} posts")

if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        print(f"\nError seeding database: {e}")
        raise
