# Welcome to Limetry Discussions 👋

If you have ever handed an autonomous agent an API key and quietly prayed it wouldn't hallucinate your production database into oblivion, welcome home. 🤖

Prompt engineering is helpful, but *"pretty please don't `DROP TABLE`"* is not an access control model. 🛑 Agents holding credentials need a server-authoritative gate standing between an LLM's intent and an irreversible side effect. Limetry provides open-source action governance that intercepts action intents and returns `allow`, `deny`, or `approval_required` alongside signed receipts and privacy-safe audit trails before any tool runs.

Whether you are here to stop an ops bot from casually issuing a $500 refund on a $10 inquiry, keep untrusted pull request forks from deploying privileged CI pipelines, or let Cursor and Claude run read queries without dropping production schemas, this is your space to talk agent governance. 🛡️

---

## What to Discuss Here 💬

* **Show & Tell**: Share how you are wiring `@limetry/sdk`, `@limetry/mcp`, or the CLI into your agent loops.
* **Policy Recipes**: Swap battle-tested slim policies, resource patterns, and cost-cap setups.
* **Adapters & Bridges**: Brainstorm and collaborate on integrations beyond `@limetry/ci`, `@limetry/sql`, and `@limetry/shopify`.
* **Feature Requests**: Discuss improvements to the evaluate engine, hash-bound approvals, and audit streaming.
* **Q&A & Troubleshooting**: Get help configuring `limetry setup`, crafting action policies, or hooking up middleware.

---

### Community Ground Rules 📋

* **Keep It Redacted**: Limetry is built around data minimization and privacy-safe audits. Avoid posting raw API keys, tokens, or sensitive production payloads into public threads.
* **Enforce the Decision**: Limetry evaluations are advisory until your agent loop or middleware enforces the outcome. Never assume an agent will govern itself out of the goodness of its weights.
* **Be Constructive**: Governing autonomous systems is new territory for everyone, so every question and policy edge case is welcome.

---

### Getting Started 🚀

1. Follow the [[Quick Start](https://limetry.org/docs/quick-start)](<https://www.google.com/search?q=https://limetry.org/docs/quick-start>) to test `limetry setup`, `policy apply`, and `audit tail`.
2. Explore the [[Example Catalog](https://www.google.com/search?q=examples/)](<https://www.google.com/search?q=examples/>) for verified implementations across LangGraph, CrewAI, AutoGen, and serverless architectures.
3. Introduce yourself in the comments below: what agent workflows are you building, and what is the single most dangerous tool call you want to gate?
