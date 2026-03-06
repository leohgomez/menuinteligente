import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qazhveotdnktxhcdahwt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhemh2ZW90ZG5rdHhoY2RhaHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODA4NTYsImV4cCI6MjA4ODM1Njg1Nn0.zCtUOodXrPej49m3Wa2kWKWj9NDjsJ94DrlUrv1bCOw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
