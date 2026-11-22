# FastAPI action middleware gate

Evaluate mutating FastAPI routes with the [`limetry`](../../packages/sdk-python)
Python SDK before handlers run. Deny → 403; approval_required → 202.

## Install

```bash
pip install -e ../../packages/sdk-python
pip install -r requirements.txt
```

## Run

```bash
uvicorn app:app --reload
```

## Test

```bash
pytest test_app.py
```
