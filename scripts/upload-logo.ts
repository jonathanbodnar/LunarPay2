import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadLogo() {
  const logoPath = path.join(__dirname, '../public/logo-dark.svg');
  const logoBuffer = fs.readFileSync(logoPath);

  // Create the assets bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets();
  const assetsBucket = buckets?.find(b => b.name === 'assets');
  
  if (!assetsBucket) {
    const { error: createError } = await supabase.storage.createBucket('assets', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (createError) {
      console.error('Error creating bucket:', createError);
      return;
    }
    console.log('Created assets bucket');
  }

  // Upload the logo
  const { data, error } = await supabase.storage
    .from('assets')
    .upload('logo.svg', logoBuffer, {
      contentType: 'image/svg+xml',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading logo:', error);
    return;
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('assets')
    .getPublicUrl('logo.svg');

  console.log('Logo uploaded successfully!');
  console.log('Public URL:', urlData.publicUrl);
}

uploadLogo();
