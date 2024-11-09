from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import train, unlearn, models, data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=["http://localhost:3000"], # TODO: 배포 후 URL 수정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(train.router)
app.include_router(unlearn.router)
app.include_router(models.router)
app.include_router(data.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the ML Dashboard API"}