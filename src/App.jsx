import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;