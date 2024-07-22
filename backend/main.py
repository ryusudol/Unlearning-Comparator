from fastapi import FastAPI
from app.routers import train, unlearn, inference, trained_models

app = FastAPI()

app.include_router(train.router)
app.include_router(unlearn.router)
app.include_router(inference.router)
app.include_router(trained_models.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the ML Dashboard API"}