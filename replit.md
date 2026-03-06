# Aone Target Institute NEET Learning Platform

## Overview
Aone Target Institute is developing a comprehensive NEET learning platform. This platform aims to provide students with a rich learning experience through an integrated system featuring an admin panel, student dashboard, referral system, and a robust mock test engine. All data, from user information to test results and course content, is managed and persisted using MongoDB. The project's vision is to become a leading educational platform for NEET aspirants, offering a seamless and interactive learning environment.

## User Preferences
- Hindi-speaking user
- All data must be saved to MongoDB, no mock data

## System Architecture

### UI/UX Decisions
The platform features a modern ed-tech design system with a premium aesthetic. Key design elements include:
- **Typography**: Poppins font for a clean, modern look.
- **Components**: 20px rounded cards, glassmorphism effects, soft layered shadows, and micro-interactions with 200ms transitions and staggered animations for an engaging user experience.
- **Color Scheme**: Uses a custom Tailwind CSS color scale (primary-50 to primary-900, accent-50 to accent-700, surface-50 to surface-300) derived from brand colors: Navy #1A237E, Blue #303F9F, Red #D32F2F.
- **Navigation**: Features a glassmorphism floating bottom navigation with an active indicator bar and scale micro-interactions.
- **Loading States**: Utilizes skeleton loaders for key screens and a smooth splash screen with a 300ms fade and scale effect.

### Technical Implementation
- **Frontend & Backend**: A single Express.js server on port 5000. In development, Vite runs in middleware mode; in production, Express serves the built `dist` folder.
- **Database Interaction**: Native MongoDB driver is used for all data operations, with a middleware ensuring DB readiness before API requests.
- **API**: Over 70 REST API endpoints handle all platform functionalities, including CRUD operations for various collections, referral management, purchases, and test submissions.
- **State Management**: React components are used for the frontend, with a dedicated API client for service interactions.
- **Performance**: Implements React.lazy and Suspense for code splitting across routes, Vite manual chunking for vendor libraries, API caching with TTL, request deduplication, and image lazy loading to enhance performance.
- **Styling**: Tailwind CSS is used for utility-first styling, complemented by custom CSS utilities for premium design elements.

### Feature Specifications
- **Student Dashboard**: Includes personalized stats, progress tracking, upcoming tests, and "My Courses" section.
- **Course Management**: Comprehensive system for creating, managing, and categorizing courses, subcourses, videos, PDFs, and packages. Supports course-specific content (videos, tests) and purchase-gated access.
- **Mock Test Engine**: Advanced mock test functionality with timers, question navigation, auto-scoring (including negative marking), and detailed results review. Supports bulk question upload via CSV.
- **Referral System**: Full refer & earn system with code generation, sharing options, and admin-managed commission settings.
- **Admin Panel**: Extensive administrative tools for managing users, content, tests, referrals, settings, banners, and real-time statistics.
- **Content Types**: Supports various content types like recorded batches, live classes, crash courses, and mock tests, with conditional rendering based on category (e.g., NEET, 11th-12th).
- **Progress Tracking**: Records student test results and course-wise progress, displayed in student and admin dashboards.
- **File Upload**: Integrated file upload system for images and PDFs (up to 50MB) using Multer, with Cloudflare/CDN URL support.
- **Notifications & News**: Global news modal and notification system.

## Recent Changes
- **Feb 19, 2026**: Implemented OTP-based authentication via Karix SMS API. Removed password-based login. Flow: Phone → OTP → Dashboard (existing user) or Phone → OTP → Profile → Category → Register (new user). Includes OTP verification tokens for secure registration.
- **Feb 19, 2026**: Updated StudentLogin UI to TathaGat-style split-screen layout (dark navy left panel with branding, coral/orange right panel with white card forms, multi-step registration)
- **Feb 19, 2026**: Integrated Razorpay payment gateway for course purchases. Server-side order creation and payment verification with amount validation from DB.

## External Dependencies
- **Database**: MongoDB (database: `aonetarget`)
- **Styling Framework**: Tailwind CSS
- **Charting Library**: Recharts
- **Video Embeds**: YouTube (for video lectures)
- **Image/PDF Hosting**: Cloudflare/CDN (for optimal media delivery)
- **Rich Text Editor**: Tiptap (for content editing in admin panel)
- **Share Functionality**: Web Share API (for course sharing)
- **Payment Gateway**: Razorpay (test keys configured as secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- **SMS OTP**: Karix SMS API via japi.instaalerts.zone (secrets: KARIX_API_KEY, KARIX_SENDER_ID, DLT_ENTITY_ID, DLT_TEMPLATE_ID)