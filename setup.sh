#!/bin/bash

echo "🚀 Setting up HelloSupa..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Please install it first:"
    echo "npm install -g supabase"
    echo "or"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

# Start Supabase local development
echo "🐳 Starting Supabase..."
supabase start

# Run migrations
echo "📊 Running database migrations..."
supabase db reset

echo "✅ Setup complete!"
echo "🌐 Your Supabase is running at: http://localhost:54321"
echo "🎉 Visit http://localhost:3000/hellosupa to see your app!"
echo ""
echo "To stop Supabase, run: supabase stop"