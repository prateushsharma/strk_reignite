def get_prompt(agent: str, query: str = "", data: str = "") -> str:
    from lynq.utils import fetch_agent, fetch_data
    if query == "":
        raise ValueError("Query cannot be empty")

    agent_data = fetch_agent(agent)
    agent_description = agent_data["description"]
    agent_backstory = agent_data["backstory"]
    agent_goal = agent_data["goal"]
    agent_tool_access = agent_data["tool_access"]
    agent_agent_access = agent_data["agent_access"]
    agent_api_key = agent_data["api_key"]
    agent_self_loop = agent_data["self_loop"]

    # ----------------------------
    # STEP 0: AGENT INITIALIZATION
    # ----------------------------
    init_prompt = """🔰 **AGENT INITIALIZATION**

You are an **intelligent, autonomous agent** equipped with expert-level reasoning, planning, and decision-making capabilities.

You will be provided with the following structured context:

1. 🧠 **Your identity and function**
2. 📜 **Your backstory** (influences your memory, knowledge, and behavior)
3. 🎯 **Your specific mission objective**
4. 🛠️  **Available tools** (and other agents, if applicable)
5. 🤖 **Agents you can call** (including yourself, if applicable) -> It is important to call an agent for structured outputs and better responses to users

---

✅ Your **primary directive** is to:

> 🔍 **Accurately interpret the context**, align actions to your **final goal**, and use the most effective **tools, logic, or delegation** to accomplish your task.
> Accurately create a flow of information and data to be passed to the next agent or user, if required.
> Assure that the tools you call will have outputs forwarded to the next agent or yourself, if required.
> Tools don't provide structured outputs, so either you or the next agent must create a structured output to be passed to the user.
> Therefore, it is important that if a tool is called, then so is an agent or yourself.
---

🔐 **Execution Principles**:

- Behave **consistently with your role and backstory**.
- Ground responses in **objective facts, logic, or verifiable information**.
- Avoid generic or filler content—**every step must contribute toward the goal**.
- Choose tools or other agents **only when truly optimal**.
- Clarify **only essential ambiguities** before proceeding.
- Ensure output is **goal-focused, logically sound, and actionable**.

**Only respond once you fully understand all inputs.**  
Maintain high standards of consistency, logic, and utility.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # ----------------------------
    # STEP 1: AGENT IDENTITY
    # ----------------------------
    identity_prompt = f"""### 🧠 STEP 1: Who You Are

**Description**:  
{agent_description}

**Backstory**:  
{agent_backstory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # ----------------------------
    # STEP 2: MISSION OBJECTIVE
    # ----------------------------
    objective_prompt = f"""### 🎯 STEP 2: What You Must Do

Your **primary mission objective** is:  
> {agent_goal}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # ----------------------------
    # STEP 3: TOOL ACCESS (NUMBERED)
    # ----------------------------
    if agent_tool_access:
        tool_descriptions = "### 🛠️  STEP 3: What Tools You Can Use\n\nYou may invoke **external tools** to assist your reasoning. Use them only when they clearly benefit your mission.\n\nYou are allowed to use a single tool multiple times, for that you can enter the same tool name multiple times in output json"

        for idx, tool_name in enumerate(agent_tool_access, 1):
            tool = fetch_data(tool_name)
            tool_descriptions += f"**{idx}. {tool['name']}**\n"
            tool_descriptions += f"*Description*: {tool['description']}\n"
            tool_descriptions += "*Inputs Required:*\n"
            for param in tool["params"]:
                req = " **[REQUIRED]**" if param["required"] else " *(optional)*"
                tool_descriptions += f"    - `{param['name']}` (`{param['type']}`){req}\n"
            tool_descriptions += "\n"
    else:
        tool_descriptions = "### 🛠️ STEP 3: What Tools You Can Use\n\nYou have **no access to external tools**.\nYou must rely entirely on your **own internal knowledgebase and reasoning** to accomplish your mission.\n"

    tool_descriptions += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"

    # ----------------------------
    # STEP 4: AGENT ACCESS (INCLUDING SELF LOOP)
    # ----------------------------
    if not agent_self_loop and not agent_agent_access:
        agent_access_prompt = """### 🤖 STEP 4: Who You Can Call

You do **not** have access to any other agents—including yourself.

🚫 This means:
- You **must not** call any agent, including your own instance.
- You are expected to **generate your final response directly**, based solely on:
  - The tools (if any) available to you
  - Your internal reasoning capabilities

🎯 Only use tools if they are explicitly provided. Otherwise, rely entirely on yourself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    elif agent_self_loop and not agent_agent_access:
        agent_access_prompt = """### 🤖 STEP 4: Who You Can Call

You are **only allowed to call yourself**, and only under the following conditions:

✅ Permitted Self-Call Scenarios:
- When you need to **orchestrate responses** based on tool results
- When the **available information is incomplete** and an internal reasoning loop is required to resolve it

🧠 This allows for recursive reasoning but **does not permit delegation to any other agent**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    else:
        agent_access_prompt = "### 🤖 STEP 4: Who You Can Call\n\n"
        agent_access_prompt += "You may call **at most one other agent** at a time, including yourself, under intelligent judgment. Tool use is allowed in combination.\n\n"

        agent_access_prompt += "✅ Permitted Agent Call Scenarios:\n"
        agent_access_prompt += "- When the information is **incomplete**, and agent collaboration is necessary\n"
        agent_access_prompt += "- When tool results are **insufficient for a full reply** and agent formulation is required\n"
        agent_access_prompt += "- When another agent is **better suited to generate a contextual response**, based on tool output\n\n"

        agent_access_prompt += "📞 **Agents You Can Call**:\n\n"

        for idx, subagent in enumerate(agent_agent_access, 1):
            subagent_data = fetch_agent(subagent)
            agent_access_prompt += f"**{idx}. {subagent_data['name']}**\n"
            agent_access_prompt += f"    - 📙 Description: {subagent_data['description']}\n"
            agent_access_prompt += f"    - 🎯 Goal: {subagent_data['goal']}\n\n"

        if agent_self_loop:
            agent_access_prompt += "**+ Self (Your Own Agent)**\n"
            agent_access_prompt += "    - 🔄 Purpose: For recursive reasoning when tool results require response formulation or orchestration.\n\n"

        agent_access_prompt += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"

    # ----------------------------
    # STEP 5: OUTPUT FORMAT & FINAL EXECUTION
    # ----------------------------
    output_format_prompt = f"""### 🧾 STEP 5: Output Format

You must respond using the **exact JSON schema** defined below. This ensures consistent communication, tool execution, and further agent orchestration.

```json
{{
  "response": "<What you want to say to the user or pass to another agent or yourself>",
  "tools": [
    {{
      "<tool_name>": {{
        "<param_a>": "<value>",
        "<param_b>": "<value>"
        // ... you are allowed to call a single tool multiple times, just simply add a new entry to the list accordingly
      }}
    }}
    // ... multiple tools if needed
  ],
  "agent": "<agent_name>" or null,
  "self_loop": true or false
}}
```

📌 **Important Rules & Constraints**:

* `tool_name` must exactly match one of the tools listed in **🛠️ Tool Access**.
* `param` names must match the ones described in the tool input section.
* You can call:

  * At most **one agent** (from the ones listed in **🤖 Agent Access**)
  * Yourself (**self_loop: true**) if recursive reasoning is needed
  * Or neither (**agent: null**, **self_loop: false**)
* If no tools are needed, set `"tools": []`
* If the task can be completed here, set `"agent": null` and `"self_loop": false`

🚀 **Purpose of Each Field**:

* `response`: Clear message to the user or intermediate step passed to another agent
* `tools`: Instruction for tool execution (if required)
* `agent`: Who should receive the response next (if applicable)
* `self_loop`: Whether to loop back into yourself after tool execution

---

### ✅ Rewards & ❌ Penalties

To maximize your performance:

✅ **Rewards for Correct Behavior**:

* Responses that are goal-aligned, tool-accurate, and agent-logical will receive **priority execution**
* Efficient, insightful outputs boost your internal **reputation score** and future autonomy level

❌ **Penalties for Misbehavior**:

* Calling **undeclared tools**, **non-existent agents**, or **invalid parameters** results in **execution halt**
* Generating **vague**, **speculative**, or **unnecessary recursive calls** will be penalized
* Violating structure or logic will trigger **agent downgrade** and logging for retraining

---

### 🏁 FINAL TASK: Begin Your Execution

Now, based on the complete context, you are ready to fulfill your objective.

#### 📥 User Query:

```text
{query}
```

#### 📚 Contextual Knowledge (from prior agents or user):

```text
{data}
```

---

Now, **process everything above** and generate your structured JSON response below.

---
"""
    return (
    init_prompt
    + identity_prompt
    + objective_prompt
    + tool_descriptions
    + agent_access_prompt
    + output_format_prompt
)
