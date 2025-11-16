# EyeConnect

## Project info

EyeConnect is a web application that connects blind users with sighted volunteers through video calls for real-time visual assistance.

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account (free) for video call signaling - [Sign up here](https://supabase.com)

### Installation

Follow these steps to run the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd EyeConnect

# Step 3: Install the necessary dependencies
npm install

# Step 4: Set up environment variables
# Create a .env file and add your Supabase credentials
# See SETUP_VIDEO_CALLS.md for detailed instructions

# Step 5: Start the development server
npm run dev
```

### Video Call Setup

⚠️ **IMPORTANT**: The video calling feature requires Supabase database setup to work across different devices.

1. **Database Setup** (Required) - See **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** to create the calls table
2. **Video Call Configuration** - See **[SETUP_VIDEO_CALLS.md](./SETUP_VIDEO_CALLS.md)** for complete instructions

Without the database setup, calls will show "connecting" infinitely and won't match across devices.

### AI Visual Assistance Setup (Optional)

When no volunteers are available within 30 seconds, users are redirected to AI-powered visual assistance using OpenRouter.

1. **OpenRouter Setup** (Optional) - See **[OPENROUTER_SETUP.md](./OPENROUTER_SETUP.md)** to enable AI vision
2. Get API key from [OpenRouter.ai](https://openrouter.ai)
3. Add `VITE_OPENROUTER_API_KEY` to your `.env` file

The app works without AI - it's only a fallback for when volunteers aren't available.

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Realtime for signaling)
- WebRTC (Peer-to-peer video calls)
- OpenRouter API (AI vision assistance)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Deployment

Build the project using `npm run build` and deploy the `dist` folder to your preferred hosting platform.
