from fastapi import FastAPI
from app.routers import train, unlearn

app = FastAPI()

app.include_router(train.router)
app.include_router(unlearn.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the ML Dashboard API"}