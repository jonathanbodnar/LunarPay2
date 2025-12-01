#!/bin/bash

# LunarPay 2.0 - Create Test Users Script
# Replace YOUR_RAILWAY_URL with your actual Railway URL

RAILWAY_URL="https://your-app.railway.app"

echo "🚀 Creating test users for LunarPay 2.0..."
echo ""

# Test User 1: Admin Account
echo "📧 Creating Admin account..."
curl -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lunarpay.io",
    "password": "Admin123456!",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1 (555) 001-0001",
    "paymentProcessor": "FTS"
  }'
echo ""
echo ""

# Test User 2: Merchant Account
echo "📧 Creating Merchant account..."
curl -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@test.com",
    "password": "Merchant123!",
    "firstName": "John",
    "lastName": "Merchant",
    "phone": "+1 (555) 002-0002",
    "paymentProcessor": "FTS"
  }'
echo ""
echo ""

# Test User 3: Demo Account
echo "📧 Creating Demo account..."
curl -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@lunarpay.io",
    "password": "Demo123456!",
    "firstName": "Demo",
    "lastName": "Account",
    "phone": "+1 (555) 003-0003",
    "paymentProcessor": "FTS"
  }'
echo ""
echo ""

# Test User 4: Test Church
echo "📧 Creating Church account..."
curl -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "church@example.org",
    "password": "Church123!",
    "firstName": "First",
    "lastName": "Church",
    "phone": "+1 (555) 004-0004",
    "paymentProcessor": "FTS"
  }'
echo ""
echo ""

# Test User 5: Development Account
echo "📧 Creating Development account..."
curl -X POST "$RAILWAY_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@lunarpay.io",
    "password": "Dev123456!",
    "firstName": "Developer",
    "lastName": "Test",
    "phone": "+1 (555) 005-0005",
    "paymentProcessor": "FTS"
  }'
echo ""
echo ""

echo "✅ All test users created!"
echo ""
echo "📋 Test Credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Admin Account"
echo "   Email: admin@lunarpay.io"
echo "   Password: Admin123456!"
echo ""
echo "2. Merchant Account"
echo "   Email: merchant@test.com"
echo "   Password: Merchant123!"
echo ""
echo "3. Demo Account"
echo "   Email: demo@lunarpay.io"
echo "   Password: Demo123456!"
echo ""
echo "4. Church Account"
echo "   Email: church@example.org"
echo "   Password: Church123!"
echo ""
echo "5. Development Account"
echo "   Email: dev@lunarpay.io"
echo "   Password: Dev123456!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Login at: $RAILWAY_URL/login"

