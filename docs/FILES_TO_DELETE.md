# Files Safe to Delete - Quick Reference

## API Routes (4 files)
```bash
app/api/rooms/route.ts
app/api/participants/route.ts
app/api/signaling/route.ts
app/api/messages/route.ts
```

## Test/Demo Pages (2 files)
```bash
app/hellowebrtc/page.tsx
app/hellosupa/page.tsx
```

## Old P2P Implementation (3 files)
```bash
lib/webrtc.ts
lib/wavelength-p2p.ts
lib/hooks/useWavelengthP2P.ts
```

## Example/Reference Code (1 file)
```bash
components/examples/GameIntegrationExample.tsx
```

---

## Total: 10 files ready for deletion

All of these are:
- ✅ Not used in the main Wavelength game
- ✅ Related to old WebRTC P2P implementation OR test pages
- ✅ Safe to delete without affecting game functionality

The game currently uses:
- 6 APIs in `/api/game/*` (KEEP)
- Supabase Realtime for live updates
- Zustand for state management

**Awaiting your approval to proceed with deletion.**
