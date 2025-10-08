import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from typing import Union, Any
import logging

# Load environment variables
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, '.env'))

# MongoDB connection for STC_Employees (attendance_client)
attendance_mongo_url = "mongodb+srv://poori420:5imYVGkw7F0cE5K2@cluster0.53oeybd.mongodb.net/"
attendance_client = AsyncIOMotorClient(attendance_mongo_url, tlsAllowInvalidCertificates=True)
stc_db = attendance_client['STC_Employees']

# Define IST timezone
ist_tz = timezone(timedelta(hours=5, minutes=30))

TEAMS = [
    "Research",
    "Media",
    "Data",
    "Digital Production",
    "Digital Communication",
    "Propagation",
    "Neagitive Propagation",
    "Digital Marketing/Networking",
    "HIVE",
    "Campaign",
    "Soul Central",
    "Field Team AP-1",
    "Field Team AP-2",
    "Field Team TG",
    "PMU",
    "Directors Team-1",
    "Directors Team-2",
    "HR",
    "Directors Team-3",
    "Operations",
    "System Admin"
]

def sanitize_team(team: str) -> str:
    """Sanitize team name for MongoDB collection name."""
    sanitized = team.replace(" ", "_").replace("/", "_").replace("-", "_")
    return sanitized

async def get_user_info_with_collection(stc_db, user_id: str) -> tuple[Union[dict, None], Union[Any, None]]:
    """Get user info and their collection by id or email."""
    collection_names = await stc_db.list_collection_names()
    for name in collection_names:
        collection = stc_db[name]
        user = await collection.find_one({"id": user_id})
        if user:
            return user, collection
        user = await collection.find_one({"email": user_id})
        if user:
            return user, collection
    return None, None

async def update_employee_reviewers():
    """
    Fetches all employees from the stc-db database, calculates their reviewer,
    and updates the 'reviewer' field in the database.
    """
    logging.info("Starting reviewer update process...")
    try:
        # 1. Collect all employees from all collections in stc-db
        all_employees_dict = {}
        collection_names = await stc_db.list_collection_names()
        logging.info(f"Found collections: {collection_names}")

        for name in collection_names:
            collection = stc_db[name]
            users = await collection.find({}, {"password_hash": 0}).to_list(None)
            for user in users:
                if user.get("email"):
                    all_employees_dict[user["email"]] = user
        
        all_employees = list(all_employees_dict.values())
        logging.info(f"Fetched {len(all_employees)} unique employees from the database.")

        # 2. Define the reviewer hierarchy based on the provided data
        # This map defines the reviewer for each team's reporting manager.
        reporting_manager_reviewers_map = {
            "Research": "Alimpan Banerjee , Anant Tiwari",
            "Media": "Anant Tiwari",
            "Data": "Anant Tiwari",
            "Digital Production": "Anant Tiwari",
            "Digital Communication": "Anant Tiwari",
            "Propagation": "Lokesh Mathur",
            "Neagitive Propagation": "Anant Tiwari",
            "Digital Marketing/Networking": "Saumitra, Anurag",
            "HIVE": "Anant Tiwari",
            "Campaign": "Anant Tiwari, Alimpan Banerjee",
            "Soul Central": "Alimpan Banerjee",
            "Field Team AP-1": "Alimpan Banerjee",
            "Field Team AP-2": "Alimpan Banerjee",
            "Field Team TG": "Alimpan Banerjee",
            "PMU": "Alimpan Banerjee",
            "Directors Team-1": "Anant Tiwari, Alimpan Banerjee",
            "Directors Team-2": "Anant Tiwari, Alimpan Banerjee",
            "Directors Team-3": "Anant Tiwari, Alimpan Banerjee",
            "HR": "Robbin Sharma, Anant Tiwari, Alimpan Banerjee, Khushboo Sharma",
            "Operations": "Robbin Sharma, Anant Tiwari, Alimpan Banerjee, Khushboo Sharma",
            "System Admin": "Management"
        }

        # Find the reporting manager for each team from the employee list
        team_to_reporting_manager_map = {
            emp['team']: emp['name']
            for emp in all_employees
            if emp.get('team') and emp.get('designation', '').lower().strip() == 'reporting manager'
        }

        updated_count = 0
        for emp in all_employees:
            new_reviewer = emp.get("reviewer") # Start with the current value
            designation = emp.get("designation", "").lower().strip()
            team = emp.get("team")
            
            if designation == "reporting manager":
                # A reporting manager's reviewer is from the map.
                new_reviewer = reporting_manager_reviewers_map.get(team, "Management")
            elif designation == "employee":
                # An employee's reviewer is their team's reporting manager.
                new_reviewer = team_to_reporting_manager_map.get(team)

            if not new_reviewer:
                new_reviewer = "Not Assigned"

            current_reviewer_in_db = emp.get("reviewer")
            # 3. Update the employee record in the database if the reviewer has changed
            if new_reviewer != current_reviewer_in_db:
                _user, collection = await get_user_info_with_collection(stc_db, emp["email"])
                if collection is not None:
                    result = await collection.update_one(
                        {"email": emp["email"]},
                        {"$set": {"reviewer": new_reviewer}}
                    )
                    if result.modified_count > 0:
                        updated_count += 1
                        logging.info(f"Updated reviewer for {emp.get('name')} from '{current_reviewer_in_db}' to '{new_reviewer}'")

        logging.info(f"\nReviewer update process completed. {updated_count} employees updated.")

    except Exception as e:
        logging.error(f"An error occurred during the reviewer update process: {e}", exc_info=True)

if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    asyncio.run(update_employee_reviewers())
