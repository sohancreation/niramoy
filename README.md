# 🌟 Niramoy AI - Your Personal Health & Wellness Companion

![Niramoy AI Banner](https://storage.googleapis.com/gpt-engineer-file-uploads/RQ8Gs6rXJLNgfbdgqSnwoOYhDfx1/social-images/social-1772393192286-Gemini_Generated_Image_xxt071xxt071xxt0.webp)

Niramoy AI is a comprehensive, full-stack health and emotional wellness tracking application built with React, Vite, Tailwind CSS, and Supabase. By leveraging cutting-edge Artificial Intelligence, Niramoy AI provides personalized diet and fitness plans, voice-enabled mental care, verified home remedies, and intelligent health tracking, all wrapped in a beautifully gamified experience to keep users engaged and motivated. 

Optimized for both web and mobile, Niramoy AI is designed to act as your 24/7 personal health companion.

## ✨ Key Features

- **📊 Comprehensive Health Tracking**: Monitor your daily routines, including water intake, medication adherence, diet plans, and exercises from intuitive dashboards.
- **🤖 AI-Powered Mental Wellness Chat**: Engage with intelligent chatbots fine-tuned for health queries, emotional support, and mental wellness interactions.
- **🎙️ Real-time Voice Consultations**: Experience a direct real-time communication channel to get remote care advice and instant health insights.
- **🌿 Home Remedies & Prescription Scanning**: Utilize specialized AI vision tools to analyze uploaded medical prescriptions and suggest verified natural home remedies based on symptoms.
- **👨‍👩‍👧 Gamification & Family Mode**: Share wellness progress with your loved ones using Family Mode. Complete daily health quests, maintain streaks, and unlock achievements to achieve your wellness goals.
- **🌐 Multilingual Support**: Fully localized in English and Bengali to serve a diverse user base seamlessly.

## 🚀 Technology Stack

Niramoy AI leverages a modern, robust, and scalable technology stack:

### Frontend
- **React 18**: Modern component-based UI library.
- **TypeScript**: Ensuring strict typing for robust and maintainable code.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS & shadcn/ui**: For a beautifully designed, accessible, and highly responsive user interface.
- **React Router**: For seamless Single-Page Application (SPA) routing.
- **React Query (TanStack)**: For powerful remote data state management and caching.

### Backend & Integrations
- **Supabase**: Open-source Firebase alternative powering the PostgreSQL database, user authentication, and file storage.
- **Edge Functions (Deno)**: For hosting secure serverless functions and integrating with OpenAI-compatible AI endpoints.
- **Vapi**: Integrated for advanced real-time voice AI configurations.

## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18 or above recommended)
- npm, yarn, or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sohancreation/niramoy.git
   cd niramoy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory (you can copy from `.env.example` if available) and configure your Supabase, OpenAI, and other third-party integration keys.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:8080`.

## 📦 Deployment

Niramoy AI is production-ready and can be quickly deployed to modern hosting platforms such as **Vercel**, **Netlify**, or **GitHub Pages**. 

A CI/CD pipeline is already configured for **GitHub Pages** with GitHub Actions. It automatically deploys the app on pushed changes to the `main` branch (check `.github/workflows/deploy.yml`).

## 🤝 Contributing

We welcome contributions! If you'd like to improve Niramoy AI, please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

<p align="center">Made with ❤️ for better health.</p>
