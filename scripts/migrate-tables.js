const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Portal columns
    console.log('Adding portal columns...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE church_detail 
      ADD COLUMN IF NOT EXISTS portal_slug VARCHAR(100),
      ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS portal_custom_domain VARCHAR(255),
      ADD COLUMN IF NOT EXISTS portal_title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS portal_description TEXT
    `);
    console.log('✓ Portal columns added');

    // Products show_on_portal
    console.log('Adding products column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS show_on_portal BOOLEAN DEFAULT false
    `);
    console.log('✓ Products column added');

    // Team invites table
    console.log('Creating team_invites table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS team_invites (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        invited_by INTEGER NOT NULL,
        email VARCHAR(254) NOT NULL,
        role VARCHAR(20) NOT NULL,
        permissions TEXT,
        token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Team invites table created');

    // Team members table
    console.log('Creating team_members table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        organization_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL,
        permissions TEXT,
        invited_by INTEGER,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, organization_id)
      )
    `);
    console.log('✓ Team members table created');

    // Email templates table
    console.log('Creating email_templates table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        heading VARCHAR(255),
        body_text TEXT,
        button_text VARCHAR(100),
        footer_text TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, template_type)
      )
    `);
    console.log('✓ Email templates table created');

    console.log('\n✅ All migrations completed successfully!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

