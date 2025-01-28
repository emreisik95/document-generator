import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY.trim(),
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }), 
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a Confluence documentation expert. Generate detailed technical documentation in markdown format.
Follow these guidelines:
- Use proper markdown formatting with headers, tables, and lists
- Ensure clear structure with appropriate section hierarchy
- Include only sections that have content
- Format code blocks with appropriate syntax highlighting
- Use tables for structured data like acceptance criteria and test cases
- Keep the content concise but comprehensive
- Ensure consistent spacing between sections (use single blank line)
- Format tables with proper alignment and headers

Example structure:
# Title

Overview text

## Acceptance Criteria

| ID | Description | Expected Outcome |
|----|-------------|------------------|
| AC1 | ... | ... |

## Test Cases

| ID | Description | Steps | Expected Result |
|----|-------------|-------|-----------------|
| TC1 | ... | ... | ... |

## Implementation Notes
- Note 1
- Note 2`
        },
        ...messages
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Clean up any excessive whitespace while preserving markdown formatting
    const cleanContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return new Response(JSON.stringify({ content: cleanContent }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generate route:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response(
          JSON.stringify({ 
            error: 'OpenAI API key configuration error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          }), 
          { status: 500 }
        );
      }
      
      if (error.message.includes('Rate limit')) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429 }
        );
      }
    }

    // Generic error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate documentation',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      }), 
      { status: 500 }
    );
  }
}
