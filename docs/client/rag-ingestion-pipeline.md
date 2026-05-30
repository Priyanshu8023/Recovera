# 🧠 Vector RAG Ingestion Pipeline

This document details the architecture and implementation of Recovera’s **Retrieval-Augmented Generation (RAG)** pipeline. The RAG pipeline is the core intelligence engine that allows our autonomous Root Cause Analysis (RCA) agent to semantically scan and understand the codebase of any connected GitHub repository, pinpointing the exact files and lines of code responsible for an incident.

---

## 🗺️ High-Level System Architecture

The RAG pipeline operates in two distinct phases: **Ingestion** (offline/background sync) and **Retrieval** (real-time incident response). 

```mermaid
graph TD
    subgraph Ingestion Phase [Phase 1: Ingestion & Vector Sync]
        A["GitHub Repository (main)"] -->|1. Fetch Tree| B["Ingestion Service"]
        B -->|2. Filter Source Files| C["Chunker (50-line window)"]
        C -->|3. Overlapping Chunks| D["Google Embedding SDK (text-embedding-004)"]
        D -->|4. 768-Dim Vectors| E["SimpleVectorStore (vector-store.json)"]
        E -->|5. Track Metrics| F["Neon PostgreSQL (RepositoryIndex)"]
    end

    subgraph Retrieval Phase [Phase 2: Semantic Diagnostic Scan]
        G["New Log Error / Incident"] -->|1. Generate Search Query| H["Semantic Code Searcher"]
        H -->|2. Compute Cosine Similarity| E
        E -->|3. Top-N Code Context| I["LLM System Prompt Context"]
        I -->|4. Analyze & Patch| J["Autonomous RCA Diagnostic Report"]
    end

    style Ingestion Phase fill:#f5f7ff,stroke:#5c7cfa,stroke-width:2px
    style Retrieval Phase fill:#fdf5f5,stroke:#fa5252,stroke-width:2px
```

---

## ⚡ Phase 1: The Repository Ingestion Process

When a repository is connected or re-synced, the `ingestRepository()` function executes an asynchronous background worker flow.

### 1. Ingestion Lifecycle Tracking
To avoid expensive double-indexing and race conditions, state is locked in the `RepositoryIndex` PostgreSQL model:
* **`pending`**: Ingestion has started. Frontend shows a clean indexing spinner.
* **`indexed`**: Successfully compiled. Files and chunks metrics are updated, and the timestamp is logged.
* **`failed`**: An error occurred. The exact error stack is captured in `errorMessage` for developer inspection.

### 2. Recursive File Tree Discovery
We query the **GitHub Git Trees API** (`/git/trees/main?recursive=1`) to get a flat representation of all repository items.
* **File Filters (The Blocklist):** To prevent polluting the index with minified code, bundler logs, or library source code, directories like `node_modules/`, `.next/`, `dist/`, `build/`, `vendor/`, and `.git/` are strictly ignored.
* **Size Guard:** Any file exceeding **100 KB** (`MAX_FILE_BYTES`) is bypassed to prevent performance bottlenecks.
* **Supported Extensions:** Only files ending in `ts`, `tsx`, `js`, `jsx`, `py`, `go`, `java`, `rb`, `rs`, or `cs` are eligible for processing.

### 3. Slit & Overlap Chunking Strategy
Once a file is decoded from Base64, the Chunker splits the content into logical segments to optimize embedding density:

$${\color{lightblue}\text{Chunk Size}} = 50\text{ lines} \quad | \quad {\color{lightblue}\text{Chunk Overlap}} = 10\text{ lines}$$

> [!TIP]
> **Why Overlapping?**
> Standard line splitting cuts functions or classes in half at arbitrary boundaries. By enforcing a **10-line sliding window overlap**, we ensure that variable declarations, function signatures, and imports at boundaries are kept intact, providing critical semantic context to the LLM.

### 4. Embedding Generation & Vector Storage
Chunks are batched in groups of **20** to minimize network roundtrips. For each chunk:
1. A formatted search block is compiled:
   ```text
   File: src/utils/helper.ts
   Lines: 41-90

   [50 lines of code]
   ```
2. We request embeddings from Google's `text-embedding-004` model using the Vercel AI SDK.
3. The resulting **768-dimensional coordinate vector** is pushed to the `SimpleVectorStore` alongside its metadata (file path, line bounds, text content, repository ownership).
4. The database is written synchronously to `data/vector-store.json`.

---

## 🔄 Sequence Diagram: End-to-End Ingestion Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / User
    participant API as Provision API Route
    participant Ingest as Ingestion Service
    participant GH as GitHub Tree API
    participant VS as Simple Vector Store (Disk)
    participant DB as Neon PostgreSQL

    Dev->>API: Connect GitHub Repository
    API->>DB: Upsert RepositoryIndex (status = 'pending')
    API->>Ingest: Trigger Ingestion Async
    Ingest->>GH: Recursive Fetch File Tree (branch: main)
    GH-->>Ingest: Return flat Tree Items
    loop Over Eligible Files
        Ingest->>GH: Fetch decoded text content
        Ingest->>Ingest: Split into 50-line overlapping chunks
        Ingest->>Ingest: Generate Google text-embedding-004 vectors
        Ingest->>VS: Add entries to Vector Database
    end
    Ingest->>VS: Save vector-store.json (disk)
    Ingest->>DB: Update RepositoryIndex (status = 'indexed', metrics synced)
    Note over Ingest,DB: Indexes are now ready for real-time RCA!
```

---

## 🔍 Phase 2: Semantic Diagnostic Retrieval

When a production incident triggers a diagnostics run, our autonomous agent leverages the search index:

```mermaid
flowchart TD
    A[Production Incident Log Alert] --> B[Launch Autonomous RCA Agent]
    B --> C[Extract Error Signature & Log Stacktrace]
    C --> D[Generate Semantic Search Query]
    D --> E[Search SimpleVectorStore]
    E --> F[Calculate Cosine Similarity against vector-store.json]
    F --> G[Extract top-N most similar code chunks]
    G --> H[Inject code chunks as repo_context into LLM System Prompt]
    H --> I[AI Engine generates highly precise, contextual code diagnostics]
    I --> J[Perfect, Automated Resolution Plan / PR]
```

### 1. Vector Search Algorithm
We perform a local vector search using the **Cosine Similarity** formula:

$$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

This calculates the angular distance between the incident query vector ($A$) and our stored codebase chunk vectors ($B$). Chunks are sorted in descending order of similarity, and the **top 10 most relevant code snippets** are injected directly into the LLM system context.

---

## 🧪 Developer Offline & Mock Mode

Setting up cloud environments and API credentials locally can be tedious. To enable fast, offline, and zero-cost local testing, Recovera supports a full **Mock Mode**.

> [!NOTE]
> Setting **`AGENT_MOCK="true"`** in your client `.env` file switches all heavy network APIs over to fast, predictable local mock providers!

### How Mock Mode Alters the Pipeline:

| System Layer | Production Behavior (`AGENT_MOCK="false"`) | Mock Mode Behavior (`AGENT_MOCK="true"`) |
| :--- | :--- | :--- |
| **Embeddings** | Calls Google's `text-embedding-004` API. | Generates random 768-dimensional float arrays (`Math.random() - 0.5`) instantly. |
| **AI LLM Core** | Sends queries to Groq / Gemini for live agent execution. | Resolves instantly with simulated Diagnostic Reports & predefined code patches. |
| **AWS Cloud Scan** | Performs real connection tests on AWS IAM and S3 services. | Bypasses credential checks if they contain the words `"mock"` or `"test"`. |

### Configuring Local Mock Mode
To test the RAG pipeline and agent locally without API keys, update your `client/.env` file:

```env
# Toggle offline mock mode
AGENT_MOCK="true"
```

Running the test suite with `npm run test:safety` or launching the Next.js dev server (`npm run dev`) will now run successfully, completely offline!
