from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, projects, files, experiments, reports, chat, literature, bookmarks, activity


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="ATLAS - AI-Powered Tool for Literature & Analytical Studies",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(files.router)
app.include_router(experiments.router)
app.include_router(reports.router)
app.include_router(chat.router)
app.include_router(literature.router)
app.include_router(bookmarks.router)
app.include_router(activity.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "name": "ATLAS"}
