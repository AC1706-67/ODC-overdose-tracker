require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingData() {
  try {
    console.log('Checking existing zip_code data...');
    
    // Get all unique zip_code values and their counts
    const { data, error } = await supabase
      .from('incidents')
      .select('zip_code')
      .order('zip_code');
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log(`Total incidents: ${data.length}`);
    
    if (data.length === 0) {
      console.log('✅ No existing data - safe to apply any constraint');
      return;
    }
    
    // Analyze the zip_code values
    const zipCounts = {};
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
        zipCounts[zip] = (zipCounts[zip] || 0) + 1;
      }
    });
    
    console.log('\nData analysis:');
    console.log(`- Valid 5-digit ZIP codes: ${validZipCount}`);
    console.log(`- NULL values: ${nullCount}`);
    console.log(`- Empty strings: ${emptyCount}`);
    console.log(`- Invalid/other values: ${invalidCount}`);
    
    if (invalidCount > 0) {
      console.log('\nInvalid values found:');
      Object.entries(zipCounts).forEach(([zip, count]) => {
        console.log(`  "${zip}": ${count} occurrences`);
      });
    }
    
    // Recommendation
    console.log('\n--- RECOMMENDATION ---');
    if (nullCount > 0 || emptyCount > 0 || invalidCount > 0) {
      console.log('⚠️  Non-conforming data exists. Recommend Option C:');
      console.log('   1. Normalize existing data first');
      console.log('   2. Add constraint with NOT VALID');
      console.log('   3. Validate constraint');
    } else {
      console.log('✅ All data conforms. Safe to use Option A (case-insensitive)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingData();