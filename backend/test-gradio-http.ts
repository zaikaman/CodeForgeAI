import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testGradioAPI() {
  const GRADIO_API_URL = 'https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space';
  const GRADIO_API_BASE = `${GRADIO_API_URL}/gradio_api`;
  
  const apiKey = process.env.HUGGING_FACE_TOKEN;
  
  console.log('🧪 Testing Gradio API HTTP Requests\n');
  
  // Step 1: POST to get event_id
  console.log('📤 Step 1: POST to /call/infer');
  const postResponse = await axios.post(
    `${GRADIO_API_BASE}/call/infer`,
    {
      data: [
        'A beautiful sunset',
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
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );
  
  console.log('✅ POST Response:', postResponse.data);
  const eventId = postResponse.data?.event_id;
  
  if (!eventId) {
    console.error('❌ No event_id!');
    return;
  }
  
  console.log(`\n📡 Event ID: ${eventId}`);
  console.log(`\n📤 Step 2: GET /call/infer/${eventId} (streaming)`);
  
  // Step 2: Stream the result
  const response = await axios.get(
    `${GRADIO_API_BASE}/call/infer/${eventId}`,
    {
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${apiKey}`,
      },
      responseType: 'stream',
      timeout: 120000,
    }
  );
  
  console.log('\n📥 Streaming response:\n');
  
  let buffer = '';
  
  response.data.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    buffer += text;
    
    // Process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        console.log(`  ${line}`);
        
        // Parse SSE events
        if (line.startsWith('event: ')) {
          const eventType = line.substring(7).trim();
          console.log(`    🔔 Event type: ${eventType}`);
        } else if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          try {
            const data = JSON.parse(dataStr);
            console.log(`    📦 Data:`, JSON.stringify(data).substring(0, 200));
            
            if (data.msg === 'process_completed') {
              console.log('\n✅ Process completed!');
              console.log('Result:', JSON.stringify(data, null, 2));
              process.exit(0);
            }
          } catch (e) {
            console.log(`    📦 Data (raw): ${dataStr.substring(0, 100)}`);
          }
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

testGradioAPI().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
