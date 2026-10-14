import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Courses from "./pages/Courses";
import Home from "./pages/Home";
import CourseDetail from "./pages/CourseDetail";
import CoursePlayer from "./pages/CoursePlayer";
import CourseForm from "./pages/CourseForm";
import ForgotPassword from "./pages/ForgotPassword";
import InstructorDashboard from "./pages/InstructorDashboard";
import Login from "./pages/Login";
import ManageLectures from "./pages/ManageLectures";
import MyLearning from "./pages/MyLearning";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";

export default function App() {
  const instructor = ["instructor"];
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* the next two paths are the ones the backend's Stripe checkout redirects to */}
        <Route path="/course-detail/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
        <Route path="/course-progress/:courseId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />

        <Route path="/my-learning" element={<ProtectedRoute><MyLearning /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/instructor" element={<ProtectedRoute roles={instructor}><InstructorDashboard /></ProtectedRoute>} />
        <Route path="/instructor/courses/new" element={<ProtectedRoute roles={instructor}><CourseForm /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute roles={instructor}><CourseForm /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/lectures" element={<ProtectedRoute roles={instructor}><ManageLectures /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
