import fetch, { Response } from 'node-fetch';

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenAIAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

type FetchResponse = Response;

export async function callOpenAI(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
  const apiKey = process.env.spn_4o_AZURE_CLIENT_SECRET;
  // Get environment variables and clean them
  const rawEndpoint = process.env.spn_4o_azure_endpoint || '';
  const endpoint = rawEndpoint.replace(/\/+$/, '').replace('https://gk-oai.openai.azure.com', 'https://gk-oai-4.openai.azure.com');  // Fix endpoint
  const model = process.env.spn_4o_model || 'gpt-4o';
  const apiVersion = process.env.spn_4o_api_version || '2024-02-15-preview';

  // Log configuration for debugging
  console.log('OpenAI Configuration:', {
    rawEndpoint,
    cleanedEndpoint: endpoint,
    model,
    apiVersion,
    hasApiKey: !!apiKey
  });

  if (!apiKey) {
    throw new Error('Missing required OpenAI API key');
  }

  // Log all available environment variables for debugging
  console.log('Environment variables:', {
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    MODEL_NAME: process.env.MODEL_NAME,
    API_VERSION: process.env.spn_4o_api_version,
    hasApiKey: !!apiKey
  });

  console.log('OpenAI Configuration:', {
    endpoint,
    model,
    apiVersion,
    hasApiKey: !!apiKey,
    envEndpoint: process.env.spn_4o_azure_endpoint,
    envModel: process.env.spn_4o_model,
    envApiVersion: process.env.spn_4o_api_version
  });

  // Add retry logic
  const maxRetries = 3;
  let retryCount = 0;

  if (!apiKey) {
    throw new Error('Missing required OpenAI configuration');
  }

  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;
  
  console.log('OpenAI Request:', {
    url,
    messageCount: messages.length,
    hasApiKey: !!apiKey
  });

  try {
    let lastError: Error | null = null;
    let response: FetchResponse | null = null;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify({
            messages,
            temperature: 0.7,
            max_tokens: 800
          })
        });
        response = fetchResponse;

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          console.error('OpenAI API error:', {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            error: errorText
          });
          throw new Error(`OpenAI API error: ${fetchResponse.statusText}`);
        }

        const data = await fetchResponse.json() as OpenAIAPIResponse;
        console.log('OpenAI Response:', data);

        return {
          id: data.id,
          choices: data.choices.map(choice => ({
            message: {
              content: choice.message?.content || ''
            }
          }))
        };
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Max retries reached:', lastError);
          throw lastError;
        }
        console.log(`Retrying... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    throw new Error('Failed to call OpenAI API after all retries');
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to call OpenAI API');
  }
}
