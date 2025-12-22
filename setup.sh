#!/bin/bash

echo "🎮 Setting up Wavelength Game Backend..."

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
supabase supabase db reset

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔗 Supabase Services:"
echo "   API URL: http://localhost:54321"
echo "   Studio URL: http://localhost:54323"
echo ""
echo "📚 Database Tables Created:"
echo "   ✓ game_rooms - Game room management"
echo "   ✓ players - Player information"
echo "   ✓ game_state - Current game state tracking"
echo "   ✓ rounds - Round data and concepts"
echo "   ✓ dial_updates - Real-time dial positions"
echo "   ✓ signaling - WebRTC peer connections"
echo ""
echo "🎯 Next Steps:"
echo "   1. Run: npm run dev"
echo "   2. Visit: http://localhost:3000/wavelength"
echo "   3. Check BACKEND_README.md for API documentation"
echo ""
echo "🛑 To stop Supabase: supabase stop"