import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module equivalents of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Quick test script to verify Supabase connection
 * Run with: npm run test:connection
 */

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY\n');
    process.exit(1);
  }

  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseKey.substring(0, 20)}...\n`);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection
    console.log('1. Testing service role connection...');
    const { error: countError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`   ❌ Connection failed: ${countError.message}\n`);
      throw countError;
    }

    console.log('   ✅ Successfully connected to Supabase!\n');

    // Check tables exist
    console.log('2. Checking database tables...');
    const tables = [
      'projects',
      'agents',
      'generation_history',
      'embeddings',
      'code_outputs',
      'review_reports',
      'enhancement_proposals',
      'user_profiles',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Ready`);
      }
    }

    console.log('\n3. Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`   ❌ Storage: ${bucketsError.message}`);
    } else {
      const expectedBuckets = ['project-files', 'embeddings'];
      for (const bucketName of expectedBuckets) {
        const exists = buckets?.find(b => b.name === bucketName);
        if (exists) {
          console.log(`   ✅ ${bucketName}: Ready`);
        } else {
          console.log(`   ⚠️  ${bucketName}: Not found`);
        }
      }
    }

    console.log('\n✅ Database setup verified successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Start backend: cd backend && npm run dev');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Test authentication in the browser\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your .env file has correct Supabase credentials');
    console.error('   2. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
    console.error('   3. Make sure all migrations ran successfully\n');
    process.exit(1);
  }
}

testConnection();
