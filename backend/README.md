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
hatch shell
hatch run start

Swagger - http://127.0.0.1:8000/docs
e.g. 

POST /train
{
  "seed": 42,
  "batch_size": 64,
  "learning_rate": 0.001,
  "epochs": 10
}

GET /status
```
Docs: http://127.0.0.1:8000/docs