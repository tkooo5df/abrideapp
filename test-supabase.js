import { createClient } from '@supabase/supabase-js';

// Using your Supabase credentials
const supabaseUrl = 'https://yhgwamnugcobegewbowe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZ3dhbW51Z2NvYmVnZXdib3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDgwMDcsImV4cCI6MjA3NDYyNDAwN30.QbpKZ7wcwCCbc9zWt9t88r-czuUMSk3YaFDan9EJmYQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Simple test query to check if we can connect
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Supabase connection test failed:', error.message);
      return false;
    }

    console.log('Supabase connection successful!');
    return true;
  } catch (err) {
    console.log('Supabase connection error:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ Supabase is accessible');
  } else {
    console.log('❌ Supabase is not accessible - check your project status in the dashboard');
  }
  process.exit(success ? 0 : 1);
});