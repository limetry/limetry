# Stripe Python payment authorization

Authorize Stripe charges and refunds with the [`limetry`](../../packages/sdk-python)
Python SDK before the Stripe API call runs.

## Install

```bash
pip install -e ../../packages/sdk-python
pip install -r requirements.txt
```

## Pattern

```python
from authorize import authorize_payment, build_engine
import stripe

engine = build_engine()
outcome = authorize_payment(
  action_type="stripe.charge",
  amount_minor=1200,
  resource="cus_123",
  engine=engine,
  execute=lambda: stripe.Charge.create(amount=1200, currency="usd", customer="cus_123"),
)
```

## Test

```bash
pytest test_authorize.py
```
