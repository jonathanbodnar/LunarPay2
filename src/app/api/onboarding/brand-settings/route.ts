import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Maximum logo size: 500 KB (matching PHP BRAND_MAX_LOGO_SIZE)
const MAX_LOGO_SIZE_KB = 500;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_KB * 1024;

// Validation schema matching PHP Chat_setting_model
// Note: logo can be string (existing path) or File (new upload), so we validate separately
const brandSettingsSchema = z.object({
  organizationId: z.number().int().positive('Organization ID is required'),
  subOrganizationId: z.number().int().positive().optional().nullable(),
  
  // Colors
  themeColor: z.string().max(20).optional().nullable(),
  buttonTextColor: z.string().max(20).optional().nullable(),
  
  // Domain (removes http:// and https://)
  domain: z.string().max(255).optional().nullable(),
  
  // Widget settings
  suggestedAmounts: z.string().optional().nullable(),
  triggerText: z.string().max(255).optional().nullable(),
  debugMessage: z.string().optional().nullable(),
  typeWidget: z.string().max(20).optional().nullable(),
  widgetPosition: z.string().max(20).optional().nullable(),
  widgetLocation: z.string().max(20).optional().nullable(),
  conduitFunds: z.string().optional().nullable(),
  
  // Logo handling - can be string (existing) or File (new upload)
  logo: z.union([z.string(), z.instanceof(File)]).optional().nullable(),
  imageChanged: z.string().optional(), // "1" if logo was changed
});

// GET /api/onboarding/brand-settings?organizationId=1&subOrganizationId=null
export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const organizationId = parseInt(searchParams.get('organizationId') || '0');
    const subOrganizationId = searchParams.get('subOrganizationId') 
      ? parseInt(searchParams.get('subOrganizationId')!) 
      : null;

    if (!organizationId) {
      return NextResponse.json(
        { status: false, message: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });

    if (!organization) {
      return NextResponse.json(
        { status: false, message: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Get chat setting matching PHP getChatSetting method
    const chatSetting = await prisma.chatSetting.findFirst({
      where: {
        userId: currentUser.userId,
        organizationId: organizationId,
        subOrganizationId: subOrganizationId || null,
      },
    });

    return NextResponse.json({
      status: true,
      data: chatSetting || null,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Get brand settings error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding/brand-settings - Save brand settings
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const formData = await request.formData();
    
    // Extract form data
    const data: Record<string, any> = {
      organizationId: formData.get('organizationId') 
        ? parseInt(formData.get('organizationId') as string) 
        : null,
      subOrganizationId: formData.get('subOrganizationId')
        ? parseInt(formData.get('subOrganizationId') as string)
        : null,
      themeColor: formData.get('themeColor') || null,
      buttonTextColor: formData.get('buttonTextColor') || null,
      domain: formData.get('domain') || null,
      suggestedAmounts: formData.get('suggestedAmounts') || null,
      triggerText: formData.get('triggerText') || null,
      debugMessage: formData.get('debugMessage') || null,
      typeWidget: formData.get('typeWidget') || null,
      widgetPosition: formData.get('widgetPosition') || null,
      widgetLocation: formData.get('widgetLocation') || null,
      conduitFunds: formData.get('conduitFunds') || null,
    };

    // Handle logo separately - can be File (upload) or string (existing path)
    const logoField = formData.get('logo');
    const logo = logoField instanceof File ? logoField : (typeof logoField === 'string' && logoField ? logoField : null);
    const imageChanged = formData.get('imageChanged') || null;

    // Validate input (excluding logo and imageChanged from schema validation)
    const validatedDataWithoutLogo = brandSettingsSchema.omit({ logo: true, imageChanged: true }).parse(data);
    const validatedData = { ...validatedDataWithoutLogo, logo, imageChanged };

    if (!validatedData.organizationId) {
      return NextResponse.json(
        { status: false, message: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: validatedData.organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });

    if (!organization) {
      return NextResponse.json(
        { status: false, message: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare save data matching PHP Chat_setting_model->save()
    const saveData: Record<string, any> = {};

    if (validatedData.themeColor !== undefined) {
      saveData.themeColor = validatedData.themeColor;
    }

    if (validatedData.buttonTextColor !== undefined) {
      saveData.buttonTextColor = validatedData.buttonTextColor;
    }

    // Process domain - remove http:// and https:// (matching PHP logic)
    if (validatedData.domain !== undefined && validatedData.domain) {
      let domain = validatedData.domain;
      const disallowed = ['http://', 'https://'];
      for (const prefix of disallowed) {
        if (domain.startsWith(prefix)) {
          domain = domain.replace(prefix, '');
        }
      }
      saveData.domain = domain.toLowerCase();
    }

    if (validatedData.suggestedAmounts !== undefined) {
      saveData.suggestedAmounts = validatedData.suggestedAmounts;
    }

    if (validatedData.triggerText !== undefined) {
      saveData.triggerText = validatedData.triggerText;
    }

    if (validatedData.debugMessage !== undefined) {
      saveData.debugMessage = validatedData.debugMessage;
    }

    if (validatedData.typeWidget !== undefined) {
      saveData.typeWidget = validatedData.typeWidget;
    }

    if (validatedData.widgetPosition !== undefined) {
      saveData.widgetPosition = validatedData.widgetPosition;
    }

    if (validatedData.widgetLocation !== undefined) {
      saveData.widgetLocation = validatedData.widgetLocation;
    }

    if (validatedData.conduitFunds !== undefined) {
      saveData.conduitFunds = validatedData.conduitFunds;
    }

    // Handle logo upload (matching PHP logic)
    let logoPath: string | null = null;
    const logoFile = validatedData.logo instanceof File ? validatedData.logo : null;
    const existingLogoPath = typeof validatedData.logo === 'string' ? validatedData.logo : null;
    
    // If logo is a File and imageChanged is "1", process the upload
    if (logoFile && validatedData.imageChanged === '1') {
      // Validate file type
      const allowedTypes = ['image/gif', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(logoFile.type)) {
        return NextResponse.json(
          { 
            status: false, 
            message: 'Invalid file type. Allowed types: gif, jpg, jpeg, png' 
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (logoFile.size > MAX_LOGO_SIZE_BYTES) {
        return NextResponse.json(
          { 
            status: false, 
            message: `File size exceeds maximum allowed size of ${MAX_LOGO_SIZE_KB} KB` 
          },
          { status: 400 }
        );
      }

      // Upload logo matching PHP file naming: u{userId}_ch{churchId}[_cm{subOrgId}]
      const logoCategory = 'branding_logo';
      const fileExtension = logoFile.name.split('.').pop() || 'png';
      let fileName = `u${currentUser.userId}_ch${validatedData.organizationId}`;
      
      if (validatedData.subOrganizationId) {
        fileName += `_cm${validatedData.subOrganizationId}`;
      }
      
      fileName += `.${fileExtension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', logoCategory);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const filePath = join(uploadDir, fileName);
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Store path with timestamp query param (matching PHP)
      logoPath = `${logoCategory}/${fileName}?v=${Date.now()}`;
      saveData.logo = logoPath;
    } else if (existingLogoPath) {
      // Use existing logo path (string)
      saveData.logo = existingLogoPath;
    }

    // Check if chat setting exists
    const existingChatSetting = await prisma.chatSetting.findFirst({
      where: {
        userId: currentUser.userId,
        organizationId: validatedData.organizationId,
        subOrganizationId: validatedData.subOrganizationId || null,
      },
    });

    let result;
    if (!existingChatSetting) {
      // Create new chat setting
      result = await prisma.chatSetting.create({
        data: {
          userId: currentUser.userId,
          organizationId: validatedData.organizationId,
          subOrganizationId: validatedData.subOrganizationId || null,
          ...saveData,
        },
      });
    } else {
      // Update existing chat setting
      result = await prisma.chatSetting.update({
        where: { id: existingChatSetting.id },
        data: saveData,
      });
    }

    return NextResponse.json({
      status: true,
      message: 'Brand Settings Saved',
      data: { id: result.id },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      }).join(', ');
      return NextResponse.json(
        { status: false, message: errorMessages },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Save brand settings error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

