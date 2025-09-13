from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for Gobchat
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sender_id: str
    username: str
    message_type: str = "text"  # text, image, file
    media_data: Optional[str] = None  # base64 encoded media
    room_id: str = "global"  # for mesh networking rooms

class MessageCreate(BaseModel):
    text: str
    sender_id: str
    username: str
    message_type: str = "text"
    media_data: Optional[str] = None
    room_id: str = "global"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    device_id: str
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    is_online: bool = True

class UserCreate(BaseModel):
    username: str
    device_id: str

class MeshNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    username: str
    ip_address: Optional[str] = None
    connection_type: str  # mesh, bluetooth, wifi_direct
    last_ping: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class MeshNodeCreate(BaseModel):
    device_id: str
    username: str
    ip_address: Optional[str] = None
    connection_type: str

# Chat endpoints
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate):
    """Send a new message"""
    try:
        message_dict = message_data.dict()
        message_obj = Message(**message_dict)
        
        # Save to database
        await db.messages.insert_one(message_obj.dict())
        
        # Here we would broadcast to mesh network peers
        # For now, just return the message
        return message_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages", response_model=List[Message])
async def get_messages(room_id: str = "global", limit: int = 50):
    """Get messages from a room"""
    try:
        messages = await db.messages.find(
            {"room_id": room_id}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        # Reverse to get chronological order
        messages.reverse()
        return [Message(**msg) for msg in messages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/messages")
async def clear_messages(room_id: str = "global"):
    """Clear all messages from a room"""
    try:
        result = await db.messages.delete_many({"room_id": room_id})
        return {"deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User management endpoints
@api_router.post("/users", response_model=User)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"device_id": user_data.device_id})
        if existing_user:
            # Update last seen
            await db.users.update_one(
                {"device_id": user_data.device_id},
                {"$set": {"last_seen": datetime.utcnow(), "is_online": True}}
            )
            return User(**existing_user)
        
        user_dict = user_data.dict()
        user_obj = User(**user_dict)
        
        await db.users.insert_one(user_obj.dict())
        return user_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users", response_model=List[User])
async def get_online_users():
    """Get list of online users"""
    try:
        users = await db.users.find({"is_online": True}).to_list(100)
        return [User(**user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/users/{device_id}/status")
async def update_user_status(device_id: str, is_online: bool):
    """Update user online status"""
    try:
        result = await db.users.update_one(
            {"device_id": device_id},
            {"$set": {"is_online": is_online, "last_seen": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mesh networking endpoints
@api_router.post("/mesh/nodes", response_model=MeshNode)
async def register_mesh_node(node_data: MeshNodeCreate):
    """Register a mesh network node"""
    try:
        # Check if node already exists
        existing_node = await db.mesh_nodes.find_one({"device_id": node_data.device_id})
        if existing_node:
            # Update last ping
            await db.mesh_nodes.update_one(
                {"device_id": node_data.device_id},
                {"$set": {"last_ping": datetime.utcnow(), "is_active": True}}
            )
            return MeshNode(**existing_node)
        
        node_dict = node_data.dict()
        node_obj = MeshNode(**node_dict)
        
        await db.mesh_nodes.insert_one(node_obj.dict())
        return node_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/mesh/nodes", response_model=List[MeshNode])
async def get_mesh_nodes():
    """Get active mesh nodes"""
    try:
        nodes = await db.mesh_nodes.find({"is_active": True}).to_list(100)
        return [MeshNode(**node) for node in nodes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/mesh/nodes/{device_id}/ping")
async def ping_mesh_node(device_id: str):
    """Ping a mesh node to keep it active"""
    try:
        result = await db.mesh_nodes.update_one(
            {"device_id": device_id},
            {"$set": {"last_ping": datetime.utcnow(), "is_active": True}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Node not found")
        return {"status": "pinged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/mesh/nodes/{device_id}")
async def disconnect_mesh_node(device_id: str):
    """Disconnect a mesh node"""
    try:
        result = await db.mesh_nodes.update_one(
            {"device_id": device_id},
            {"$set": {"is_active": False}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Node not found")
        return {"status": "disconnected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "gobchat-api"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()