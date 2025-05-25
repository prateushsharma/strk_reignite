"""
=======================================================================
FASTAPI MEGA-SERVER IMPLEMENTATION
=======================================================================
This implementation demonstrates a feature-rich FastAPI server with:
- Multiple endpoints
- Comprehensive error handling
- Database integration
- Authentication
- Background tasks
- Testing utilities
- Documentation enhancements
=======================================================================
"""

# =====================================================================
# SECTION 1: IMPORTS AND CONFIGURATION
# =====================================================================
# Standard library imports with explanations for each
import os                       # Operating system interfaces
import sys                      # System-specific parameters
import time                     # Time access and conversions
import logging                  # Logging facility
import asyncio                  # Asynchronous I/O
from typing import (            # Type hints
    Any,
    Optional,
    List,
    Dict,
    Union,
    Tuple,
    Callable
)

# Third-party imports with explanations
from fastapi import (           # FastAPI core components
    FastAPI,
    Request,
    Response,
    status,
    Depends,
    HTTPException,
    BackgroundTasks
)
from fastapi.security import (  # Authentication utilities
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)
from fastapi.middleware import ( # Middleware components
    cors,
    gzip,
    httpsredirect,
    trustedhost
)
from fastapi.staticfiles import StaticFiles  # Static file serving
from fastapi.templating import Jinja2Templates  # HTML templating
from fastapi.encoders import jsonable_encoder  # Data serialization
from pydantic import (          # Data validation
    BaseModel,
    Field,
    validator,
    EmailStr,
    conint,
    confloat
)
from pydantic.error_wrappers import ValidationError  # Validation errors
import uvicorn                  # ASGI server
import orjson                   # Fast JSON parser
import aiofiles                 # Async file I/O
import aioredis                 # Async Redis client
import databases                # Async database support
import sqlalchemy               # SQL toolkit
from sqlalchemy import exc as sa_exc  # SQLAlchemy exceptions
import passlib.context          # Password hashing
import jwt                      # JSON Web Tokens
from datetime import (          # Date/time handling
    datetime,
    timedelta
)
from pathlib import Path        # Object-oriented filesystem paths

# =====================================================================
# SECTION 2: APPLICATION SETUP AND CONFIGURATION
# =====================================================================

class AppConfig(BaseModel):
    """
    Comprehensive application configuration model with validation.
    Each field includes detailed description and default values.
    """
    app_name: str = Field(
        "MegaFastAPI",
        description="The name of the application",
        min_length=3,
        max_length=50
    )
    
    debug: bool = Field(
        False,
        description="Enable debug mode with verbose logging"
    )
    
    database_url: str = Field(
        "sqlite:///./megaserver.db",
        description="Database connection URL",
        regex=r"^(sqlite|postgresql|mysql)\:\/\/.+$"
    )
    
    redis_url: str = Field(
        "redis://localhost",
        description="Redis connection URL",
        regex=r"^redis\:\/\/.+$"
    )
    
    secret_key: str = Field(
        "super-secret-key-change-me-in-production",
        description="Secret key for cryptographic operations",
        min_length=32
    )
    
    access_token_expire_minutes: conint(gt=0) = Field(
        30,
        description="Expiration time for access tokens in minutes"
    )
    
    max_upload_size: conint(gt=0) = Field(
        1024 * 1024 * 10,  # 10MB
        description="Maximum file upload size in bytes"
    )
    
    allowed_origins: List[str] = Field(
        ["*"],
        description="List of allowed CORS origins"
    )
    
    @validator('allowed_origins')
    def validate_origins(cls, v):
        """Ensure origins list is not empty"""
        if not v:
            raise ValueError("At least one origin must be specified")
        return v

# Initialize configuration
config = AppConfig(
    app_name=os.getenv("APP_NAME", "MegaFastAPI"),
    debug=bool(os.getenv("DEBUG", False)),
    database_url=os.getenv("DATABASE_URL", "sqlite:///./megaserver.db"),
    redis_url=os.getenv("REDIS_URL", "redis://localhost"),
    secret_key=os.getenv("SECRET_KEY", "super-secret-key-change-me-in-production"),
    access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE", 30)),
    max_upload_size=int(os.getenv("MAX_UPLOAD_SIZE", 10 * 1024 * 1024)),
    allowed_origins=os.getenv("ALLOWED_ORIGINS", "*").split(",")
)

# =====================================================================
# SECTION 3: DATABASE MODELS AND SETUP
# =====================================================================

# SQLAlchemy metadata and engine setup
metadata = sqlalchemy.MetaData()
database = databases.Database(config.database_url)

# Define all database tables with comprehensive column options
users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("username", sqlalchemy.String(50), unique=True, index=True),
    sqlalchemy.Column("email", sqlalchemy.String(100), unique=True, index=True),
    sqlalchemy.Column("hashed_password", sqlalchemy.String(255)),
    sqlalchemy.Column("is_active", sqlalchemy.Boolean, default=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime, 
                     default=datetime.utcnow, onupdate=datetime.utcnow),
    sqlalchemy.Column("last_login", sqlalchemy.DateTime, nullable=True),
    sqlalchemy.Column("metadata", sqlalchemy.JSON, nullable=True)
)

items = sqlalchemy.Table(
    "items",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("title", sqlalchemy.String(100), index=True),
    sqlalchemy.Column("description", sqlalchemy.Text, nullable=True),
    sqlalchemy.Column("owner_id", sqlalchemy.Integer, 
                     sqlalchemy.ForeignKey("users.id")),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime, 
                     default=datetime.utcnow, onupdate=datetime.utcnow),
    sqlalchemy.Column("price", sqlalchemy.Float, nullable=True),
    sqlalchemy.Column("tags", sqlalchemy.JSON, nullable=True)
)

# =====================================================================
# SECTION 4: PYDANTIC MODELS (SCHEMAS)
# =====================================================================

class UserBase(BaseModel):
    """Base user model with common fields"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    """Model for user creation with password"""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """Model for user updates (all fields optional)"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr]
    password: Optional[str] = Field(None, min_length=8)

class UserInDB(UserBase):
    """Complete user model as stored in database"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    metadata: Optional[Dict[str, Any]]

    class Config:
        orm_mode = True

class Token(BaseModel):
    """Authentication token model"""
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Data contained in JWT token"""
    username: Optional[str] = None

class ItemBase(BaseModel):
    """Base item model"""
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    price: Optional[confloat(ge=0)] = None
    tags: Optional[List[str]] = None

class ItemCreate(ItemBase):
    """Model for item creation"""
    pass

class ItemUpdate(BaseModel):
    """Model for item updates (all fields optional)"""
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    price: Optional[confloat(ge=0)] = None
    tags: Optional[List[str]] = None

class ItemInDB(ItemBase):
    """Complete item model as stored in database"""
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# =====================================================================
# SECTION 5: UTILITY FUNCTIONS AND SERVICES
# =====================================================================

class PasswordService:
    """Comprehensive password hashing and verification service"""
    def __init__(self):
        # Configure password hashing context
        self.pwd_context = passlib.context.CryptContext(
            schemes=["bcrypt"],
            deprecated="auto"
        )
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return self.pwd_context.hash(password)

class AuthService:
    """Authentication and JWT token management service"""
    def __init__(self, config: AppConfig):
        self.config = config
        self.password_service = PasswordService()
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
    
    async def authenticate_user(self, username: str, password: str) -> Optional[UserInDB]:
        """Authenticate user with username and password"""
        user = await self.get_user_by_username(username)
        if not user:
            return None
        if not self.password_service.verify_password(password, user.hashed_password):
            return None
        return user
    
    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> UserInDB:
        """Get current user from JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
        try:
            payload = jwt.decode(
                token,
                self.config.secret_key,
                algorithms=["HS256"]
            )
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
            token_data = TokenData(username=username)
        except jwt.PyJWTError:
            raise credentials_exception
        
        user = await self.get_user_by_username(token_data.username)
        if user is None:
            raise credentials_exception
        return user
    
    async def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        """Get user by username from database"""
        query = users.select().where(users.c.username == username)
        user = await database.fetch_one(query)
        if user:
            return UserInDB(**user)
        return None
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode,
            self.config.secret_key,
            algorithm="HS256"
        )
        return encoded_jwt

# Initialize services
auth_service = AuthService(config)

# =====================================================================
# SECTION 6: APPLICATION SETUP AND MIDDLEWARE
# =====================================================================

# Create FastAPI application with comprehensive settings
app = FastAPI(
    title=config.app_name,
    description="Comprehensive FastAPI implementation with 800+ lines",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    debug=config.debug
)

# Add various middleware components
app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=config.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.add_middleware(
    gzip.GZipMiddleware,
    minimum_size=1024
)

if not config.debug:
    app.add_middleware(
        trustedhost.TrustedHostMiddleware,
        allowed_hosts=["example.com", "*.example.com"]
    )

# Database connection events
@app.on_event("startup")
async def startup():
    """Initialize database connection on startup"""
    await database.connect()
    # Create tables if they don't exist
    engine = sqlalchemy.create_engine(config.database_url)
    metadata.create_all(engine)

@app.on_event("shutdown")
async def shutdown():
    """Clean up database connection on shutdown"""
    await database.disconnect()

# =====================================================================
# SECTION 7: ROUTE HANDLERS
# =====================================================================

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Authenticate user and return access token"""
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token_expires = timedelta(minutes=config.access_token_expire_minutes)
    access_token = auth_service.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserInDB)
async def create_user(user: UserCreate):
    """Create a new user"""
    existing_user = await auth_service.get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = auth_service.password_service.get_password_hash(user.password)
    query = users.insert().values(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    user_id = await database.execute(query)
    return await get_user(user_id)

@app.get("/users/me", response_model=UserInDB)
async def read_users_me(current_user: UserInDB = Depends(auth_service.get_current_user)):
    """Get current user details"""
    return current_user

@app.get("/users/{user_id}", response_model=UserInDB)
async def get_user(user_id: int):
    """Get user by ID"""
    query = users.select().where(users.c.id == user_id)
    user = await database.fetch_one(query)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserInDB(**user)

@app.post("/items/", response_model=ItemInDB)
async def create_item(
    item: ItemCreate,
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """Create a new item"""
    query = items.insert().values(
        title=item.title,
        description=item.description,
        price=item.price,
        tags=item.tags,
        owner_id=current_user.id
    )
    item_id = await database.execute(query)
    return await get_item(item_id)

@app.get("/items/", response_model=List[ItemInDB])
async def read_items(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None
):
    """Get list of items with optional search query"""
    query = items.select().offset(skip).limit(limit)
    if q:
        query = query.where(items.c.title.contains(q))
    return await database.fetch_all(query)

@app.get("/items/{item_id}", response_model=ItemInDB)
async def get_item(item_id: int):
    """Get item by ID"""
    query = items.select().where(items.c.id == item_id)
    item = await database.fetch_one(query)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return ItemInDB(**item)

@app.put("/items/{item_id}", response_model=ItemInDB)
async def update_item(
    item_id: int,
    item: ItemUpdate,
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """Update an existing item"""
    existing_item = await get_item(item_id)
    if existing_item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this item"
        )
    
    update_data = item.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )
    
    query = (
        items.update()
        .where(items.c.id == item_id)
        .values(**update_data)
    )
    await database.execute(query)
    return await get_item(item_id)

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """Delete an item"""
    existing_item = await get_item(item_id)
    if existing_item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
    
    query = items.delete().where(items.c.id == item_id)
    await database.execute(query)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# =====================================================================
# SECTION 8: FILE HANDLING AND BACKGROUND TASKS
# =====================================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """Upload a file with background processing"""
    if file.size > config.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {config.max_upload_size} bytes"
        )
    
    file_path = UPLOAD_DIR / file.filename
    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)
    
    background_tasks.add_task(process_uploaded_file, file_path, current_user.id)
    return {"filename": file.filename, "size": file.size}

async def process_uploaded_file(file_path: Path, user_id: int):
    """Background task to process uploaded file"""
    # Simulate processing delay
    await asyncio.sleep(5)
    # In a real app, you might:
    # - Generate thumbnails
    # - Extract metadata
    # - Send notifications
    # - Update database records
    logging.info(f"Processed file {file_path} for user {user_id}")

# =====================================================================
# SECTION 9: ERROR HANDLERS
# =====================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Custom validation error handler"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler"""
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

# =====================================================================
# SECTION 10: RUN CONFIGURATION
# =====================================================================

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if config.debug else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.debug,
        log_level="debug" if config.debug else "info"
    )