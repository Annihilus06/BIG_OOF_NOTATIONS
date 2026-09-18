# GridWise AI – n8n Workflow Integration Guide

This directory contains the exportable **n8n Workflow** for the GridWise AI platform.

## Architecture Flow in n8n
```text
[Webhook POST /gridwise-optimize]
  ↓
[Input Validation Code Node]
  ↓
[Gemini 1.5 Flash HTTP Request Node] (Extracts structured directives)
  ↓
[Directive Validator Code Node] (Bounds & Type checking)
  ↓
[OR-Tools Optimizer HTTP Request Node] (Calls FastAPI POST /solve)
  ↓
[Webhook Response Node] (Returns lowest-cost schedule & analytics)
```

## How to Import into n8n
1. Open your n8n instance (Local or Cloud).
2. Go to **Workflows** -> click **Add Workflow** -> click the **`...`** menu in top right -> **Import from File**.
3. Select `gridwise_ai_workflow.json`.
4. In the **3. Gemini Flash AI** node, configure query parameter `key` with your `GEMINI_API_KEY`.
5. Ensure the FastAPI backend is running on `http://localhost:8000`.
6. Click **Save** and **Activate Workflow**.
