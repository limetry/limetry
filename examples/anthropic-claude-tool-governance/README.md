# Anthropic Claude tool governance

Intercept Anthropic `tool_use` blocks with the [`limetry`](../../packages/sdk-python)
Python SDK before side effects run. Parity with the TypeScript OpenAI procurement example.

## Install

```bash
pip install -e ../../packages/sdk-python
pip install -r requirements.txt
```

## Pattern

```python
from governance import build_engine, govern_tool_use

engine = build_engine()
# Inside your Anthropic messages loop, for each tool_use block:
outcome = govern_tool_use(
  tool_name,
  tool_input,
  engine=engine,
  execute=run_tool,
)
if outcome["decision"] != "allow":
  # return denial / approval_required to the model
  ...
```

## Test

```bash
pytest test_governance.py
```

## Env

- `LIMETRY_API_KEY` / `LIMETRY_BEARER_TOKEN`
- `LIMETRY_BASE_URL` (default `http://localhost:3810`)
