# Fylr - Ephemeral File & Text Sharing

A secure, self-destructing file and text sharing platform. Share content that automatically deletes after viewing or a set time period.

## Features

- **Text Sharing**: Unlimited text length
- **File Sharing**: Up to 5GB files
- **Self-Destruct Options**: 
  - After N views (1, 5, 10, 50)
  - Time-based expiration (1 hour, 24 hours, 7 days, 30 days)
- **Password Protection**: Optional password protection for shares
- **No Accounts Required**: Simple, anonymous sharing
- **Automatic Cleanup**: Content is permanently deleted after expiration

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite
- **File Storage**: Local filesystem (configurable for cloud storage)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Upload/Paste**: Users can drag-drop files or paste text
2. **Configure**: Set expiration rules (views or time)
3. **Share**: Get a unique link to share
4. **Auto-Delete**: Content is automatically deleted after conditions are met

## API Endpoints

- `POST /api/shares/text` - Create text share
- `POST /api/shares/file` - Create file share
- `GET /api/shares/[id]` - Retrieve share metadata
- `GET /api/shares/[id]/download` - Download file

## Security Features

- Content is deleted immediately after expiration
- Optional password protection
- No user accounts required
- Secure unique IDs using nanoid
- File uploads isolated from application code

## AI Integration Options

### 1. Content Moderation
- **Purpose**: Automatically scan uploaded content for inappropriate material
- **Implementation**: Use OpenAI's Moderation API or Google's Perspective API
- **Benefits**: Prevent abuse, maintain platform safety

### 2. Smart Text Summarization
- **Purpose**: Generate summaries of long text shares
- **Implementation**: Use OpenAI GPT or Anthropic Claude API
- **Benefits**: Users can preview content before sharing

### 3. File Type Detection & Analysis
- **Purpose**: Intelligently analyze uploaded files
- **Implementation**: 
  - Images: Use Vision APIs for content detection, OCR
  - Documents: Extract and summarize key information
  - Code: Detect programming languages, security vulnerabilities

### 4. Auto-Expiration Recommendations
- **Purpose**: Suggest optimal expiration settings based on content
- **Implementation**: ML model to analyze content sensitivity
- **Benefits**: Better security defaults for users

### 5. Language Translation
- **Purpose**: Auto-translate shared text to recipient's language
- **Implementation**: Google Translate API or DeepL API
- **Benefits**: Cross-language sharing capabilities

### 6. Accessibility Features
- **Purpose**: Generate alt-text for images, audio descriptions
- **Implementation**: Vision and Speech APIs
- **Benefits**: Make shares accessible to all users

### 7. Smart Link Previews
- **Purpose**: Generate rich previews for shared links
- **Implementation**: Extract metadata, generate summaries
- **Benefits**: Better sharing experience on social media

### 8. Virus Scanning
- **Purpose**: Scan uploaded files for malware
- **Implementation**: ClamAV or cloud-based antivirus APIs
- **Benefits**: Protect users from malicious files

## How to Add AI Features

### Example: Adding OpenAI Integration

1. Install OpenAI SDK:
```bash
npm install openai
```

2. Add API key to `.env.local`:
```
OPENAI_API_KEY=your-api-key-here
```

3. Create AI utility file (`lib/ai.ts`):
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function moderateContent(text: string) {
  const moderation = await openai.moderations.create({
    input: text,
  });
  return moderation.results[0];
}

export async function summarizeText(text: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Summarize the following text in 2-3 sentences."
      },
      {
        role: "user",
        content: text
      }
    ],
    max_tokens: 150
  });
  return completion.choices[0].message.content;
}
```

4. Integrate into share creation API routes

## Future Enhancements

- Cloud storage integration (S3, Cloudflare R2)
- End-to-end encryption
- Analytics dashboard
- API access for developers
- Mobile apps
- WebSocket support for real-time notifications

## License

MIT
