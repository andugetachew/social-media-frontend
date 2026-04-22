import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaEdit } from 'react-icons/fa';
import SearchBar from '../components/SearchBar';

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [showComments, setShowComments] = useState({});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPosts, setTotalPosts] = useState(0);

    const { user, logout } = useAuth();
    const observer = useRef();
    const loadingRef = useRef(false);

    const fetchFeed = async (reset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            const currentPage = reset ? 1 : page;
            const response = await api.get(`/posts/feed/?page=${currentPage}&page_size=10`);

            if (reset) {
                setPosts(response.data.results);
                setPage(2);
            } else {
                setPosts(prev => [...prev, ...response.data.results]);
                setPage(prev => prev + 1);
            }

            setTotalPosts(response.data.count);
            setHasMore(response.data.next !== null);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            loadingRef.current = false;
        }
    };

    const lastPostRef = useCallback(node => {
        if (loadingRef.current) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
                fetchFeed(false);
            }
        });
        if (node) observer.current.observe(node);
    }, [hasMore]);

    useEffect(() => {
        if (user) {
            fetchFeed(true);
        }
    }, [user]);

    const createPost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        setLoading(true);
        try {
            await api.post('/posts/', { content: newPost });
            setNewPost('');
            await fetchFeed(true);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}/`);
            await fetchFeed(true);
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
            await fetchFeed(true);
        } catch (error) {
            console.error('Error updating post:', error);
        }
    };

    const toggleLike = async (postId) => {
        try {
            await api.post(`/posts/${postId}/like/`);
            await fetchFeed(true);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const response = await api.get(`/comments/post/${postId}/`);
            setComments(prev => ({ ...prev, [postId]: response.data }));
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const toggleComments = async (postId) => {
        if (!showComments[postId]) {
            await fetchComments(postId);
        }
        setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const createComment = async (postId) => {
        const content = newComment[postId];
        if (!content?.trim()) return;
        try {
            await api.post(`/comments/post/${postId}/`, { content });
            setNewComment(prev => ({ ...prev, [postId]: '' }));
            await fetchComments(postId);
        } catch (error) {
            console.error('Error creating comment:', error);
        }
    };

    const deleteComment = async (commentId, postId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${commentId}/`);
            await fetchComments(postId);
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    if (!user) {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <h1 className="text-xl font-bold">Social Feed</h1>
                        <SearchBar />
                        <div className="flex items-center gap-4">
                            <Link to="/chat" className="text-green-500 hover:text-green-700">
                                💬 Chat
                            </Link>
                            <Link to={`/profile/${user.id}`} className="text-blue-500 hover:text-blue-700">
                                @{user.username}
                            </Link>
                            <button onClick={() => { logout(); window.location.href = '/login'; }} className="text-red-500">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={createPost} className="bg-white p-4 rounded-lg shadow mb-4">
                    <textarea
                        className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="What's on your mind?"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        maxLength="280"
                    />
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">{newPost.length}/280</span>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600" disabled={loading}>
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>

                <div className="text-sm text-gray-500 mb-2">
                    {totalPosts} total posts
                </div>

                {posts.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        No posts in your feed. Follow someone or create a post!
                    </div>
                ) : (
                    posts.map((post, index) => (
                        <div ref={index === posts.length - 1 ? lastPostRef : null} key={post.id} className="bg-white p-4 rounded-lg shadow mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                    <Link to={`/profile/${post.author?.id}`} className="font-bold hover:underline">
                                        {post.author?.username || 'Unknown'}
                                    </Link>
                                    <div className="text-sm text-gray-500 ml-2">
                                        {new Date(post.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {post.author?.id === user?.id && (
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

                            <div className="flex items-center gap-4">
                                <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 text-gray-500 hover:text-red-500">
                                    {post.user_liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                    <span>{post.likes_count} likes</span>
                                </button>
                                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 text-gray-500 hover:text-blue-500">
                                    <FaComment />
                                    <span>{comments[post.id]?.length || 0} comments</span>
                                </button>
                            </div>

                            {showComments[post.id] && (
                                <div className="mt-4 pt-3 border-t">
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Write a comment..."
                                            className="flex-1 p-2 border rounded-lg"
                                            value={newComment[post.id] || ''}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                            onKeyPress={(e) => e.key === 'Enter' && createComment(post.id)}
                                        />
                                        <button onClick={() => createComment(post.id)} className="bg-blue-500 text-white px-3 py-2 rounded-lg">
                                            Post
                                        </button>
                                    </div>
                                    {comments[post.id]?.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 p-2 rounded-lg mb-2">
                                            <div className="flex justify-between">
                                                <Link to={`/profile/${comment.author?.id}`} className="font-semibold text-sm">
                                                    {comment.author?.username}
                                                </Link>
                                                {comment.author?.id === user?.id && (
                                                    <button onClick={() => deleteComment(comment.id, post.id)} className="text-red-500 text-xs">
                                                        <FaTrash size={10} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-gray-700 text-sm">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {loadingMore && <div className="text-center py-4">Loading more...</div>}
            </div>
        </div>
    );
}