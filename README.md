# Learning Management System (LMS)

A full-stack web application for online learning that enables students to discover courses, access lectures, track learning progress, and make online payments, while allowing instructors to create and manage educational content.

## Overview

The **Learning Management System (LMS)** is designed to provide a centralized platform for digital education. It combines a responsive frontend with a RESTful backend to support user authentication, course management, lecture delivery, enrollment, and payment processing.

The project was developed as part of my full-stack web development training to apply practical concepts in frontend development, backend engineering, database management, API integration, and authentication.

## Features

- **User Authentication** — Sign up, sign in, logout, and protected user operations using JWT-based authentication.
- **Role-Based Functionality** — Separate functionality for students and instructors.
- **Course Management** — Create, update, search, and publish courses.
- **Lecture Management** — Add and manage lectures associated with courses.
- **Media Management** — Upload and manage course media using Cloudinary.
- **Online Payments** — Integration with Stripe and Razorpay for payment processing.
- **Learning Progress** — Track lecture progress and course completion.
- **RESTful API** — Organized backend endpoints for users, courses, purchases, and progress.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Requests | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), Cookies |
| Media Storage | Cloudinary |
| Payments | Stripe, Razorpay |
| API Testing | Postman |
| Version Control | Git, GitHub |

## Architecture

The application follows a client-server architecture.

1. **Frontend:** React and TypeScript provide the user interface and handle interactions.
2. **Backend:** Node.js and Express.js expose REST APIs and process application requests.
3. **Database:** MongoDB stores application data, managed through Mongoose.
4. **Authentication:** JWT-based authentication helps secure user-specific operations.
5. **External Services:** Cloudinary handles media storage, while Stripe and Razorpay provide payment integrations.

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB](https://www.mongodb.com/) or a MongoDB Atlas database
- Git

You will also need credentials for the external services you intend to use, such as Cloudinary and your payment providers.

### 1. Clone the Repository

```bash
git clone https://github.com/Anshdeep-code/learning-management-system.git
cd learning-management-system
```

### 2. Install Dependencies

Install the frontend and backend dependencies separately, from their respective directories.

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

If your repository uses different directory names, replace `frontend` and `backend` with the actual folder names.

### 3. Configure Environment Variables

Create a `.env` file in the backend directory and configure the environment variables required by your application.

Example configuration:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Use the exact variable names expected by your backend configuration. Additional variables may be required depending on your implementation.

**Important:** Never commit your `.env` file or expose secret keys in frontend code. Use test credentials while developing payment functionality.

### 4. Start the Backend

From the backend directory, run the development script defined in `package.json`. For example:

```bash
npm run dev
```

If your project uses a different script, use the corresponding command from its `scripts` section.

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The Vite development server should display the local URL in your terminal. Open that URL in your browser.

Ensure the frontend API base URL and backend CORS configuration match your local development setup.

## API Overview

The backend exposes versioned REST API endpoints under `/api/v1`.

| Endpoint | Purpose |
|---|---|
| `/api/v1/user` | User authentication and profile operations |
| `/api/v1/course` | Course-related operations |
| `/api/v1/purchase` | Purchase and enrollment operations |
| `/api/v1/razorpay` | Razorpay payment operations |
| `/api/v1/progress` | Learning progress operations |
| `/health` | Backend health check |

The exact HTTP methods, request bodies, and authorization requirements depend on the individual route definitions.

## Project Goals

- Apply full-stack web development concepts in a practical project.
- Build a functional and maintainable web application.
- Understand frontend-backend communication through REST APIs.
- Implement authentication and protected operations.
- Integrate database, media storage, and payment services.
- Gain hands-on experience with modern web development tools.

## Future Improvements

Potential enhancements include:

- Automated testing for frontend components and backend APIs.
- Improved accessibility and responsive design.
- Enhanced course discovery and filtering.
- More detailed learning analytics and progress reporting.
- Production deployment with environment-specific configuration.
- Improved logging, validation, and error handling.

## Learning Outcomes

This project provided practical experience with React, TypeScript, Node.js, Express.js, MongoDB, REST API development, JWT authentication, third-party integrations, and full-stack application architecture.

## Author

**Anshdeep Singh**

- GitHub: [@Anshdeep-code](https://github.com/Anshdeep-code)
- Repository: [Learning Management System](https://github.com/Anshdeep-code/learning-management-system)

---

*Developed as a full-stack web development training project.*
