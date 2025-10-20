import axios from 'axios';

const GRADIO_SPACE_URL = 'https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space';
const GRADIO_API_BASE = `${GRADIO_SPACE_URL}/gradio_api`;

async function testGradioStreaming() {
  console.log('🧪 Testing Gradio API with streaming...\n');

  // Step 1: POST to start generation
  console.log('📤 Step 1: POST to /call/infer');
  const postResponse = await axios.post(
    `${GRADIO_API_BASE}/call/infer`,
    {
      data: [
        'A beautiful sunset over mountains',
        '',
        0,
        true,
        512,
        512,
        0,
        1,
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const eventId = postResponse.data?.event_id;
  console.log(`✅ Event ID: ${eventId}\n`);

  // Step 2: Stream the response with proper SSE handling
  console.log('📤 Step 2: Streaming GET request...\n');
  
  const response = await axios.get(
    `${GRADIO_API_BASE}/call/infer/${eventId}`,
    {
      headers: {
        Accept: 'text/event-stream',
      },
      responseType: 'stream',
      timeout: 120000,
    }
  );

  let buffer = '';
  let eventType = '';

  response.data.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    
    // Keep incomplete line in buffer
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('event: ')) {
        eventType = trimmed.substring(7).trim();
        console.log(`📌 Event: ${eventType}`);
      } else if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.substring(6).trim();
        console.log(`📦 Data (${eventType}): ${dataStr.substring(0, 150)}`);
        
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed?.output?.data) {
            console.log('\n✅ RESULT RECEIVED!');
            console.log(JSON.stringify(parsed.output.data, null, 2));
            process.exit(0);
          }
        } catch (e) {
          // Continue
        }
      }
    }
  });

  response.data.on('end', () => {
    console.log('\n📡 Stream ended');
    process.exit(0);
  });

  response.data.on('error', (err: Error) => {
    console.error('\n❌ Stream error:', err.message);
    process.exit(1);
  });
}

testGradioStreaming().catch(console.error);
