# AI Document Review Agent

This project is a Next.js application that allows users to upload a PDF document or submit a URL for analysis. An AI agent, powered by Claude 3.5 Haiku via OpenRouter, reviews the document for sensitive information and security concerns. The entire process is tracked using VM counters, and a detailed report is generated, including a recommendation for human approval if necessary.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) with TypeScript and shadcn/ui for a modern, responsive user interface.
- **Backend:** Next.js API Routes for server-side logic.
- **AI:** OpenRouter (Claude 3.5 Haiku) for document analysis.
- **File Processing:** `pdf2json` for PDF text extraction and `cheerio` for web scraping.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following:
    ```
    OPENROUTER_API_KEY=your-openrouter-api-key
    NEXT_PUBLIC_SITE_URL=http://localhost:3000

    # Webhook endpoints
    WEBHOOK_COMPLIANCE=your-webhook-url
    WEBHOOK_SECURITY=your-webhook-url
    WEBHOOK_LOGGING=your-webhook-url
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.