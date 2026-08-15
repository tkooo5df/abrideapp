import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kobsavfggcnfemdzsnpj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYnNhdmZnZ2NuZmVtZHpzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTk3ODEsImV4cCI6MjA3NDM3NTc4MX0._TfXDauroKe8EAv_Fv4PQAZfOqk-rHbXAlF8bOU3-Qk";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testInsert() {
  console.log("Testing insert...");
  const { data, error } = await supabase
    .from('platform_reviews')
    .insert([{
      reviewer_name: 'Test Reviewer',
      rating: 5,
      comment: 'Testing from Node',
      user_id: null
    }]);

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert success:", data);
  }
}

testInsert();
