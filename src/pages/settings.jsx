import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Settings() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/auth/update-profile/', { username, email, bio });
            setMessage('Profile updated successfully');
            setError('');
            // Update user in context
            login(user.email, oldPassword);
        } catch (err) {
            setError('Failed to update profile');
            setMessage('');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            await api.post('/auth/update-password/', { old_password: oldPassword, new_password: newPassword });
            setMessage('Password updated successfully');
            setError('');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update password');
            setMessage('');
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('profile_picture', file);
        try {
            await api.post('/auth/update-photo/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('Profile photo updated');
            setError('');
            window.location.reload();
        } catch (err) {
            setError('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow mb-4">
                    <div className="p-4 border-b">
                        <h1 className="text-xl font-bold">Settings</h1>
                    </div>

                    {/* Profile Photo */}
                    <div className="p-4 border-b">
                        <h2 className="font-semibold mb-3">Profile Photo</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                                {user.profile_picture ? (
                                    <img src={user.profile_picture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600"
                                >
                                    {uploading ? 'Uploading...' : 'Change Photo'}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Update Profile Form */}
                    <form onSubmit={handleUpdateProfile} className="p-4 border-b">
                        <h2 className="font-semibold mb-3">Profile Information</h2>
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                rows="3"
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                            Save Changes
                        </button>
                    </form>

                    {/* Update Password Form */}
                    <form onSubmit={handleUpdatePassword} className="p-4 border-b">
                        <h2 className="font-semibold mb-3">Change Password</h2>
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Current Password</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                            Update Password
                        </button>
                    </form>

                    {/* Messages */}
                    {message && <div className="p-4 text-green-500">{message}</div>}
                    {error && <div className="p-4 text-red-500">{error}</div>}

                    {/* Back Link */}
                    <div className="p-4">
                        <Link to="/" className="text-blue-500">← Back to Feed</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}