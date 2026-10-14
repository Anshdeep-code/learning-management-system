# LearnHub client (React + TypeScript + Tailwind)

## Run
1. Start the backend first (port 8000). In the backend `.env` set `CLIENT_URL=http://localhost:3000`.
2. Here:
   npm install
   npm run dev
3. Open http://localhost:3000

`.env` holds `VITE_API_URL` (default http://localhost:8000/api/v1).

## Pages
/                                   home
/courses                            browse + search courses (?q=react&page=2)
/login /signup /forgot-password /reset-password/:token
/course-detail/:id                  details, preview lectures, buy (Razorpay or Stripe)
/course-progress/:id                video player + progress
/my-learning                        purchased courses
/profile                            edit profile, change password, delete account
/instructor                         instructor dashboard (publish / unpublish)
/instructor/courses/new | :id/edit | :id/lectures

## Backend endpoints to double-check
Delete buttons call these two; if your routes differ, change the path in the file named:
DELETE /course/c/:courseId                      pages/InstructorDashboard.tsx (deleteCourse)
DELETE /course/c/:courseId/lectures/:lectureId  pages/ManageLectures.tsx (deleteLecture)
