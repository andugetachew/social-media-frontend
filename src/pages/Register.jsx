import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const [form, setForm] = useState({ email: '', username: '', password: '', password2: '' });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password2) {
            setError('Passwords do not match');
            return;
        }
        try {
            await register(form.email, form.username, form.password, form.password2);
            navigate('/');
        } catch (err) {
            setError('Registration failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-2 border rounded mb-3"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full p-2 border rounded mb-3"
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 border rounded mb-3"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full p-2 border rounded mb-3"
                        onChange={(e) => setForm({ ...form, password2: e.target.value })}
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    >
                        Register
                    </button>
                </form>
                <p className="text-center mt-4">
                    Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
                </p>
            </div>
        </div>
    );
}