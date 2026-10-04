// import React, { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { Link, useNavigate } from 'react-router-dom';

// export default function Register() {
//     const [form, setForm] = useState({
//         email: '',
//         username: '',
//         full_name: '',
//         password: '',
//         password2: ''
//     });
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);
//     const { register } = useAuth();
//     const navigate = useNavigate();

//     const handleChange = (e) => {
//         setForm({ ...form, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');

//         if (form.password !== form.password2) {
//             setError('Passwords do not match');
//             return;
//         }

//         if (form.password.length < 8) {
//             setError('Password must be at least 8 characters');
//             return;
//         }

//         setLoading(true);
//         try {
//             await register(form.email, form.username, form.password, form.password2, form.full_name);
//             navigate('/');
//         } catch (err) {
//             console.error('Registration error:', err);
//             setError(err.response?.data?.error || 'Registration failed. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//             <div className="bg-white p-8 rounded-lg shadow-md w-96">
//                 <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

//                 {error && (
//                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
//                         {error}
//                     </div>
//                 )}

//                 <form onSubmit={handleSubmit}>
//                     <input
//                         type="text"
//                         name="full_name"
//                         placeholder="Full Name"
//                         className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         value={form.full_name}
//                         onChange={handleChange}
//                         required
//                     />

//                     <input
//                         type="email"
//                         name="email"
//                         placeholder="Email Address"
//                         className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         value={form.email}
//                         onChange={handleChange}
//                         required
//                     />

//                     <input
//                         type="text"
//                         name="username"
//                         placeholder="Username"
//                         className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         value={form.username}
//                         onChange={handleChange}
//                         required
//                     />

//                     <input
//                         type="password"
//                         name="password"
//                         placeholder="Password"
//                         className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         value={form.password}
//                         onChange={handleChange}
//                         required
//                     />

//                     <input
//                         type="password"
//                         name="password2"
//                         placeholder="Confirm Password"
//                         className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         value={form.password2}
//                         onChange={handleChange}
//                         required
//                     />

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
//                     >
//                         {loading ? 'Creating Account...' : 'Register'}
//                     </button>
//                 </form>

//                 <p className="text-center mt-4 text-gray-600">
//                     Already have an account?{' '}
//                     <Link to="/login" className="text-blue-500 hover:underline">
//                         Login
//                     </Link>
//                 </p>
//             </div>
//         </div>
//     );
// }

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Turns any axios error into a readable message.
// Handles: no response (backend down), HTML/500 responses, and DRF field errors
// like { email: ["..."], username: ["..."], non_field_errors: ["..."] }.
const getErrorMessage = (err) => {
    if (!err.response) {
        return 'Cannot reach the server. Is the backend running?';
    }

    const { status, data } = err.response;

    // 500 pages (DEBUG=True) come back as an HTML string, not JSON
    if (typeof data !== 'object' || data === null) {
        return `Server error (${status}). Check the backend logs.`;
    }

    const skip = ['status_code', 'error', 'message'];
    const messages = Object.entries(data)
        .filter(([key]) => !skip.includes(key))
        .flatMap(([key, value]) =>
            [].concat(value).map((v) =>
                key === 'non_field_errors' || key === 'detail' ? v : `${key}: ${v}`
            )
        );

    return messages.length
        ? messages.join(' ')
        : data.message || 'Registration failed. Please try again.';
};

export default function Register() {
    const [form, setForm] = useState({
        email: '',
        username: '',
        full_name: '',
        password: '',
        password2: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.password2) {
            setError('Passwords do not match');
            return;
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await register(form.email, form.username, form.password, form.password2, form.full_name);
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            console.log('Server response:', err.response?.status, err.response?.data);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="full_name"
                        placeholder="Full Name"
                        className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.full_name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password2"
                        placeholder="Confirm Password"
                        className="w-full p-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.password2}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="text-center mt-4 text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-500 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}