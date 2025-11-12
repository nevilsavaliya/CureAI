# Healthcare Platform MVP

A comprehensive healthcare platform connecting patients with doctors through symptom analysis, consultation scheduling, and video consultations.

## Project Structure

```
├── backend/          # Express.js API server
├── frontend/         # Angular web application
├── dataset/          # Data files and ML models (future)
├── docker/           # Docker configuration (future)
├── docs/             # Documentation
└── notebooks/        # Jupyter notebooks for ML (future)
```

## Technology Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

### Frontend
- Angular 15
- Angular Material
- RxJS
- WebRTC for video calls

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file (copy from .env.example):
```bash
cp .env.example .env
```

4. Update .env with your MongoDB URI and JWT secret

5. Start the server:
```bash
npm run dev
```

Backend will run on http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx ng serve
```
Or if you have Angular CLI installed globally:
```bash
ng serve
```

Frontend will run on http://localhost:4200

## Features

### Patient Features
- Symptom input via chatbot interface
- Disease prediction (static for MVP)
- Doctor recommendations with contact details
- Messaging with doctors
- Consultation scheduling
- Video consultations
- Post-consultation feedback

### Doctor Features
- Professional profile management
- Subscription system
- Patient records dashboard
- Messaging with patients
- Consultation management
- Video consultations

### Admin Features
- User management
- Platform metrics
- System monitoring

## API Documentation

API endpoints are documented in the design document at `.kiro/specs/healthcare-mvp-core/design.md`

## Development

- Backend runs on port 3000
- Frontend runs on port 4200
- MongoDB default port 27017

## License

ISC
