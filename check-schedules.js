const fs = require('fs');
const { createClient } = require("@supabase/supabase-js");

const envVars = fs.readFileSync('/Users/karimshaikh/Desktop/plutonium/.env', 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    if (key) {
      acc[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
    }
    return acc;
  }, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchedules() {
  const { data, error } = await supabase.from("schedules").select("*, medications(name), slots(slot_number)");
  console.log("Error:", error);
  console.log("Schedules DB:", JSON.stringify(data, null, 2));
}

checkSchedules();
