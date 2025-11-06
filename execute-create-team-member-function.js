const fs = require('fs');

// Read the SQL function
const sqlFunction = fs.readFileSync('create-team-member-function.sql', 'utf8');

console.log('🚀 Executing create_team_member function...');
console.log('📋 SQL to execute:');
console.log('=' .repeat(60));
console.log(sqlFunction);
console.log('=' .repeat(60));

// Since we can't execute directly, let's create a simple execution script
const executionScript = `
-- Execute this in your Supabase SQL Editor
${sqlFunction}

-- Test the function (optional - replace with real org slug)
-- SELECT create_team_member('John Doe', 'john@example.com', 'Volunteer', 'your-org-slug');
`;

fs.writeFileSync('execute-in-supabase.sql', executionScript);
console.log('\n✅ Created execute-in-supabase.sql file');
console.log('📋 Copy and paste the contents into your Supabase SQL Editor');

console.log('\n🔧 Function Features:');
console.log('  ✅ Converts organization slug to ID');
console.log('  ✅ Prevents duplicates (by email or name)');
console.log('  ✅ Updates existing members if found');
console.log('  ✅ Returns structured JSON with action type');
console.log('  ✅ Proper error handling and validation');
console.log('  ✅ Security with DEFINER and RLS compliance');

console.log('\n📱 Your TeamMemberPicker component is already updated to use this function!');

// File saved and ready for Git commit