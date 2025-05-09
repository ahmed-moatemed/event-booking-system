import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import RequireAuth from "./components/auth/RequireAuth";
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import BookingSuccess from "./pages/BookingSuccess";
import MyBookings from "./pages/MyBookings";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AdminDashboard from "./pages/AdminDashboard";
import EventForm from "./pages/EventForm";
// import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (require authentication) */}
            <Route element={<RequireAuth />}>
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RequireAuth requireAdmin={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/events/:id" element={<EventForm />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
