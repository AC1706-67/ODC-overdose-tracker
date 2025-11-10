require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOutreachZipData() {
  try {
    console.log('Checking existing outreach_logs zip_code data...');
    
    // Get all unique zip_code values
    const { data, error } = await supabase
      .from('outreach_logs')
      .select('zip_code')
      .order('zip_code');
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log(`Total outreach logs: ${data.length}`);
    
    if (data.length === 0) {
      console.log('✅ No existing outreach data - safe to apply constraint');
      return;
    }
    
    // Analyze the zip_code values
    let nullCount = 0;
    let emptyCount = 0;
    let validZipCount = 0;
    let invalidCount = 0;
    
    data.forEach(row => {
      const zip = row.zip_code;
      
      if (zip === null) {
        nullCount++;
      } else if (zip === '') {
        emptyCount++;
      } else if (/^[0-9]{5}$/.test(zip)) {
        validZipCount++;
      } else {
        invalidCount++;
      }
    });
    
    console.log('\nOutreach logs data analysis:');
    console.log(`- Valid 5-digit ZIP codes: ${validZipCount}`);
    console.log(`- NULL values: ${nullCount}`);
    console.log(`- Empty strings: ${emptyCount}`);
    console.log(`- Invalid/other values: ${invalidCount}`);
    
    console.log('\n--- OUTREACH LOGS CONSTRAINT UPDATE NEEDED ---');
    console.log('You need to run this SQL in Supabase dashboard:');
    console.log('');
    console.log('ALTER TABLE outreach_logs DROP CONSTRAINT IF EXISTS outreach_logs_zip_code_check;');
    console.log('ALTER TABLE outreach_logs ADD CONSTRAINT outreach_logs_zip_code_check');
    console.log("  CHECK (zip_code ~ '^[0-9]{5}$' OR upper(btrim(zip_code)) IN ('NA','UNKNOWN') OR zip_code IS NULL);");
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOutreachZipData();