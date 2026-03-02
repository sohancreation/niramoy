# Niramoy AI - Your Personal Health & Wellness Companion

Niramoy AI is an emotional wellness and health tracking application built with React, Vite, Tailwind CSS, and Supabase. It provides personalized diet planning, fitness tracking, voice-enabled mental care (health chat & voice consulting), verified home remedies, and gamification to keep users engaged and motivated. This project is optimized for both web and mobile experiences.

## Features

- **Personalized Health Tracking**: Monitor daily tasks including water intake, medication adherence, diet plans, and exercises.
- **AI-Powered Mental Wellness Chat**: Includes intelligent chatbots fine-tuned for health queries and mental wellness interactions.
- **Voice Consultations**: A direct real-time communication channel to get remote care advice.
- **Home Remedies & Prescription Scanning**: Specialized tools for analyzing uploaded prescriptions and suggesting verified natural remedies via AI.
- **Gamification & Family Mode**: Share progress with loved ones using Family Mode, complete health quests, and unlock badges for achieving wellness goals.
- **Multilingual Support**: Fully localized in English and Bengali to reach a wider user base.

## Technology Stack

### Frontend
- **React**: Modern component-based view library.
- **TypeScript**: Strict typing for increased maintainability.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS & shadcn/ui**: For beautifully designed, accessible, and highly responsive user interfaces.
- **React Router**: For seamless single-page application (SPA) routing.
- **React Query (Tanstack)**: Handling remote data state and caching.

### Backend
- **Supabase**: Open-source Firebase alternative providing the PostgreSQL database, Authentication, Storage, and Edge Functions.
- **Deno & Edge Functions**: For secure AI integrations (OpenAI compatible endpoints) running on the edge.
- **Vapi**: Used for real-time voice intelligence configurations.

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18 or above recommended)
- npm, yarn, or bun (Node package manager)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/sohancreation/niramoy.git
   cd niramoy
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory (you can copy `.env.example` if available) and add the necessary environment variables for Supabase and any third-party integrations.

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Access the app:
   Navigate to `http://localhost:8080` in your browser.

## Deployment

This app can easily be deployed on modern platforms such as **Vercel**, **Netlify**, or **GitHub Pages**. 

For GitHub Pages, it includes a GitHub Action inside `.github/workflows/deploy.yml` which deploys the app on pushed changes to the `main` branch.

## Contributing

Contributions are welcome! If you'd like to improve Niramoy AI:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
