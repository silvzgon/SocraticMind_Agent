from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.hash import bcrypt
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum as PyEnum
from pydantic import BaseModel

DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/SocraticMind"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine,autocommit=False)
Base = declarative_base()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

class RoleEnum(PyEnum):
    USER = "user"
    ASSISTANT = "assistant"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True)
    password = Column(String(128))

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    # 关键：用String替代Enum，直接存储字符串
    role = Column(String(20), nullable=False)  # 存储'user'或'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter_by(username=request.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    hashed = bcrypt.hash(request.password)
    user = User(username=request.username, password=hashed)
    db.add(user)
    db.commit()
    return {"msg": "注册成功"}

@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=request.username).first()
    if not user or not bcrypt.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return {"msg": "登录成功", "user_id": user.id}

class ConversationCreateRequest(BaseModel):
    user_id: int
    title: str = None

@app.post("/api/conversation/create")
def create_conversation(request: ConversationCreateRequest, db: Session = Depends(get_db)):
    print("建立对话")
    conversation = Conversation(
        user_id=request.user_id,
        title=request.title or f"对话 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)  # 刷新以确保获取到 id
    print("确认conversation写入：", db.query(Conversation).filter_by(id=conversation.id).first())
    return {"conversation_id": conversation.id, "title": conversation.title}

class ConversationWithFirstMessageRequest(BaseModel):
    user_id: int
    title: str | None = None
    role: str  # "user" or "assistant"
    content: str

@app.post("/api/conversation_with_message")
def create_conversation_with_message(
    request: ConversationWithFirstMessageRequest,
    db: Session = Depends(get_db)
):
    """
    一次性创建对话 + 第一条消息
    """
    print("建立对话并保存第一条消息")
    try:
        # 1. 创建 Conversation
        conversation = Conversation(
            user_id=request.user_id,
            title=request.title or f"对话 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        # 2. 创建第一条 Message
        message = Message(
            conversation_id=conversation.id,
            role=request.role,
            content=request.content
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        return {
            "msg": "对话和消息创建成功",
            "conversation_id": conversation.id,
            "message_id": message.id,
            "title": conversation.title
        }

    except Exception as e:
        db.rollback()
        print(f"整体错误：{str(e)}")
        raise HTTPException(status_code=500, detail="创建失败")

    finally:
        db.close()


class MessageSaveRequest(BaseModel):
    conversation_id: int
    role: str
    content: str

@app.post("/api/message/save")
def save_message(request: MessageSaveRequest, db: Session = Depends(get_db)):
    print("保存消息")
    try:
        # 1. 验证对话存在性（排除外键问题）
        conversation = db.query(Conversation).get(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")

        # 2. 创建消息对象
        message = Message(
            conversation_id=request.conversation_id,
            role=request.role,  # 若用String类型，直接传字符串
            # role=RoleEnum(request.role),  # 若用枚举，需转换
            content=request.content
        )
        db.add(message)
        db.commit()  # 提交事务

        # 3. 显式刷新对象，获取id（关键：捕获刷新时的错误）
        try:
            db.refresh(message)
        except Exception as e:
            print(f"刷新对象时出错（导致回滚）：{str(e)}")  # 打印具体错误
            raise  # 触发异常，让框架处理

        return {"msg": "保存成功", "message_id": message.id}

    except Exception as e:
        db.rollback()  # 手动回滚异常事务
        print(f"整体错误：{str(e)}")
        raise HTTPException(status_code=500, detail="保存失败")

    finally:
        db.close()  # 确保会话关闭

@app.get("/api/conversation/list")
def list_conversations(user_id: int, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter_by(user_id=user_id).order_by(Conversation.created_at.desc()).all()
    return [{"id": c.id, "title": c.title, "created_at": c.created_at} for c in conversations]

@app.get("/api/message/list")
def list_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]
