import { supabase } from './src/storage/SupabaseClient.js';

async function checkLatestGeneration() {
  const { data, error } = await supabase
    .from('generations')
    .select('id, prompt, files, preview_url, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('Generation ID:', data.id);
  console.log('Prompt:', data.prompt);
  console.log('Preview URL:', data.preview_url);
  console.log('Created:', data.created_at);
  console.log('\n===== FILES =====');
  
  const files = data.files as Array<{ path: string; content: string }>;
  
  if (!files || files.length === 0) {
    console.log('❌ NO FILES GENERATED!');
  } else {
    console.log(`✅ Generated ${files.length} files:`);
    
    // Check first file for escaping issues
    const firstFile = files[0];
    console.log(`\n[ESCAPING TEST] First file: ${firstFile.path}`);
    console.log('First 100 chars RAW:', JSON.stringify(firstFile.content.substring(0, 100)));
    console.log('Contains literal \\n?', firstFile.content.includes('\\n'));
    console.log('Contains actual newline?', firstFile.content.includes('\n'));
    
    files.forEach((file, idx) => {
      console.log(`\n[${idx + 1}] ${file.path} (${file.content.length} chars)`);
      console.log(file.content.substring(0, 500));
      if (file.content.length > 500) {
        console.log('...(truncated)');
      }
    });
  }
}

checkLatestGeneration();
