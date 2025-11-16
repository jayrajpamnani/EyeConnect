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

The video calling feature requires Supabase for signaling. See **[SETUP_VIDEO_CALLS.md](./SETUP_VIDEO_CALLS.md)** for complete setup instructions.

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Realtime for signaling)
- WebRTC (Peer-to-peer video calls)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Deployment

Build the project using `npm run build` and deploy the `dist` folder to your preferred hosting platform.
