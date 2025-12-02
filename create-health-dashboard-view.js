const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createHealthDashboardView() {
  try {
    console.log('🏥 Creating health_dashboard_v1 view...');

    const createViewSQL = `
      CREATE OR REPLACE VIEW health_dashboard_v1 AS
      SELECT 
        organization_id,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as incidents_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND narcan_used = true) as with_narcan_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND survival = 'Survived') as survived_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND survival = 'Deceased') as deceased_30d,
        COUNT(DISTINCT zip_code) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as zips_30d,
        NOW() as refreshed_at
      FROM incidents
      GROUP BY organization_id
      
      UNION ALL
      
      -- Add a row for anonymous/null organization data
      SELECT 
        NULL as organization_id,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as incidents_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND narcan_used = true) as with_narcan_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND survival = 'Survived') as survived_30d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days' AND survival = 'Deceased') as deceased_30d,
        COUNT(DISTINCT zip_code) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as zips_30d,
        NOW() as refreshed_at
      FROM incidents
      WHERE organization_id IS NULL;
    `;

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: createViewSQL,
    });

    if (error) {
      console.log('❌ Error creating view:', error);
    } else {
      console.log('✅ health_dashboard_v1 view created successfully');
    }

    // Grant permissions on the view
    console.log('🔐 Granting permissions on view...');
    await supabase.rpc('exec_sql', {
      sql_query: 'GRANT SELECT ON health_dashboard_v1 TO authenticated, anon;',
    });

    // Test the view
    console.log('🧪 Testing the view...');
    const { data: testData, error: testError } = await supabase
      .from('health_dashboard_v1')
      .select('*')
      .eq('organization_id', null)
      .single();

    if (testError) {
      console.log('❌ Test error:', testError);
    } else {
      console.log('✅ View test successful:', testData);
    }

    console.log('\n🎉 Health dashboard view is ready!');
  } catch (err) {
    console.error('❌ Error creating health dashboard view:', err);
  }
}

createHealthDashboardView();
