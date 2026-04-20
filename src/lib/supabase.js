import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rszlhgthmdyabptrinoi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzemxoZ3RobWR5YWJwdHJpbm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDAyMzIsImV4cCI6MjA5MjI3NjIzMn0.jdp3SLG7CMxPDLSmvonofvo3tMAB81pkfHLnJh8Fp08'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
