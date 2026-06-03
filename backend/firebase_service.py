import firebase_admin # type: ignore (installed in venv)
from firebase_admin import credentials, firestore # type: ignore (installed in venv)
import os
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    """Initialize Firebase Admin SDK and return Firestore client

    Resolution order:
    1. Use path in `GOOGLE_APPLICATION_CREDENTIALS` env var (if set)
    2. Use path in `FIREBASE_SERVICE_ACCOUNT` env var (if set)
    3. Use `backend/keys/service_account.json` if it exists
    4. If `backend/keys` contains exactly one .json file, use that
    """
    try:
        # 1/2 - env var overrides
        # env_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS') or os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        env_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        # if env_path:
        #     cred_path = env_path
        # else:
            # # 3 - default name
            # keys_dir = os.path.join(os.path.dirname(__file__), 'keys')
            # default_path = os.path.join(keys_dir, 'service_account.json')
            # if os.path.isfile(default_path):
            #     cred_path = default_path
            # else:
            #     # 4 - try to pick a single json in keys dir
            #     pattern = os.path.join(keys_dir, '*.json')
            #     matches = glob.glob(pattern)
            #     if len(matches) == 1:
            #         cred_path = matches[0]
            #     else:
            #         raise FileNotFoundError(
            #             f"No Firebase service account found. Looked for: {default_path}. "
            #             f"Set the env var GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT, "
            #             f"or place a single JSON file in {keys_dir}. Found: {matches}"
            #         )

        # Initialize Firebase Admin
        cred = credentials.Certificate(env_path)
        firebase_admin.initialize_app(cred)

        print(f"Firebase Admin SDK initialized successfully using {env_path}")
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise


# Initialize Firestore client
db = initialize_firebase()
