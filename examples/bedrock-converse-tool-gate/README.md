# Bedrock Converse tool gate

After Amazon Bedrock Converse returns `toolUse` blocks, evaluate each tool with
the [`limetry`](../../packages/sdk-python) Python SDK before execution.

## Install

```bash
pip install -e ../../packages/sdk-python
pip install -r requirements.txt
```

## Pattern

```python
from gate import build_engine, gate_tool_uses

engine = build_engine()
# response = bedrock.converse(...)
outcomes = gate_tool_uses(response, engine=engine, execute=run_tool)
```

## Test

```bash
pytest test_gate.py
```
