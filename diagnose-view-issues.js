const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseViewIssues() {
  try {
    console.log('🔍 Diagnosing view issues...\n');
    
    // 1. Check if incidents table exists and what columns it has
    console.log('1. Checking incidents table structure...');
    const { data: incidentsColumns, error: colError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'incidents' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        ` 
      });
    
    if (colError) {
      console.log('❌ Error checking columns:', colError);
    } else if (incidentsColumns) {
      console.log('✅ Incidents table columns:');
      incidentsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // 2. Check if any views exist
    console.log('\n2. Checking existing views...');
    const { data: views, error: viewError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT table_name, view_definition 
          FROM information_schema.views 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        ` 
      });
    
    if (viewError) {
      console.log('❌ Error checking views:', viewError);
    } else if (views && views.length > 0) {
      console.log('✅ Existing views:');
      views.forEach(view => {
        console.log(`  - ${view.table_name}`);
      });
    } else {
      console.log('ℹ️  No views found in public schema');
    }
    
    // 3. Check what data is actually in incidents table
    console.log('\n3. Checking incidents table data...');
    const { data: sampleData, error: dataError } = await supabase
      .from('incidents')
      .select('*')
      .limit(3);
    
    if (dataError) {
      console.log('❌ Error checking data:', dataError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample incidents data:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('ℹ️  No data in incidents table');
    }
    
    // 4. Try to create a simple test view
    console.log('\n4. Testing view creation...');
    const { data: testView, error: testError } = await supabase
      .rpc('sql', { 
        query: `
          CREATE OR REPLACE VIEW test_health_view AS
          SELECT 
            COUNT(*) as total_incidents,
            COUNT(*) FILTER (WHERE narcan_used = true) as with_narcan,
            COUNT(DISTINCT zip_code) as unique_zips
          FROM incidents;
        ` 
      });
    
    if (testError) {
      console.log('❌ Error creating test view:', testError);
    } else {
      console.log('✅ Test view created successfully');
      
      // Test querying the view
      const { data: testQuery, error: queryError } = await supabase
        .from('test_health_view')
        .select('*')
        .single();
      
      if (queryError) {
        console.log('❌ Error querying test view:', queryError);
      } else {
        console.log('✅ Test view query result:', testQuery);
      }
    }
    
  } catch (err) {
    console.error('❌ Diagnostic error:', err);
  }
}

diagnoseViewIssues();