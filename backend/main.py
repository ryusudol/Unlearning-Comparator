from fastapi import FastAPI
from app.routers import train, unlearn, inference

app = FastAPI()

app.include_router(train.router)
app.include_router(unlearn.router)
app.include_router(inference.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the ML Dashboard API"}