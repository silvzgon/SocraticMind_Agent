import os
import re
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Enum
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.hash import bcrypt
from pydantic import BaseModel
from enum import Enum as PyEnum
import base64
import openai
import dashscope
from typing import List
from pathlib import Path
from datetime import datetime

env_file = ".env.local"
if not os.path.exists(env_file):
    raise FileNotFoundError(f"{env_file} file not exist.")

pattern = re.compile(r'^ALIBABA_API_KEY\s*=\s*["\']?(.*?)["\']?$')

with open(env_file, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        match = pattern.match(line)
        if match:
            value = match.group(1)
            os.environ["DASHSCOPE_API_KEY"] = value

# to_do: check your mysql key, port and database
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
    role = Column(String(20), nullable=False)
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
        raise HTTPException(status_code=400, detail="username already exists")
    hashed = bcrypt.hash(request.password)
    user = User(username=request.username, password=hashed)
    db.add(user)
    db.commit()
    return {"msg": "register success"}

@app.post("/api/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=request.username).first()
    if not user or not bcrypt.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="username or password is incorrect")
    return {"msg": "login success", "user_id": user.id, "user_name": user.username}

class ConversationCreateRequest(BaseModel):
    user_id: int
    title: str = None

@app.post("/api/conversation/create")
def create_conversation(request: ConversationCreateRequest, db: Session = Depends(get_db)):
    conversation = Conversation(
        user_id=request.user_id,
        title=request.title or f"对话 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
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
    try:
        conversation = Conversation(
            user_id=request.user_id,
            title=request.title or f"对话 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        message = Message(
            conversation_id=conversation.id,
            role=request.role,
            content=request.content
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        return {
            "msg": "create conversation with message success",
            "conversation_id": conversation.id,
            "message_id": message.id,
            "title": conversation.title
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="create conversation with message error")

    finally:
        db.close()


class MessageSaveRequest(BaseModel):
    conversation_id: int
    role: str
    content: str

@app.post("/api/message/save")
def save_message(request: MessageSaveRequest, db: Session = Depends(get_db)):
    try:
        conversation = db.query(Conversation).get(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="save message error: conversation not found")

        message = Message(
            conversation_id=request.conversation_id,
            role=request.role,
            # role=RoleEnum(request.role),
            content=request.content
        )
        db.add(message)
        db.commit()

        try:
            db.refresh(message)
        except Exception as e:
            raise

        return {"msg": "save message success", "message_id": message.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="save message error")

    finally:
        db.close()

@app.get("/api/conversation/list")
def list_conversations(user_id: int, db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter_by(user_id=user_id).order_by(Conversation.created_at.desc()).all()
    return [{"id": c.id, "title": c.title, "created_at": c.created_at} for c in conversations]

@app.get("/api/message/list")
def list_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class AssistantToolChatRequest(BaseModel):
    model: str
    enableCodeInterpreter : bool
    enableCalculator      : bool
    enableTextToImage     : bool
    enableQuarkSearch     : bool
    enableGenerateQRcode  : bool
    enableGithubSearch    : bool
    messages: List[ChatMessage]

def get_assistant(request: AssistantToolChatRequest):
    tools = []
    if request.enableCodeInterpreter : tools.append({"type": "code_interpreter"})
    if request.enableCalculator      : tools.append({"type": "calculator"})
    if request.enableTextToImage     : tools.append({"type": "text_to_image"})
    if request.enableQuarkSearch     : tools.append({"type": "quark_search"})
    if request.enableGenerateQRcode  : tools.append({"type": "generate_qrcode"})
    if request.enableGithubSearch    : tools.append({"type": "github_search"})

    assistant = dashscope.Assistants.create(
        model="qwen-turbo",
        name="smart helper",
        description="A tool helper.",
        api_key=os.environ["DASHSCOPE_API_KEY"],
        instructions="You are a helpful assistant. When asked a question, use tools wherever possible.",
        tools=tools,
        tool_choice="required",
    )
    if assistant.status_code != 200:
        raise Exception(f"assistant setup error, with status code: {assistant.status_code}")

    return assistant

def get_user_input(msgs):
    messages_user = [msg for msg in msgs if msg.role in ["user", "system"]]
    if not messages_user:
        return ""

    user_input_parts = []
    for msg in messages_user:
        if msg.role == 'system':
            content = msg.content
            if content:
                user_input_parts.append(f"[System]\n{content}")
    last_user_message = None
    for msg in reversed(messages_user):
        if msg.role == 'user':
            last_user_message = msg
            break
    if last_user_message:
        content = last_user_message.content
        if content:
            user_input_parts.append(f"[User]\n{content}")
    return "\n\n".join(user_input_parts)

def verify_status_code(res):
    if res.status_code != 200:
        raise Exception(f"dashscope fail with status code: {res.status_code}")

@app.post("/api/assistant_tool_chat")
def assistant_tool_chat(request: AssistantToolChatRequest):

    try:
        assistant = get_assistant(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant setup error: {e}")

    try:
        thread = dashscope.Threads.create(api_key=os.environ["DASHSCOPE_API_KEY"])
        verify_status_code(thread)

        user_input = get_user_input(request.messages)

        message = dashscope.Messages.create(thread.id, content=user_input, api_key=os.environ["DASHSCOPE_API_KEY"])
        verify_status_code(message)

        run = dashscope.Runs.create(thread.id, assistant_id=assistant.id, stream=False, api_key=os.environ["DASHSCOPE_API_KEY"])
        verify_status_code(run)

        run = dashscope.Runs.wait(run.id, thread_id=thread.id, api_key=os.environ["DASHSCOPE_API_KEY"])
        verify_status_code(run)

        msgs = dashscope.Messages.list(thread.id, api_key=os.environ["DASHSCOPE_API_KEY"])
        verify_status_code(msgs)

        answer = msgs.data[0].content[0].text.value
        return {"result": answer}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[Assistant tool] error: {e}")

@app.websocket("/ws/assistant_tool_chat_stream")
async def websocket_assistant_tool_chat_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        data = await websocket.receive_json()

        messages = data.get("messages", [])
        request = AssistantToolChatRequest(
            model = data.get("model"),
            enableCodeInterpreter = data.get("enableCodeInterpreter"),
            enableCalculator      = data.get("enableCalculator"),
            enableTextToImage     = data.get("enableTextToImage"),
            enableQuarkSearch     = data.get("enableQuarkSearch"),
            enableGenerateQRcode  = data.get("enableGenerateQRcode"),
            enableGithubSearch    = data.get("enableGithubSearch"),
            messages = messages,
        )

        try:
            assistant = get_assistant(request)
        except Exception as e:
            await websocket.send_json({"error": f"assistant setup error: {str(e)}"})
            await websocket.close()
            return

        try:
            thread = dashscope.Threads.create(api_key=os.environ["DASHSCOPE_API_KEY"])
            verify_status_code(thread)

            user_input = get_user_input(request.messages)

            message = dashscope.Messages.create(thread.id, content=user_input, api_key=os.environ["DASHSCOPE_API_KEY"])
            verify_status_code(message)

            run = dashscope.Runs.create(thread.id, assistant_id=assistant.id, stream=True, api_key=os.environ["DASHSCOPE_API_KEY"])

            for event, data in run:
                try:
                    await websocket.send_json({"chunk": data.delta.content.text.value})
                except:
                    pass

            await websocket.send_json({"chunk": "[DONE]"})
            await websocket.close()

        except Exception as e:
            await websocket.send_json({"error": f"[Assistant tool] error: {str(e)}"})
            await websocket.close()

    except WebSocketDisconnect:
        print("[Assistant tool] WebSocket disconnect")

class MultimodalToolChatRequest(BaseModel):
    model: str
    enableFileReading: bool
    enableOCR        : bool
    ocrType          : bool
    addonPath: str

@app.post("/api/multimodal_tool_chat")
def multimodal_tool_chat(request: MultimodalToolChatRequest):

    try:

        if request.enableOCR:
            image_path = request.addonPath

            if request.ocrType:
                image = image_path
            else:
                try:
                    with open(image_path, "rb") as image_file:
                        base64_image = base64.b64encode(image_file.read()).decode("utf-8")
                    format = os.path.splitext(image_path)[1][1:]
                    if format in {"jpe", "jpeg", "jpg"}: format = "jpeg"
                    if format in {"tif", "tiff"}       : format = "tiff"
                    if format not in {"bmp", "jpeg", "png", "tiff", "webp", "heic"}:
                        raise HTTPException(status_code=500, detail="[Multimodal tool] error: unsupported file format.")
                    image = f"data:image/{format};base64,{base64_image}"
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"[Multimodal tool] unable to open target path: {e}")

            messages = [{
                "role": "user",
                "content": [{
                        "image":  image,
                        "min_pixels": 28 * 28 * 4,
                        "max_pixels": 28 * 28 * 8192,
                        "enable_rotate": True,
                    },
                    {
                        "text": "请提取图像中的文字内容。要求准确无误的提取上述关键信息、不要遗漏和捏造虚假信息，模糊的单个文字可以用英文问号?代替。请你直接输出提取的文字内容，不要添加任何多余的描述。如果提取的内容中包含数学公式，请使用LaTeX语法进行描述。"
                    },],
            }]
            response = dashscope.MultiModalConversation.call(
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                model="qwen-vl-ocr",
                messages=messages,
            )
            return {"result": "图像解析结果：\n" + response["output"]["choices"][0]["message"].content[0]["text"]}

        elif request.enableFileReading:
            file_path = request.addonPath

            client = openai.OpenAI(
                api_key=os.getenv("DASHSCOPE_API_KEY"),
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            )
            file_object = client.files.create(file=Path(file_path), purpose="file-extract")

            return {"result": f'fileid://{file_object.id}'}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[Multimodal tool] error: {e}")

@app.websocket("/ws/multimodal_tool_chat_stream")
async def websocket_multimodal_tool_chat_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        data = await websocket.receive_json()

        request = MultimodalToolChatRequest(
            model = data.get("model"),
            enableFileReading = data.get("enableFileReading"),
            enableOCR         = data.get("enableOCR"),
            ocrType           = data.get("ocrType"),
            addonPath = data.get("addonPath"),
        )

        try:
            if request.enableOCR:
                image_path = request.addonPath

                if request.ocrType:
                    image = image_path
                else:
                    try:
                        with open(image_path, "rb") as image_file:
                            base64_image = base64.b64encode(image_file.read()).decode("utf-8")
                        format = os.path.splitext(image_path)[1][1:]
                        if format in {"jpe", "jpeg", "jpg"}: format = "jpeg"
                        if format in {"tif", "tiff"}       : format = "tiff"
                        if format not in {"bmp", "jpeg", "png", "tiff", "webp", "heic"}:
                            raise HTTPException(status_code=500, detail="[Multimodal tool] error: unsupported file format.")
                        image = f"data:image/{format};base64,{base64_image}"
                    except Exception as e:
                        raise HTTPException(status_code=500, detail=f"[Multimodal tool] unable to open target path: {e}")

                messages = [{
                    "role": "user",
                    "content": [{
                            "image":  image,
                            "min_pixels": 28 * 28 * 4,
                            "max_pixels": 28 * 28 * 8192,
                            "enable_rotate": True,
                        },
                        {
                            "text": "请提取图像中的文字内容。要求准确无误的提取上述关键信息、不要遗漏和捏造虚假信息，模糊的单个文字可以用英文问号?代替。请你直接输出提取的文字内容，不要添加任何多余的描述。如果提取的内容中包含数学公式，请使用LaTeX语法进行描述。"
                        },],
                }]
                responses = dashscope.MultiModalConversation.call(
                    api_key=os.getenv("DASHSCOPE_API_KEY"),
                    model="qwen-vl-ocr",
                    messages=messages,
                    stream=True,
                    incremental_output=True,
                )
                for response in responses:
                    try:
                        await websocket.send_json({"chunk": response["output"]["choices"][0]["message"].content[0]["text"]})
                    except:
                        pass

            # elif request.enableFileReading:
            #     file_path = request.addonPath

            #     client = openai.OpenAI(
            #         api_key=os.getenv("DASHSCOPE_API_KEY"),
            #         base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            #     )
            #     file_object = client.files.create(file=Path(file_path), purpose="file-extract")

            #     completion = client.chat.completions.create(
            #         model="qwen-long",
            #         messages=[
            #             {'role': 'system', 'content': 'You are a helpful assistant.'},
            #             {'role': 'system', 'content': f'fileid://{file_object.id}'},
            #             {'role': 'user', 'content': '请你分析一下这篇文档的内容，并给出一个简要的总结。'},
            #         ],
            #         stream=True,
            #         stream_options={"include_usage": True},
            #     )
            #     for chunk in completion:
            #         try: 
            #             await websocket.send_json({"chunk": chunk.choices[0].delta.content})
            #         except:
            #             pass
                
        except Exception as e:
            await websocket.send_json({"error": f"[Multimodal tool] error: {str(e)}"})
            await websocket.close()

    except WebSocketDisconnect:
        print("[Multimodal tool] WebSocket disconnect")
