# Smart Health & Sanitation Hub — Ujjain Maha Kumbh 2028

 <div align="center">
  <img src="public/favicon.ico" alt="Project Logo" width="200">
  <p><em>Enhancing pilgrim experience through smart sanitation and health management</em></p>
</div>

*Live Demo & Repository*  
[Try it live → https://health-and-sanitation-hub-ujjain.netlify.app/ ]
[Source code on GitHub -> https://github.com/shubh13265/Health-Sanitation-hub-for-Mahakumbh ]

## 🌟 Project Overview

The Smart Health & Sanitation Hub is a comprehensive digital solution designed for the Ujjain Maha Kumbh 2028, addressing critical health, sanitation, and safety challenges during large religious gatherings. This prototype offers real-time facility management, multilingual assistance, and AI-powered risk assessment to enhance pilgrim experience and administrative efficiency.

## 🚀 Key Features

- **Multi-lingual Voice Assistant**: Support for Hindi, English, and regional languages
- **Real-time Facility Locator**: Find nearest toilets, water points, and medical facilities
- **AI-powered Risk Scanner**: Crowd density analysis and sanitation risk assessment
- **Worker Task Management**: Priority-based assignments with SLA tracking
- **Admin Dashboard & Simulation**: Predictive crowd management and resource optimization
- **Emergency Response System**: Rapid alert mechanism with resource proximity calculation
- **Gamified Incentives**: Performance badges and leaderboard for sanitation workers

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS 3 with custom utility classes
- **UI Components**: Custom component library with shadcn/ui patterns
- **State Management**: React Context API and local storage for offline-first functionality
- **3D Visualization**: Three.js for spatial mapping
- **Build Tool**: Vite with hot module replacement

### Backend
- **Server**: Express.js with TypeScript
- **API Structure**: RESTful endpoints with `/api/` prefix
- **Validation**: Zod schema validation
- **Type Safety**: Shared TypeScript interfaces between client and server

### DevOps & Deployment
- **Containerization**: Docker support
- **CI/CD**: Netlify integration
- **Development**: Single-port development with hot reload
- **Production**: Self-contained executables for multiple platforms

### APIs & Integrations
- **Geolocation**: Browser Geolocation API
- **Voice Recognition**: Web Speech API for multilingual voice commands
- **Maps Integration**: Google Maps for navigation
- **Offline Support**: Progressive Web App (PWA) capabilities

## 🏗️ System Architecture

The application follows a client-server architecture with offline-first capabilities:

1. **Client Layer**: React SPA with PWA features for offline functionality
2. **API Layer**: Express.js server handling data requests and business logic
3. **Storage Layer**: Combination of server database and client-side storage
4. **Integration Layer**: External APIs for maps, voice, and notifications

## 🔒 Performance & Security

- Optimized bundle size with code splitting
- Secure authentication for different user roles (pilgrim, worker, admin)
- Data persistence for offline operation
- Rate limiting and input validation for API endpoints

## 🚀 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/shubh13265/Health-Sanitation-hub-for-Mahakumbh.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔮 Future Roadmap

- IoT integration for real-time facility monitoring
- Machine learning for predictive maintenance
- Blockchain-based incentive system for sanitation workers
- AR navigation for pilgrims
- Expanded language support

## 👥 Contributors
- [TEAM :- ERROR_404]
- [shubham Kumar] -  [Project Strategist and Backend Developer]
- [Sanjay yadav] - [Frontend Developer and APIs Manager]
- [Ram Patel] - [DataBase and Tech lead]
- [Shivam Kumar] - [UI/UX Designer]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p><em>This prototype was developed for the Ujjain MahaKumbh Hackathon 2025</em></p>
</div>