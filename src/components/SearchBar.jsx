import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const searchUsers = async (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 1) {
            try {
                const response = await api.get(`/auth/users/?search=${value}`);
                setResults(response.data);
                setShowResults(true);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            }
        } else {
            setResults([]);
            setShowResults(false);
        }
    };

    const handleSelectUser = (userId) => {
        setQuery('');
        setResults([]);
        setShowResults(false);
        navigate(`/profile/${userId}`);
    };

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Search users by username..."
                value={query}
                onChange={searchUsers}
                className="w-64 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
                    {results.map(user => (
                        <div
                            key={user.id}
                            onClick={() => handleSelectUser(user.id)}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        >
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}