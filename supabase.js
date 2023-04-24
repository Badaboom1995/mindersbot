const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = 'https://qjmbmdtgnadklknnthgd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWJtZHRnbmFka2xrbm50aGdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDIyNzk2MCwiZXhwIjoxOTk1ODAzOTYwfQ.mQeh_qlXiQFtKa7ferhzrgvw0TAfi8Pgu7vdiKZllQU'
const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = {supabase}
