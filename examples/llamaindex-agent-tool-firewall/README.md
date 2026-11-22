# LlamaIndex agent tool firewall

Gate LlamaIndex-style FunctionTool calls with the [`limetry`](../../packages/sdk-python)
Python SDK before the tool body runs.

## Install

```bash
pip install -e ../../packages/sdk-python
pip install -r requirements.txt
```

## Pattern

```python
from firewall import build_engine, governed_tool

engine = build_engine()
retrieve = governed_tool("retrieve", my_retrieve_fn, engine=engine)
```

## Test

```bash
pytest test_firewall.py
```
