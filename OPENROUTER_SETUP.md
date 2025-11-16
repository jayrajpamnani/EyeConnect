# OpenRouter AI Vision Setup Guide

## Overview

OpenRouter provides access to GPT-4 Vision and other AI models for visual assistance. When no volunteers are available, EyeConnect uses OpenRouter to analyze images and describe surroundings to blind users.

## Quick Setup (5 minutes)

### Step 1: Get OpenRouter API Key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up for a free account (supports Google/GitHub login)
3. Click on your profile → **Keys**
4. Click **Create Key**
5. Give it a name like "EyeConnect"
6. Copy the API key (starts with `sk-or-v1-...`)

### Step 2: Add API Key to Environment Variables

#### For Local Development:

1. Create/edit `.env` file in project root:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

#### For Vercel Production:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **EyeConnect** project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `VITE_OPENROUTER_API_KEY`
   - **Value**: `sk-or-v1-your-actual-key-here`
5. Click **Save**
6. **Redeploy** your app (Deployments → Three dots → Redeploy)

### Step 3: Test It!

1. Open your app
2. Click "I Need Help"
3. Wait 30 seconds (simulates no volunteer available)
4. You'll be redirected to **AI Visual Assistance**
5. Point camera at something
6. Tap **"Capture & Analyze"**
7. AI will describe what it sees and read it aloud! 🎉

## How It Works

### User Flow

1. **Helper requests assistance** → "I Need Help" → "Start Request"
2. **30-second timeout** → No volunteers available
3. **Automatic redirect** → AI Visual Assistance page
4. **Camera activates** → Shows live preview
5. **User taps Capture** → Takes snapshot
6. **Image sent to OpenRouter** → GPT-4 Vision analyzes
7. **Description returned** → Read aloud via text-to-speech
8. **User can retry** → Take another photo anytime

### Technical Flow

```
User taps "Capture & Analyze"
    ↓
Capture frame from video stream
    ↓
Convert to base64 JPEG
    ↓
Send to OpenRouter API
    ↓
GPT-4 Vision analyzes image
    ↓
Returns detailed description
    ↓
Display on screen + Read aloud
```

## AI Prompt Engineering

The AI is instructed to:
- Focus on **spatial relationships** (left, right, near, far)
- Identify **objects and their locations**
- Read any **visible text**
- Note **colors** and visual details
- Warn about **potential hazards**
- Keep descriptions **concise but informative** (3 sentences)

Example AI response:
> "I can see a kitchen counter with a red coffee mug on the left side and a silver toaster on the right. In the center, there's a wooden cutting board with a knife. The walls are white with yellow cabinets above."

## Pricing

OpenRouter charges based on usage:

### GPT-4 Vision (Default Model)
- **Input**: ~$0.01 per image
- **Output**: ~$0.03 per 1000 tokens

### Cost Estimate:
- **1 image analysis**: ~$0.01-0.02
- **100 analyses**: ~$1-2
- **1000 analyses**: ~$10-20

💡 **Tip**: OpenRouter offers $1 free credit to start testing!

### Alternative Models

You can use cheaper models by editing `src/lib/openrouter.ts`:

```typescript
model: 'google/gemini-pro-vision',  // Cheaper alternative
// or
model: 'anthropic/claude-3-haiku-20240307',  // Even cheaper
```

## Features

### ✅ What It Does

- **Visual description**: Describes surroundings in detail
- **Text recognition**: Reads visible text (signs, labels, etc.)
- **Object detection**: Identifies objects and their positions
- **Color information**: Describes colors of objects
- **Spatial awareness**: Explains relative positions
- **Hazard detection**: Warns about potential dangers
- **Audio feedback**: Reads descriptions aloud

### ⚠️ Limitations

- **Internet required**: Needs active connection to API
- **Processing time**: Takes 2-5 seconds per image
- **Cost**: Small fee per image (see pricing above)
- **Accuracy**: AI may occasionally misidentify objects
- **Static images**: Analyzes one frame at a time (not video)

## Troubleshooting

### Error: "OpenRouter API key not configured"

**Solution**:
- Make sure `.env` file exists with `VITE_OPENROUTER_API_KEY`
- Check the key starts with `sk-or-v1-`
- Restart dev server after adding key
- For production, add it in Vercel environment variables

### Error: "Invalid OpenRouter API key"

**Solution**:
- Double-check you copied the complete key
- Create a new key in OpenRouter dashboard
- Make sure no extra spaces before/after the key

### Error: "Rate limit exceeded"

**Solution**:
- You've hit the rate limit (temporary)
- Wait 60 seconds and try again
- Consider adding payment method in OpenRouter for higher limits

### Error: "Failed to analyze image"

**Possible causes**:
- Network connection issue
- Camera not working
- Canvas failed to capture frame

**Solutions**:
- Check internet connection
- Grant camera permissions
- Refresh the page
- Check browser console for detailed error

### AI Response is Inaccurate

**Solutions**:
- Take photo from better angle
- Ensure good lighting
- Get closer to objects of interest
- Try multiple photos
- Consider upgrading to GPT-4 Vision (most accurate)

## Advanced Configuration

### Custom Prompts

Edit `src/lib/openrouter.ts` to customize AI behavior:

```typescript
const prompt = request.prompt || 
  "Your custom prompt here. " +
  "Tell the AI exactly what you want it to focus on.";
```

### Image Quality

Adjust compression in `src/pages/AIFallback.tsx`:

```typescript
const imageBase64 = canvasToBase64(canvas, 0.9); // Higher quality (0.1-1.0)
```

Higher quality = Larger file size = Slightly higher cost

### Different Models

OpenRouter supports many vision models:

```typescript
model: 'openai/gpt-4-vision-preview',        // Most accurate
model: 'google/gemini-pro-vision',           // Good balance
model: 'anthropic/claude-3-opus-20240229',   // Great for text
```

## Security

- ✅ API key is stored in environment variables (not in code)
- ✅ `.env` file is gitignored (never committed)
- ✅ Images are sent directly to OpenRouter (not stored)
- ✅ No data is saved on servers
- ⚠️ Don't share your API key publicly
- ⚠️ Rotate key if accidentally exposed

## Monitoring Usage

1. Go to [OpenRouter Dashboard](https://openrouter.ai/activity)
2. View **Activity** tab
3. See usage statistics and costs
4. Set spending limits if desired

## FAQ

**Q: Is this free?**
A: OpenRouter offers $1 free credit. After that, you pay per use (very cheap).

**Q: Can I use a different AI service?**
A: Yes! Edit `src/lib/openrouter.ts` to integrate OpenAI, Google Vision, or other services.

**Q: Does it work offline?**
A: No, it requires internet to access the AI model.

**Q: How accurate is it?**
A: GPT-4 Vision is very accurate for general objects. May struggle with fine details or specific contexts.

**Q: Can it read handwriting?**
A: Yes, GPT-4 Vision can read both printed and handwritten text (though handwriting accuracy varies).

**Q: Is it safe?**
A: Yes, images are processed by OpenRouter/OpenAI with enterprise-grade security. No data is stored permanently.

## Alternative: Without OpenRouter

If you don't want to use OpenRouter, the app still works:

- **Volunteers**: Primary feature (peer-to-peer video calls)
- **AI Fallback**: Shows error if API key missing
- Users can still request human volunteers

The AI is only a **fallback** when no volunteers are available.

## Support

- **OpenRouter Docs**: [https://openrouter.ai/docs](https://openrouter.ai/docs)
- **OpenRouter Discord**: Join for community support
- **Check console**: Press F12 for detailed error messages

---

**Ready to deploy?** Add your API key and test it! The AI vision assistance will help users when volunteers aren't available. 🚀

