import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone

ROOT_DIR = Path(__file__).parent
# Load environment variables
from dotenv import load_dotenv
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection for the Attendance database
attendance_mongo_url = "mongodb+srv://poori420:5imYVGkw7F0cE5K2@cluster0.53oeybd.mongodb.net/"
attendance_client = AsyncIOMotorClient(attendance_mongo_url, tlsAllowInvalidCertificates=True)

# Correct the database name to 'employee_attendance'
attendance_db = attendance_client['employee_attendance']

# Define IST timezone
ist_tz = timezone(timedelta(hours=5, minutes=30))

async def fix_dates():
    collection = attendance_db['Attendance']
    cursor = collection.find({})
    async for doc in cursor:
        emp_code = doc['empCode']
        daily_records = doc.get('dailyRecords', [])
        updated_records = []
        for record in daily_records:
            date = record['date']
            if isinstance(date, str):
                date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            if isinstance(date, datetime):
                if date.tzinfo is None:
                    date = date.replace(tzinfo=timezone.utc)
                date_ist = date.astimezone(ist_tz)
                date_part = date_ist.date()
                new_date = datetime.combine(date_part, datetime.min.time()).replace(tzinfo=timezone.utc)
                updated_record = record.copy()
                updated_record['date'] = new_date
                updated_records.append(updated_record)
            else:
                updated_records.append(record)
        if updated_records:
            await collection.update_one(
                {'empCode': emp_code},
                {'$set': {'dailyRecords': updated_records}}
            )
            print(f"Updated {emp_code}")

import asyncio
asyncio.run(fix_dates())
