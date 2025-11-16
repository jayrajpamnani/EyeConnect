# Video Call Setup Guide

## Overview

The video call feature now uses **WebRTC** (Web Real-Time Communication) for peer-to-peer video connections and **Supabase Realtime** for signaling between users.

## How It Works

1. **Help Request**: A user needing help creates a call room with a unique ID
2. **Volunteer Matching**: A volunteer accepts the request and joins the same room
3. **WebRTC Connection**: Both users establish a direct peer-to-peer video connection
4. **Video Call**: Audio and video streams are exchanged in real-time

## Setup Instructions

### 1. Create a Supabase Project (Required for signaling)

If you haven't already:

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Wait for the project to be provisioned (takes ~2 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long JWT token)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
```

### 4. Enable Realtime in Supabase (Important!)

1. In your Supabase dashboard, go to **Database** → **Replication**
2. Enable Realtime for your database (should be enabled by default for new projects)
3. Go to **Project Settings** → **API Settings**
4. Make sure **Realtime** is enabled

### 5. Restart Your Development Server

```bash
npm run dev
```

## Testing the Video Call Feature

### Option 1: Test with Two Devices (Recommended)

1. **Device 1** (Helper - needs assistance):
   - Open the app
   - Click "I Need Help"
   - Click "Start Request"
   - Wait for connection

2. **Device 2** (Volunteer):
   - Open the app
   - Click "I Want to Help"
   - Click "Start Volunteering"
   - Accept the incoming request

Both devices should now be connected via video call!

### Option 2: Test with Two Browser Windows (Same Device)

1. **Window 1**: Follow the "Helper" steps above
2. **Window 2**: Open the app in a new window (not a tab) and follow "Volunteer" steps

**Note**: Some browsers may restrict camera access when multiple windows try to use it.

## Troubleshooting

### Camera/Microphone Not Working

**Problem**: Black screen or no audio

**Solutions**:
- Grant camera/microphone permissions when prompted
- Check browser settings: `chrome://settings/content/camera` (Chrome)
- Try a different browser (Chrome, Firefox, Safari, Edge all support WebRTC)
- Make sure no other app is using your camera

### Connection Not Establishing

**Problem**: "Waiting for connection..." never resolves

**Solutions**:
1. **Check Supabase credentials**: Make sure `.env` file has correct values
2. **Check browser console**: Press F12 and look for errors
3. **Restart dev server**: Stop and run `npm run dev` again
4. **Clear session storage**: Open browser DevTools → Application → Session Storage → Clear

### Firewall/Network Issues

**Problem**: Connection fails on certain networks (corporate/school WiFi)

**Solution**: 
- The app uses Google's free STUN servers for NAT traversal
- Some restrictive networks may block WebRTC
- Try a different network or use a VPN

### "Invalid call parameters" Error

**Problem**: Redirected to home page immediately

**Solution**:
- This happens when navigating directly to `/video-call`
- Always start from "I Need Help" or "I Want to Help" pages
- They generate the proper room ID and parameters

## Technical Details

### WebRTC Configuration

The app uses:
- **STUN servers**: Google's free STUN servers for NAT traversal
- **Codec**: Browser's default (usually VP8/VP9 for video, Opus for audio)
- **Resolution**: 1280x720 (HD) when possible
- **Audio processing**: Echo cancellation, noise suppression, auto gain control

### Signaling Flow

1. Helper creates room with unique ID
2. Volunteer joins the same room via Supabase Realtime channel
3. Volunteer sends WebRTC offer
4. Helper receives offer and sends answer
5. ICE candidates are exchanged
6. Direct peer-to-peer connection established

### Files Modified

- `src/lib/webrtc.ts` - WebRTC service for video/audio handling
- `src/lib/signaling.ts` - Supabase Realtime signaling service
- `src/pages/VideoCall.tsx` - Video call UI with WebRTC integration
- `src/pages/HelpRequest.tsx` - Creates call rooms
- `src/pages/Volunteer.tsx` - Joins call rooms

## Production Deployment

For production use, consider:

1. **TURN Servers**: Add TURN servers for users behind restrictive NATs
   - Services: Twilio, Xirsys, or self-hosted Coturn
   
2. **Database Tables**: Create Supabase tables to persist call history and matching

3. **Authentication**: Add user authentication to track volunteers and help requests

4. **Analytics**: Track connection success rates and call quality

5. **Scalability**: Current implementation uses sessionStorage for demo matching; replace with Supabase database for real matching

## Need Help?

If you're still having issues:

1. Check browser console for errors (F12)
2. Verify Supabase credentials are correct
3. Make sure Realtime is enabled in Supabase
4. Test with a different browser or device

The video calling feature is now fully functional! 🎉

