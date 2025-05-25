# De\Zer0\FAI 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue)]()
[![Docker Ready](https://img.shields.io/badge/docker-%230db7ed.svg?logo=docker&logoColor=white)]()

**Transform graph-based trading logic into executable code with zero programming, enabling real-time SUI/USDC trades through fail-safe automation.**  

---

## Table of Contents
- [Core Principle](#core-principle-)
- [Features](#features-)
- [Installation](#installation-)
- [API Endpoints](#api-endpoints-)
- [Architecture](#architecture-)
- [Repository Structure](#repository-structure-)
- [Privacy, Security & Reliability](#privacy-security--reliability)
- [License](#license-)
- [Contact](#contact-)

---

## Core Principle 💡
Traditional trading automation requires expertise in both programming and financial markets, creating barriers for non-technical users. De\Zer0\FAI eliminates this complexity with:  

1. **Graph-Based No-Code Studio**  
   - Design strategies visually using nodes/edges with natural language processing (NLP)  
   - Auto-convert graphs to executable code with the **LynqAI Context Protocol** for parallel tool/agent orchestration  
   - Share/version graphs securely via password-protected UIDs  

2. **Enterprise-Grade Execution**  
   - Concurrent graph deployments with real-time data logging  
   - Risk evaluation filters and instant wallet generation  
   - Periodic data publishers → preprocessing → strategy execution → risk-filtered trade decisions  

3. **Zero-DevOps Experience**  
   - Automatic Redis-server containerization for cross-OS compatibility  
   - Error-retry pipelines and atomic transaction safety  

---

## Features ✨
- **🧩 Drag-and-Drop Strategy Builder**: Node-based interface with NLP-powered logic containers  
- **⚡ LynqAI Protocol**: Parallel agent/tool execution for maximum throughput  
- **🛡️ Risk-Aware Trading**: User-defined risk filters for auto-aborting unsafe trades  
- **🔗 Shared Strategy Graphs**: Collaborate via encrypted UID/password links  
- **📊 Real-Time Dashboard**: Track performance, logs, and wallet balances  
- **🤖 Auto-Infrastructure**: Redis/Docker containers spun up on demand  

*(Include architecture diagram here if available)*  

---

## Installation ⚙️  
### Pre-requisites
- [![Python 3.11.1](https://skillicons.dev/icons?i=py)](https://www.python.org/downloads/)  Python 🐍
- [![Docker Desktop](https://skillicons.dev/icons?i=docker)](https://www.docker.com/products/docker-desktop/) Docker Desktop 🐳

### Installation & Running

```bash
git clone https://github.com/PrateushSharma/ZaZa.git
cd ZaZa
cd MCP_AI_Backend
python -m venv venv
venv\Scripts\Activate
pip install -r requirements.txt
python main.py
```

## API Endpoints 🌐

### <span style="color:#4CAF50">POST</span> `/get_uid`
**Authentication Seed Generator**  
```json
// Request
{
  "password": "0x1a2b...c3d4"  // Wallet address
}

// Response
{
  "status": "success",  // or "error"
  "uid": "AbC12XyZ89",  // 10-digit base62 (success only)
  "message": "Invalid wallet format"  // (error only)
}
```

### <span style="color:#4CAF50">POST</span> `/update`
**Graph Version Control**  
```json
// Request
{
  "uid": "AbC12XyZ89",
  "password": "0x1a2b...c3d4",
  "code": { /* No-code graph JSON */ }
}

// Response
{
  "status": "success",
  "update": true,  // false if no changes detected
  "message": "Graph checksum mismatch"  // (error only)
}
```

### <span style="color:#4CAF50">POST</span> `/deploy`
**Real-Time Deployment Stream**  
```json
# Request
{
  "uid": "AbC12XyZ89",
  "password": "0x1a2b...c3d4",
  "profit": 0.1, // Expressed in %, -1 indicated no limit
  "loss": 0.2, // Expressed in %, -1 indicated no limit
  "risk": "low/med/high"
}
```
```text
# Streaming Response
>>> Initiating graph to code conversion...
>>> Graph to code conversion complete.
>>> Installing dependencies...
>>> Dependencies successfully installed.
>>> Code has been successfully executed and deployed.
```

### <span style="color:#4CAF50">POST</span> `/stop_execution`
**Process Termination**  
```json
// Request
{
  "uid": "AbC12XyZ89",
  "password": "0x1a2b...c3d4"
}

// Response
{
  "status": "success",
  "message": "Execution halted | PID 3842 terminated"
}
```

### <span style="color:#4CAF50">POST</span> `/fetch_data`
**Portfolio Snapshot**  
```json
// Request
{
  "password": "0x1a2b...c3d4"
}

// Response
{
  "data": [
    {
      "uid": "AbC12XyZ89",
      "graph": { /* Compiled no-code graph */ }
    }
  ]  // Empty array if no graphs exist
}
```

### <span style="color:#4CAF50">POST</span> `/clone`
**Strategy Replication**  
```json
// Request
{
  "password_to": "0x5e6f...g7h8",  // Recipient
  "uid_from": "AbC12XyZ89",        // Source graph
  "password_from": "0x1a2b...c3d4" // Owner auth
}

// Response
{
  "status": "success",
  "uid": "XyZ34AbC56",  // New cloned UID
  "message": "Invalid source permissions"
}
```

### <span style="color:#4CAF50">POST</span> `/delete`
**Graph Decommission**  
```json
// Request
{
  "uid": "AbC12XyZ89", 
  "password": "0x1a2b...c3d4"
}

// Response
{
  "status": "success",
  "message": "Graph purged from all storage layers"
}
```

### <span style="color:#4CAF50">POST</span> `/fetch_logs`
**Graph Decommission**  
```json
// Request
{
  "uid": "AbC12XyZ89", 
  "password": "0x1a2b...c3d4"
}

// Response
{
  "status": "success",
  "log": "log_data"
}
```
---

## Architecture 🏗️

### 1. **LynqAI Protocol**  
- Custom context protocol with Groq LPU compatibility  
- Three-way collaboration:  
  - Agent ↔ Agent conversations  
  - Agent ↔ Tool interactions  
  - Context transfer between components  
- Simple registration for tools/agents

### 2. **Publisher-Subscriber Model**  
- Real-time data via Redis Pub/Sub  
- Priority channels:  
  - 🔴 HIGH: Order execution (ultra-low latency)  
  - 🟡 MED: Backtesting data  
  - 🟢 LOW: Analytics  

### 3. **Hybrid Data Engine**  
- Combines:  
  - Redis (caching)  
  - SQL (structured data)  
  - Python/Rust/JS/C# (processing)  

### 4. **Concurrent Execution Core**  
- Asyncio task management  
- Parallel processing for:  
  - Graph compilation  
  - Backtesting  
  - Live trading  

### 5. **Persistent Execution Matrix™**  
- Containerized isolation  
- Auto-recovery from:  
  - Network failures  
  - Exchange outages  
  - Market volatility  
- Heartbeat monitoring every 5s  

---

## Repository Structure 📂

```
ZaZa/  
├── admin_controls/         # Fail-safe protocols & emergency shutdown  
├── CMIT_deprecate/         # Deprecated Cross-Model Interaction Toolkit  
├── codegen_engine/         # No-code graph → executable code conversion  
├── core_db/                # Primary SQL database  
├── data_integrity/         # API data validation/fetching pipelines  
├── knowledgebase_db/       # Agent decision-making database  
├── library/                # Tool autoloaders & decorators  
├── lynqAI/                 # Custom MCP Toolkit for Groq 
├── redis_docker_engine/    # Redis + Docker container management  
├── redundant_5000_server/  # Test-mode port (5000) utilities  
├── server_integrity/       # User terminal allocation system  
├── uid_management/         # UID/wallet address generator  
├── user_assets/            # User deployment metadata storage  
├── user_runtime/           # Live graph PID/terminal manager  
├── utils/                  # Graph preprocessing utilities  
├── venv/                   # Python virtual environment  
│  
├── main.py                 🚀 FastAPI server (Port 8000)  
├── requirements.txt        📦 Dependency list  
├── .env                    🔒 Environment config  
├── .env.example            🧪 Sample env template  
└── README.md               📖 Documentation hub  
```  

---

## Privacy, Security & Reliability 🔒  

- **🔐 Wallet Encryption**: AES-256 + environment-aware entropy (TRNG-seeded keys)  
- **🤖 Model Integration**: LLama/Qwen/DeepSeek/Gemma/Allam/Mistral compatibility  
- **🔄 Replication System**: Reference-based redundancy with eventual consistency  
- **⚙️ Pipe & Filter Strategy**: Data Preprocessing → Strategy Evaluation → Risk Filters → Final Decision  
- **🚨 Data Leak Detection**: Real-time payload monitoring & anomaly alerts  
- **💀 PID Termination**: Auto-kill stalled/corrupted processes (5s timeout)  
- **🗑️ UID Reclamation**: Purge dangling UIDs after 72h inactivity  
- **⛓️ Audit Trails**: Immutable execution logs via private blockchain ledger  

---

## License 📄  
Distributed under the **MIT License**. See [LICENSE](LICENSE) for full terms.  

---

## Contact 📬  
**Rudraksh Sachin Joshi**  
*(LEAD AI DEVELOPER)*  
[GitHub](https://github.com/RudrakshSJoshi)  

**Prateush Sharma**  
*(LEAD BLOCKCHAIN DEVELOPER)*  
[GitHub](https://github.com/PrateushSharma)  

**Project Repository**:  
[https://github.com/PrateushSharma/ZaZa](https://github.com/PrateushSharma/ZaZa)  

---

> **Warning**  
> This system operates in high-frequency trading environments.  
> Proper backtesting is mandatory before live deployment.

---

*"Empowering financial creativity through decentralized AI"* - RSJ and PS