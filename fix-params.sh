#!/bin/bash
# Fix Next.js 16 params in remaining routes

echo "Fixing async params in API routes..."

# List of files to fix
files=(
  "src/app/api/invoices/[id]/pdf/route.ts"
  "src/app/api/invoices/[id]/send-email/route.ts"  
  "src/app/api/transactions/[id]/refund/route.ts"
  "src/app/api/team/[id]/route.ts"
  "src/app/api/team/[id]/resend-invitation/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Use sed to replace the params pattern
    sed -i '' 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
    sed -i '' 's/params\.id/id/g' "$file"
    # Add the await params line after the function signature
    sed -i '' '/{ params }: { params: Promise<{ id: string }> }/a\
  const { id } = await params;
' "$file"
  else
    echo "File not found: $file"
  fi
done

echo "Done! Please review changes and commit."

