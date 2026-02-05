# Subconscious Tools Guide

Complete guide to building and using tools with Subconscious.

## How Subconscious Tools Work

**Key Difference from OpenAI**: Subconscious tools are **remote HTTP endpoints**. When the agent needs to use a tool, Subconscious makes an HTTP POST (or GET) to the URL you specify. You don't manage a tool-execution loop—Subconscious handles it internally.

### The Flow

1. You define tools with `url` fields pointing to your endpoints
2. Agent decides when to use tools based on the task
3. Subconscious makes HTTP requests to your endpoints
4. Your endpoints return JSON responses
5. Subconscious injects tool results into context and continues reasoning
6. Agent can chain multiple tool calls automatically (multi-hop reasoning)

## Tool Definition Schema

### Complete Schema

```typescript
type FunctionTool = {
  type: "function";
  name: string;                    // Tool name (used by agent)
  description: string;             // Critical: affects when agent uses tool
  url: string;                     // YOUR endpoint URL (required)
  method: "POST" | "GET";          // HTTP method
  timeout?: number;                // Timeout in seconds (default: 30)
  parameters: {
    type: "object";
    properties: Record<string, PropertySchema>;
    required?: string[];
    additionalProperties?: boolean; // Usually false
  };
  headers?: Record<string, string>; // Optional: custom headers
  defaults?: Record<string, any>;   // Optional: hidden parameters
};
```

### Property Schema

```typescript
type PropertySchema = {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description: string;             // Important: helps agent understand usage
  enum?: string[];                 // For string enums
  items?: PropertySchema;           // For arrays
  properties?: Record<string, PropertySchema>; // For objects
  format?: "date" | "date-time" | "email" | "uuid";
  pattern?: string;                // Regex pattern for strings
};
```

## Platform Tools

Built-in tools hosted by Subconscious. No setup required.

| ID | Name | Description |
|----|------|-------------|
| `web_search` | Google Search | Search the web for information |
| `webpage_understanding` | Jina Reader | Extract and summarize webpage content |
| `parallel_search` | Parallel Search | Precision search for facts from authoritative sources |
| `parallel_extract` | Parallel Extract | Extract specific content from a webpage |
| `exa_search` | Exa Search | Semantic search for high-quality content |
| `exa_crawl` | Exa Crawl | Retrieve full webpage content |
| `exa_find_similar` | Exa Similar | Find pages similar to a given URL |

**Usage:**
```python
tools = [
    {"type": "platform", "id": "web_search"},
    {"type": "platform", "id": "webpage_understanding"},
    {"type": "platform", "id": "parallel_search"},
]
```

```typescript
tools: [
  { type: "platform", id: "web_search" },
  { type: "platform", id: "webpage_understanding" },
  { type: "platform", id: "parallel_search" },
]
```

## Function Tools

Call your own HTTP endpoints. You host the tool; Subconscious calls it during agent execution.

**Example Function Tool:**

```python
tools = [
    {
        "type": "function",
        "name": "get_weather",
        "description": "Get current weather for a city",
        "url": "https://your-server.com/weather",
        "method": "POST",
        "timeout": 10,
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City name"
                },
                "units": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature units"
                },
            },
            "required": ["city"],
            "additionalProperties": False
        },
        # Optional: Custom headers for authentication
        "headers": {
            "x-api-key": "your-secret-key"
        },
        # Optional: Hidden defaults (not shown to model)
        "defaults": {
            "sessionId": "user-session-abc123"
        }
    }
]
```

## Building Tool Servers

### FastAPI (Python)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10

class SearchResult(BaseModel):
    title: str
    url: str
    description: str

@app.post("/search", response_model=List[SearchResult])
async def search(req: SearchRequest):
    """
    Tool endpoint for web search.
    Subconscious will POST here with {"query": "...", "max_results": 10}
    """
    try:
        # Your search logic here
        results = perform_search(req.query, req.max_results)
        return [
            SearchResult(
                title=r["title"],
                url=r["url"],
                description=r["description"]
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn server:app --host 0.0.0.0 --port 8000
```

### Express.js (Node.js/TypeScript)

```typescript
import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

interface SearchRequest {
  query: string;
  max_results?: number;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

app.post("/search", async (req: Request<{}, SearchResult[], SearchRequest>, res: Response<SearchResult[]>) => {
  /**
   * Tool endpoint for web search.
   * Subconscious will POST here with {query: "...", max_results: 10}
   */
  try {
    const { query, max_results = 10 } = req.body;
    
    // Your search logic here
    const results = await performSearch(query, max_results);
    
    res.json(results.map(r => ({
      title: r.title,
      url: r.url,
      description: r.description
    })));
  } catch (error) {
    res.status(500).json({ error: String(error) } as any);
  }
});

app.listen(8000, () => {
  console.log("Tool server running on :8000");
});
```

## Tool Request Format

When Subconscious calls your tool, it sends:

**POST Request:**
```json
{
  "query": "quantum computing",
  "max_results": 10
}
```

**Headers:**
- `Content-Type: application/json`
- Any custom headers you defined in `headers` field

## Tool Response Format

Your endpoint must return JSON:

**Success Response:**
```json
[
  {
    "title": "Result Title",
    "url": "https://example.com/article",
    "description": "Article description..."
  }
]
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

Subconscious will handle errors and retry if appropriate.

## Multiple Tools

Define multiple tools in one request. The agent will use them as needed:

```python
tools = [
    {
        "type": "function",
        "name": "web_search",
        "description": "Search the web",
        "url": "https://your-server.com/search",
        "method": "POST",
        "parameters": {...}
    },
    {
        "type": "function",
        "name": "save_to_database",
        "description": "Save results to database",
        "url": "https://your-server.com/save",
        "method": "POST",
        "parameters": {...}
    },
    {
        "type": "function",
        "name": "send_email",
        "description": "Send email notification",
        "url": "https://your-server.com/email",
        "method": "POST",
        "parameters": {...}
    }
]
```

The agent can chain these tools automatically. For example:
1. Use `web_search` to find information
2. Use `save_to_database` to store results
3. Use `send_email` to notify completion

## Tool Descriptions Matter

The `description` field is critical. It affects:
- When the agent decides to use the tool
- How the agent interprets tool results
- What parameters the agent generates

**Good description:**
```python
"description": "Search the web for current information. Returns title, URL, and description of up to 10 results. Use when you need to find recent information about a topic."
```

**Bad description:**
```python
"description": "Search tool"  # Too vague
```

## Timeouts

Set appropriate timeouts:
- **Quick operations** (search, calculation): 5-10 seconds
- **API calls**: 10-30 seconds
- **Database queries**: 30-60 seconds
- **Long operations**: Consider async patterns instead

## Local Development

For local development, expose your server publicly:

**ngrok:**
```bash
ngrok http 8000
# Use the ngrok URL in your tool definition
```

**Cloudflare Tunnel:**
```bash
cloudflared tunnel --url http://localhost:8000
```

## Best Practices

1. **Idempotent endpoints** - Tool may be called multiple times
2. **Fast responses** - Keep under timeout, ideally <5 seconds
3. **Clear error messages** - Help debugging
4. **Validate inputs** - Use Pydantic/TypeScript types
5. **Log tool calls** - For debugging and monitoring
6. **Handle rate limits** - If calling external APIs
7. **Return structured data** - JSON objects/arrays, not strings
8. **Descriptive tool names** - Use clear, action-oriented names

## Multi-Hop Reasoning

Subconscious automatically chains tool calls. The agent can:
1. Call tool A
2. Use results to decide to call tool B
3. Combine results from A and B
4. Call tool C with combined context
5. Return final answer

You don't need to manage this loop—it's handled internally by TIMRUN.

## Resources

- **Tool Examples**: See `examples.md`
- **API Reference**: See `api-reference.md`
- **Subconscious Docs**: https://docs.subconscious.dev/core-concepts/tools
