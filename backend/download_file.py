from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
import io

router = APIRouter(prefix="/api")

# MongoDB connection for GridFS
attendance_mongo_url = "mongodb+srv://poori420:5imYVGkw7F0cE5K2@cluster0.53oeybd.mongodb.net/"
attendance_client = AsyncIOMotorClient(attendance_mongo_url, tlsAllowInvalidCertificates=True)
chat_db = attendance_client['Internal_communication']
fs = AsyncIOMotorGridFSBucket(chat_db)

@router.get("/files/download/{file_id}")
async def download_file_from_db(file_id: str, original_filename: str = Query(None)):
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    grid_out = await fs.open_download_stream(oid)
    
    if not grid_out:
        raise HTTPException(status_code=404, detail="File not found in database")

    download_filename = original_filename if original_filename else grid_out.filename
    media_type = grid_out.metadata.get("contentType", "application/octet-stream")

    # Create an async generator to stream the file chunks
    async def stream_file_chunks():
        # The grid_out object from motor is an async iterator
        async for chunk in grid_out:
            yield chunk

    return StreamingResponse(
        stream_file_chunks(),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{download_filename}\"",
            # This header is crucial for cross-origin file downloads
            "Access-Control-Expose-Headers": "Content-Disposition"
        },
    )
