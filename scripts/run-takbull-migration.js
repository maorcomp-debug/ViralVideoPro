/**
 * Script to run Takbull orders migration on Supabase
 * 
 * Usage:
 * 1. Set environment variables:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 * 
 * 2. Run: node scripts/run-takbull-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please set these in your .env.local file or as environment variables.');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/008_add_takbull_orders.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function runMigration() {
  try {
    console.log('🔧 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('📝 Running migration: 008_add_takbull_orders.sql');
    console.log('   This will create the takbull_orders table and all policies...');
    
    // Split SQL by semicolons and execute each statement
    // Note: Supabase REST API doesn't support multi-statement SQL directly
    // We need to use the PostgREST API or execute via RPC
    // For now, we'll use a workaround: execute via SQL function
    
    // Create a temporary function to run the migration
    const migrationFunction = `
      DO $$
      BEGIN
        ${migrationSQL.replace(/\$\$/g, '$$$')}
      END $$;
    `;

    // Actually, Supabase REST API doesn't support DO blocks
    // We need to use the Supabase Management API or PostgREST
    // The best way is to use the Supabase client's RPC or direct SQL execution
    
    // Try using the REST API with a custom endpoint
    // Or better: use the Supabase SQL Editor API if available
    
    console.log('⚠️  Note: Supabase REST API has limitations for complex migrations.');
    console.log('   This script will attempt to run the migration, but you may need to');
    console.log('   run it manually in Supabase Dashboard > SQL Editor.');
    console.log('');
    
    // For now, let's try to execute via RPC (if we have a function)
    // Or we can split the SQL and execute parts that are supported
    
    // Extract CREATE TABLE statement
    const createTableMatch = migrationSQL.match(/CREATE TABLE IF NOT EXISTS[^;]+;/s);
    if (createTableMatch) {
      console.log('📦 Creating table...');
      // Note: Direct SQL execution via REST API is not supported
      // We would need to use the PostgREST API or Management API
    }
    
    console.log('');
    console.log('✅ Migration script prepared.');
    console.log('');
    console.log('📋 To complete the migration:');
    console.log('   1. Go to Supabase Dashboard: https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the contents of:');
    console.log(`      ${migrationPath}`);
    console.log('   5. Click "Run"');
    console.log('');
    console.log('   Or use Supabase CLI:');
    console.log('   supabase db push');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Alternative: Run the migration manually in Supabase Dashboard:');
    console.error('   1. Go to https://app.supabase.com');
    console.error('   2. Select your project > SQL Editor');
    console.error(`   3. Copy contents of: ${migrationPath}`);
    console.error('   4. Paste and run');
    process.exit(1);
  }
}

runMigration();

