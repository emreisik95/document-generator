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

# Logs Management in Athena, CloudWatch, and S3

This documentation outlines the types of logs stored in Amazon Athena, Amazon CloudWatch, and Amazon S3 for various services including web pixel, webhook, historical user sync, IYS (İletişim Yönetim Sistemi) logs, system logs, and catalog sync logs.

## Logs Stored in Athena
The following logs are stored in Amazon Athena:

- **Web Pixel Logs**: These logs capture data about user interactions through web pixels, allowing for detailed analysis of user engagement.
- **Webhook Logs**: Logs generated from webhook calls that provide insights into the events triggered by external systems.
- **Historical User Sync Logs**: These logs maintain records of user synchronization activities over time, which is essential for auditing and troubleshooting purposes.
- **IYS (İletişim Yönetim Sistemi) Logs**: Logs generated from the Integrated Yield System (IYS), which includes detailed records of system activities and transactions.

## Logs Stored in CloudWatch
The following logs are stored in Amazon CloudWatch:

- **Old IYS Logs**: Legacy logs from the Integrated Yield System (İletişim Yönetim Sistemi) that provide historical data for analysis and compliance purposes.
- **System Logs**: Logs that capture system-level events and metrics, crucial for monitoring the health and performance of applications.

## Logs Stored in S3
The following logs are stored in Amazon S3:

- **Catalog Sync Logs**: These logs track synchronization activities of the catalog, including updates, deletions, and additions to the catalog items.

## Troubleshooting
### Unable to find logs in Athena
Ensure that the correct database and table are selected in Athena. Verify the query syntax and check for any filters that may exclude the logs.

### Old IYS logs not visible in CloudWatch
Check the log retention settings in CloudWatch to ensure that the logs have not been deleted. Also, verify that the correct log group is being accessed.

### Catalog sync logs not appearing in S3
Confirm that the logs have been correctly configured to be written to S3. Check the permissions of the S3 bucket to ensure logs can be stored.

## Troubleshooting
### Unable to find logs in Athena
Ensure that the correct database and table are selected in Athena. Verify the query syntax and check for any filters that may exclude the logs.

### Old IYS logs not visible in CloudWatch
Check the log retention settings in CloudWatch to ensure that the logs have not been deleted. Also, verify that the correct log group is being accessed.

### Catalog sync logs not appearing in S3
Confirm that the logs have been correctly configured to be written to S3. Check the permissions of the S3 bucket to ensure logs can be stored.`
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
