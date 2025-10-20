import axios from 'axios';

const GRADIO_SPACE_URL = 'https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space';
const GRADIO_API_BASE = `${GRADIO_SPACE_URL}/gradio_api`;

async function testGradioAPI() {
  console.log('🧪 Testing Gradio API...\n');

  // Step 1: POST to start generation
  console.log('📤 Step 1: POST to /call/infer');
  const postResponse = await axios.post(
    `${GRADIO_API_BASE}/call/infer`,
    {
      data: [
        'A beautiful sunset over mountains',  // prompt
        '',                                    // negative_prompt
        0,                                     // seed
        true,                                  // randomize_seed
        512,                                   // width
        512,                                   // height
        0,                                     // guidance_scale
        1,                                     // num_inference_steps
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('📥 POST Response:');
  console.log(JSON.stringify(postResponse.data, null, 2));
  
  const eventId = postResponse.data?.event_id;
  if (!eventId) {
    console.error('❌ No event_id received!');
    return;
  }

  console.log(`\n✅ Event ID: ${eventId}`);
  console.log(`\n📤 Step 2: GET /call/infer/${eventId}`);

  // Step 2: Poll for results (faster polling)
  for (let i = 0; i < 20; i++) {
    console.log(`\n📊 Poll attempt ${i + 1}:`);
    
    try {
      const getResponse = await axios.get(
        `${GRADIO_API_BASE}/call/infer/${eventId}`,
        {
          headers: {
            Accept: 'text/event-stream',
          },
          timeout: 10000,
          responseType: 'text',
        }
      );

      const lines = getResponse.data.split('\n');
      
      let currentEvent = '';
      let hasData = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('event: ')) {
          currentEvent = trimmed.substring(7).trim();
          console.log(`  📌 Event: "${currentEvent}"`);
        }
        
        if (trimmed.startsWith('data: ')) {
          hasData = true;
          const dataStr = trimmed.substring(6).trim();
          console.log(`  📦 Data: ${dataStr.substring(0, 200)}`);
          
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed?.output?.data) {
              console.log(`  ✅ RESULT FOUND!`, JSON.stringify(parsed.output.data, null, 2));
              return;
            }
          } catch (e) {
            // Not JSON or invalid
          }
        }
      }
      
      if (!hasData) {
        console.log(`  ⚠️ No data in response`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error:`, error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

testGradioAPI().catch(console.error);
