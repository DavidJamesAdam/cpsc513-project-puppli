"""
Run with: python seed_database.py
"""
import random
from datetime import datetime
from faker import Faker
from firebase_admin import auth
from firebase_service import db

# ============================================================================
# CONFIGURATION
# ============================================================================

NUM_USERS = 25

PETS_PER_USER = (1, 1)
POSTS_PER_PET = (1, 3)

CREATE_ADMIN = True
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin123!"

WIPE_FIRST = True

fake = Faker()

# ============================================================================
# STATIC DATA
# ============================================================================

DOG_BREEDS = [
    "Golden Retriever",
    "German Shepherd",
    "Labrador Retriever",
    "Siberian Husky",
    "French Bulldog",
    "Border Collie",
    "Australian Shepherd",
    "Beagle",
    "Poodle",
    "Pembroke Welsh Corgi",
    "Bernese Mountain Dog",
    "Shiba Inu",
    "Cocker Spaniel",
    "Boxer",
]

TOYS = [
    "Tennis Ball",
    "Frisbee",
    "Rope Toy",
    "Kong",
    "Plush Toy",
    "Puzzle Feeder",
    "Squeaky Toy",
    "Chew Bone",
]

TREATS = [
    "Peanut Butter",
    "Chicken Jerky",
    "Turkey Bites",
    "Salmon Treats",
    "Bacon Strips",
    "Blueberries",
    "Apple Slices",
    "Sweet Potato Chews",
]

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
]

CANADA_LOCATIONS = {
    "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat"],
    "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Kelowna"],
    "Ontario": ["Toronto", "Ottawa", "Hamilton", "London", "Kitchener"],
    "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Sherbrooke"],
    "Nova Scotia": ["Halifax", "Sydney", "Dartmouth", "Truro", "New Glasgow"],
    "Manitoba": ["Winnipeg", "Brandon", "Steinbach", "Thompson"],
    "Saskatchewan": ["Regina", "Saskatoon", "Prince Albert", "Moose Jaw"],
    "New Brunswick": ["Fredericton", "Moncton", "Saint John", "Dieppe"],
    "Newfoundland and Labrador": ["St. John's", "Mount Pearl", "Corner Brook"],
    "Prince Edward Island": ["Charlottetown", "Summerside", "Stratford"],
    "Northwest Territories": ["Yellowknife", "Hay River", "Inuvik"],
    "Yukon": ["Whitehorse", "Dawson City"],
    "Nunavut": ["Iqaluit", "Rankin Inlet", "Arviat"]
}

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
    "https://firebasestorage.googleapis.com/v0/b/puppli-422db.firebasestorage.app/o/posts%2Fpupper.jpg?alt=media",
]

# ============================================================================
# AUTH HELPERS
# ============================================================================


def create_firebase_user(email: str, password: str) -> str:
    try:
        user = auth.create_user(
            email=email,
            password=password,
        )
        return user.uid

    except auth.EmailAlreadyExistsError:
        user = auth.get_user_by_email(email)
        return user.uid


# ============================================================================
# GENERATORS
# ============================================================================

def generate_location():
    province = random.choice(list(CANADA_LOCATIONS.keys()))
    city = random.choice(CANADA_LOCATIONS[province])

    return city, province


def generate_user():
    city, province = generate_location()

    return {
        "email": fake.unique.email(),
        "password": "Password123!",
        "displayName": fake.name(),
        "bio": fake.sentence(nb_words=10),
        "cityName": city,
        "provinceName": province,
        "role": "user",
        "totalBronze": random.randint(0, 25),
        "totalSilver": random.randint(0, 10),
        "totalGold": random.randint(0, 5),
        "createdAt": datetime.utcnow(),
        "updatedAt": None,
        "deletedAt": None,
    }


def generate_pet(user_id: str):
    birthday = fake.date_between(
        start_date="-15y",
        end_date="-6m"
    )

    return {
        "userId": user_id,
        "name": fake.first_name(),
        "breed": random.choice(DOG_BREEDS),
        "about": fake.sentence(nb_words=12),
        "birthday": birthday.isoformat(),
        "favouriteToy": random.choice(TOYS),
        "favouriteTreat": random.choice(TREATS),
    }


def generate_post(user_id: str, pet_id: str, pet_name: str):
    vote_count = random.randint(0, 150)

    return {
        "userId": user_id,
        "petId": pet_id,
        "imageUrl": random.choice(FIREBASE_STORAGE_IMAGES),
        "caption": random.choice(POST_CAPTIONS).format(
            name=pet_name
        ),
        "createdAt": fake.date_time_between(
            start_date="-90d",
            end_date="now"
        ).isoformat(),
        "voteCount": vote_count,
        "favouriteCount": random.randint(
            0,
            max(1, int(vote_count * 0.4))
        ),
        "favouritedBy": [],
        "comments": [],
    }


# ============================================================================
# SEEDING
# ============================================================================


def create_admin():
    uid = create_firebase_user(
        ADMIN_EMAIL,
        ADMIN_PASSWORD
    )

    user_data = {
        "email": ADMIN_EMAIL,
        "displayName": "Admin",
        "bio": "",
        "cityName": "",
        "provinceName": "",
        "role": "admin",
        "totalBronze": 0,
        "totalSilver": 0,
        "totalGold": 0,
        "createdAt": datetime.utcnow(),
        "updatedAt": None,
        "deletedAt": None,
    }

    db.collection("users").document(uid).set(user_data)

    print(f"Admin created: {ADMIN_EMAIL}")


def seed_database():
    total_users = 0
    total_pets = 0
    total_posts = 0

    if CREATE_ADMIN:
        create_admin()

    batch = db.batch()
    operation_count = 0

    for _ in range(NUM_USERS):
        user_data = generate_user()

        uid = create_firebase_user(
            user_data["email"],
            user_data["password"]
        )

        user_ref = db.collection("users").document(uid)

        firestore_user = {
            k: v
            for k, v in user_data.items()
            if k != "password"
        }

        batch.set(user_ref, firestore_user)

        total_users += 1
        operation_count += 1

        pet_count = random.randint(*PETS_PER_USER)

        for _ in range(pet_count):
            pet_data = generate_pet(uid)

            pet_ref = db.collection("pets").document()

            batch.set(pet_ref, pet_data)

            total_pets += 1
            operation_count += 1

            post_count = random.randint(*POSTS_PER_PET)

            for _ in range(post_count):
                post_data = generate_post(
                    uid,
                    pet_ref.id,
                    pet_data["name"]
                )

                post_ref = db.collection("posts").document()

                batch.set(post_ref, post_data)

                total_posts += 1
                operation_count += 1

                # Firestore limit: 500 operations per batch
                if operation_count >= 450:
                    batch.commit()
                    batch = db.batch()
                    operation_count = 0

    if operation_count > 0:
        batch.commit()

    print(
        f"Seed complete\n"
        f"Users: {total_users}\n"
        f"Pets: {total_pets}\n"
        f"Posts: {total_posts}"
    )

def delete_collection(collection_name: str, batch_size: int = 500):
    coll_ref = db.collection(collection_name)

    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    while True:
        batch = db.batch()
        docs = list(coll_ref.limit(batch_size).stream())

        if not docs:
            break

        for doc in docs:
            batch.delete(doc.reference)
            deleted += 1

        batch.commit()

    print(f"Deleted {deleted} documents from {collection_name}")

def wipe_database():
    print("Wiping database...")

    # Order matters if you ever add references later
    delete_collection("posts")
    delete_collection("pets")
    delete_collection("users")

    print("Database wipe complete.")


if __name__ == "__main__":
    if WIPE_FIRST:
      wipe_database()
    seed_database()