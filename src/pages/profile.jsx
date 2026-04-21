import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaRegHeart, FaUserPlus, FaUserCheck, FaArrowLeft, FaTrash, FaEdit, FaComment } from 'react-icons/fa';

export default function Profile() {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userId) {
            fetchAllData();
        }
    }, [userId]);

    const fetchAllData = async () => {
        setLoading(true);
        await fetchProfile();
        await fetchPosts();
        await fetchFollowStats();
        await checkFollowStatus();
        setLoading(false);
    };

    const fetchProfile = async () => {
        try {
            const response = await api.get(`/auth/users/${userId}/`);
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await api.get(`/posts/user/${userId}/`);
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const fetchFollowStats = async () => {
        try {
            const response = await api.get(`/interactions/stats/${userId}/`);
            setFollowersCount(response.data.followers_count);
            setFollowingCount(response.data.following_count);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const checkFollowStatus = async () => {
        if (user?.id === userId) return;
        try {
            const response = await api.get(`/interactions/check/${userId}/`);
            setIsFollowing(response.data.is_following);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const handleFollow = async () => {
        try {
            await api.post(`/interactions/follow/${userId}/`);
            setIsFollowing(true);
            fetchFollowStats();
        } catch (error) {
            console.error('Error following:', error);
            alert(error.response?.data?.error || 'Failed to follow');
        }
    };

    const handleUnfollow = async () => {
        try {
            await api.delete(`/interactions/unfollow/${userId}/`);
            setIsFollowing(false);
            fetchFollowStats();
        } catch (error) {
            console.error('Error unfollowing:', error);
            alert(error.response?.data?.error || 'Failed to unfollow');
        }
    };

    const deletePost = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}/`);
            fetchPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const startEditPost = (post) => {
        setEditingPost(post.id);
        setEditContent(post.content);
    };

    const cancelEditPost = () => {
        setEditingPost(null);
        setEditContent('');
    };

    const updatePost = async (postId) => {
        if (!editContent.trim()) return;
        try {
            await api.put(`/posts/${postId}/update/`, { content: editContent });
            setEditingPost(null);
            fetchPosts();
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const toggleLike = async (postId) => {
        try {
            await api.post(`/posts/${postId}/like/`);
            fetchPosts();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
    }

    if (!profile) {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">User not found</div>;
    }

    const isOwnProfile = user?.id === userId;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-2xl mx-auto p-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                >
                    <FaArrowLeft /> Back to Feed
                </button>

                <div className="bg-white p-6 rounded-lg shadow mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold">{profile.username}</h1>
                            <div className="text-gray-500 mt-1">{profile.email}</div>
                            <div className="flex gap-4 mt-3 text-gray-600">
                                <span><strong>{posts.length}</strong> posts</span>
                                <span><strong>{followersCount}</strong> followers</span>
                                <span><strong>{followingCount}</strong> following</span>
                            </div>
                        </div>

                        {/* FOLLOW/UNFOLLOW BUTTON - THIS IS THE FIX */}
                        {!isOwnProfile && (
                            isFollowing ? (
                                <button
                                    onClick={handleUnfollow}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                    <FaUserCheck /> Following
                                </button>
                            ) : (
                                <button
                                    onClick={handleFollow}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    <FaUserPlus /> Follow
                                </button>
                            )
                        )}
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-4">Posts</h2>
                {posts.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        {isOwnProfile ? 'No posts yet' : 'No posts yet'}
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="bg-white p-4 rounded-lg shadow mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                    <Link to={`/profile/${post.author?.id}`} className="font-bold hover:underline">
                                        {post.author?.username}
                                    </Link>
                                    <div className="text-sm text-gray-500 ml-2">
                                        {new Date(post.created_at).toLocaleString()}
                                    </div>
                                </div>

                                {isOwnProfile && (
                                    <div className="flex gap-2">
                                        {editingPost === post.id ? (
                                            <>
                                                <button onClick={() => updatePost(post.id)} className="text-green-500 text-sm">Save</button>
                                                <button onClick={cancelEditPost} className="text-gray-500 text-sm">Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEditPost(post)} className="text-blue-500"><FaEdit /></button>
                                                <button onClick={() => deletePost(post.id)} className="text-red-500"><FaTrash /></button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {editingPost === post.id ? (
                                <textarea
                                    className="w-full p-2 border rounded-lg mb-2"
                                    rows="3"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />
                            ) : (
                                <p className="mb-2 text-gray-800">{post.content}</p>
                            )}

                            <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 text-gray-500 hover:text-red-500">
                                {post.user_liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                <span>{post.likes_count} likes</span>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}