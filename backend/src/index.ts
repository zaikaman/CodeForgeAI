import dotenv from 'dotenv';
import { server } from './api/server';
import { checkSupabaseConnection } from './storage/SupabaseClient';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
🚀 CodeForge AI Backend Server Starting...
📡 Server running on: http://localhost:${PORT}
🏥 Health check: http://localhost:${PORT}/api/status
✨ Environment: ${process.env.NODE_ENV || 'development'}
📝 Press Ctrl+C to stop
`);

  // Test database connection on startup
  checkSupabaseConnection()
    .then(isConnected => {
      if (isConnected) {
        console.log('✅ Supabase connection verified.');
      } else {
        console.warn('⚠️  Could not connect to Supabase.');
      }
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Supabase connection error:', message);
    });
});

export default server;
