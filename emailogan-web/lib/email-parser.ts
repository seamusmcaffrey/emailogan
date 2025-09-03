
export interface ParsedEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: Date | string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export function parseEmailContent(emailContent: string): ParsedEmail {
  const lines = emailContent.split('\n');
  const headers: Record<string, string> = {};
  let bodyStart = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      bodyStart = i + 1;
      break;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  
  const body = lines.slice(bodyStart).join('\n').trim();
  
  return {
    id: generateEmailId(headers['message-id'] || `${Date.now()}`),
    from: headers['from'] || 'Unknown',
    to: headers['to'] || 'Unknown',
    subject: headers['subject'] || 'No Subject',
    date: headers['date'] ? new Date(headers['date']) : new Date(),
    body: extractTextFromBody(body),
    html: extractHtmlFromBody(body),
  };
}

function generateEmailId(messageId: string): string {
  return messageId.replace(/[<>]/g, '').replace(/[@.]/g, '_');
}

function extractTextFromBody(body: string): string {
  // Remove HTML tags if present
  const textOnly = body.replace(/<[^>]*>/g, '');
  // Clean up whitespace
  return textOnly.replace(/\s+/g, ' ').trim();
}

function extractHtmlFromBody(body: string): string | undefined {
  if (body.includes('<html') || body.includes('<body')) {
    return body;
  }
  return undefined;
}

export function sanitizeEmailForEmbedding(email: ParsedEmail): string {
  // Ensure date is a Date object (handle both Date objects and date strings)
  const dateStr = email.date instanceof Date 
    ? email.date.toISOString() 
    : new Date(email.date).toISOString();
    
  return `From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${dateStr}

${email.body}`.substring(0, 8000); // Limit to 8000 chars for embedding
}