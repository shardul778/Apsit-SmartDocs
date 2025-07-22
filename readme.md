# College Document Automation System

A unified system to streamline and automate the creation of college reports, notices, and official documents—with consistent branding, efficient workflows, and AI-enhanced content generation.

## Project Objectives
- **Consistent Documents**: Ensure all college documents have a uniform look and style.
- **Save Time**: Automate routine tasks to reduce manual work.
- **Teamwork**: Allow staff and faculty to collaborate easily on documents.
- **Error-Free**: Use templates and user roles to reduce mistakes and maintain standards.
- **Go Paperless**: Support fully digital creation, approval, and storage of documents.
- **Use AI Smartly**: Help draft and improve text with AI to boost productivity.

## Features
- **Approval Workflow**: Easy review and approval with tracking.
- **User Roles**: Different access levels for faculty, and admins.
- **Search & Filters**: Quickly find documents by keywords, dates, or authors.
- **Bulk Document Creation**: Generate many letters or certificates from data files at once.
- **Digital Signatures**: Sign documents securely online.
- **Mobile Friendly**: Create and approve documents on any device.
- **Analytics Dashboard**: Visualize document stats and approval times.


## Tech Stack

### Frontend
- React.js
- Material UI
- PDF.js for preview

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- pdf-lib for PDF generation

### AI Integration
- Open-source models (Llama 3, Mistral, or similar)
- Hugging Face API integration

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- Git

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd college-document-automation
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# In backend directory, create a .env file with:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Run the development servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server in a new terminal
cd frontend
npm start
```

## Project Structure

```
college-document-automation/
├── frontend/                # React frontend application
│   ├── public/              # Static files
│   └── src/                 # Source files
│       ├── components/      # Reusable components
│       ├── pages/           # Page components
│       ├── services/        # API services
│       ├── context/         # React context
│       └── utils/           # Utility functions
├── backend/                 # Express backend application
│   ├── controllers/         # Request controllers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Utility functions
│   └── services/            # Business logic
└── README.md                # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.