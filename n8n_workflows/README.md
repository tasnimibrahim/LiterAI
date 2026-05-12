# n8n Workflows

This folder contains n8n workflow JSON files for the LiterAI Telegram Bot integration.

## Files

| File | Description |
|---|---|
| `telegram_bot.json` | The full n8n workflow for the Telegram Bot (same as n8n_workflow.json) |
| `n8n_workflow.json` | Same workflow, alternative name |

## How to Use

1. Open your n8n instance (self-hosted or cloud).
2. Click **"Import from File"** in the n8n workflows page.
3. Select either `telegram_bot.json` or `n8n_workflow.json`.
4. Configure the credentials:
   - **Telegram API**: Add your Telegram Bot Token (from @BotFather).
   - **Groq API Key**: Add your Groq API key as an HTTP Header Auth credential (`Authorization: Bearer YOUR_KEY`).
5. Activate the workflow.

The bot will listen for messages on Telegram, forward them to Groq's Llama 3.1 API, and return the AI response back to Telegram.
