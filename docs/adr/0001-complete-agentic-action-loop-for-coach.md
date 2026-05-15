# Use a Complete Agentic Action Loop for Coach

Status: accepted

阿念教練 must be implemented as a complete agentic action loop, not as a single prompt response or one-shot function-calling fallback. The loop must observe internal context, orient to safety and user intent, plan the next step, execute allowed tools, persist trace/state, evaluate guardrails and outcomes, then adjust the next response; LLMs handle semantic judgment and language, while deterministic code owns state transitions, rewards, expiry, authorization, and safety gates.

**Considered Options**

- Keep the current one-shot `coach` fallback with a single function call: simpler, but it would make the product look agentic without actually maintaining action state or closing loops.
- Build a full multi-agent orchestration immediately: more powerful, but too much surface area before the 7 日推動感 loop is proven.
- Build a single-agent, multi-step action loop first: chosen because it supports small-action closure, traceability, safety gates, and future expansion without overbuilding.

**Consequences**

- The first implementation plan must prioritize runtime loop, state, tools, trace events, and eval scenarios before XP, shop, or UI polish.
- Prompt changes alone are insufficient for this feature.
- Gamified todo remains a tool layer; the product role remains Agentic 情緒代理.
