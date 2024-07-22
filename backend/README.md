# machine-unlearning-dashboard
machine-unlearning-dashboard

## Development

Install [pnpm](https://pnpm.io/installation) to set up the development environment.

```shell
git clone https://github.com/gnueaj/mu-dashboard.git && cd mu-dashboard/frontend
pnpm install
pnpm dev
```

## Backend
```shell
cd backend
hatch shell
hatch run start

Swagger - http://127.0.0.1:8000/docs
e.g. 

POST /train
{
  "seed": 42,
  "batch_size": 128,
  "learning_rate": 0.002,
  "epochs": 10
}

GET /status
```
API 추가할 때: router -> service -> main 순 구현
Swagger: http://127.0.0.1:8000/docs