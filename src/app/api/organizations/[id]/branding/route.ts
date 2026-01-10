import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for logo upload
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// GET /api/organizations/:id/branding - Get branding settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const organizationId = parseInt(id);

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        name: true,
        logo: true,
        primaryColor: true,
        backgroundColor: true,
        buttonTextColor: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ branding: organization });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get branding error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/:id/branding - Update branding settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const organizationId = parseInt(id);

    // Verify ownership
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        logo: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { primaryColor, backgroundColor, buttonTextColor, logoBase64, logoFileName, removeLogo } = body;

    let logoUrl = organization.logo;
    let logoUploadError: string | null = null;

    // Handle logo removal
    if (removeLogo) {
      logoUrl = null;
    }
    // Handle logo upload if provided
    else if (logoBase64 && logoFileName) {
      if (!supabase) {
        console.error('Supabase not configured. URL:', supabaseUrl ? 'Set' : 'Missing', 'Key:', supabaseServiceKey ? 'Set' : 'Missing');
        logoUploadError = 'Storage service not configured';
      } else {
        try {
          console.log('Uploading logo for org:', organizationId, 'File:', logoFileName);
          
          // Convert base64 to buffer
          const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          // Determine content type
          const extension = logoFileName.split('.').pop()?.toLowerCase() || 'png';
          const contentType = extension === 'jpg' || extension === 'jpeg' 
            ? 'image/jpeg' 
            : 'image/png';

          // Upload to Supabase Storage
          const fileName = `org-${organizationId}-logo-${Date.now()}.${extension}`;
          
          // Ensure bucket exists
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
          }
          
          if (!buckets?.find(b => b.name === 'logos')) {
            console.log('Creating logos bucket...');
            const { error: createError } = await supabase.storage.createBucket('logos', { public: true });
            if (createError) {
              console.error('Error creating bucket:', createError);
            }
          }

          const { data, error } = await supabase.storage
            .from('logos')
            .upload(fileName, buffer, {
              contentType,
              upsert: true,
            });

          if (error) {
            console.error('Logo upload error:', error);
            logoUploadError = error.message;
          } else {
            console.log('Logo uploaded successfully:', data);
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('logos')
              .getPublicUrl(fileName);
            
            logoUrl = urlData.publicUrl;
            console.log('Logo URL:', logoUrl);
          }
        } catch (uploadError) {
          console.error('Logo upload failed:', uploadError);
          logoUploadError = (uploadError as Error).message;
        }
      }
    }

    // Update organization with branding settings
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        logo: logoUrl,
        primaryColor: primaryColor || '#000000',
        backgroundColor: backgroundColor || '#ffffff',
        buttonTextColor: buttonTextColor || '#ffffff',
      },
      select: {
        id: true,
        name: true,
        logo: true,
        primaryColor: true,
        backgroundColor: true,
        buttonTextColor: true,
      },
    });

    return NextResponse.json({ 
      branding: updatedOrg,
      ...(logoUploadError && { warning: `Logo upload failed: ${logoUploadError}` }),
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Update branding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

