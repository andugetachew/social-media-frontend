import React, { useState, useEffect } from 'react';
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

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPosts, setTotalPosts] = useState(0);

    const { user, logout } = useAuth();

    // Fetch feed with pagination
    const fetchFeed = async (reset = false) => {
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
        }
    };

    // Load more posts
    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchFeed(false);
        setLoadingMore(false);
    };

    useEffect(() => {
        if (user) {
            fetchFeed(true);
        }
    }, [user]);

    // Create new post
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
            alert(error.response?.data?.error || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    // Delete post
    const deletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.delete(`/posts/${postId}/`);
            await fetchFeed(true);
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    // Edit post
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
            setEditContent('');
            await fetchFeed(true);
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        }
    };

    // Like/Unlike post
    const toggleLike = async (postId) => {
        try {
            await api.post(`/posts/${postId}/like/`);
            await fetchFeed(true);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    // Comments functions
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
            alert(error.response?.data?.error || 'Failed to add comment');
        }
    };

    const deleteComment = async (commentId, postId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await api.delete(`/comments/${commentId}/`);
            await fetchComments(postId);
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    };

    if (!user) {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-2xl mx-auto p-4">
                {/* Header with Search Bar */}
                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <h1 className="text-xl font-bold">Social Feed</h1>
                        <SearchBar />
                        <div className="flex items-center gap-4">
                            <Link to={`/profile/${user.id}`} className="text-blue-500 hover:text-blue-700">
                                @{user.username}
                            </Link>
                            <button
                                onClick={() => { logout(); window.location.href = '/login'; }}
                                className="text-red-500 hover:text-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Create Post Form */}
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
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            disabled={loading || !newPost.trim()}
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>

                {/* Feed Stats */}
                <div className="text-sm text-gray-500 mb-2">
                    {totalPosts} total posts • Page {page - 1} of {Math.ceil(totalPosts / 10)}
                </div>

                {/* Feed Posts */}
                {posts.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        No posts in your feed. Follow someone or create a post!
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white p-4 rounded-lg shadow mb-4">
                                {/* Post Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center">
                                        <Link to={`/profile/${post.author?.id}`} className="font-bold hover:underline">
                                            {post.author?.username || 'Unknown'}
                                        </Link>
                                        <div className="text-sm text-gray-500 ml-2">
                                            {new Date(post.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Edit/Delete buttons - only for own posts */}
                                    {post.author?.id === user?.id && (
                                        <div className="flex gap-2">
                                            {editingPost === post.id ? (
                                                <>
                                                    <button
                                                        onClick={() => updatePost(post.id)}
                                                        className="text-green-500 hover:text-green-700 text-sm"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditPost}
                                                        className="text-gray-500 hover:text-gray-700 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditPost(post)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => deletePost(post.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Post Content */}
                                {editingPost === post.id ? (
                                    <textarea
                                        className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                        rows="3"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        maxLength="280"
                                    />
                                ) : (
                                    <p className="mb-2 text-gray-800">{post.content}</p>
                                )}

                                {/* Like and Comment Buttons */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleLike(post.id)}
                                        className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        {post.user_liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                        <span>{post.likes_count} likes</span>
                                    </button>

                                    <button
                                        onClick={() => toggleComments(post.id)}
                                        className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        <FaComment />
                                        <span>{comments[post.id]?.length || 0} comments</span>
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {showComments[post.id] && (
                                    <div className="mt-4 pt-3 border-t">
                                        {/* Add Comment */}
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newComment[post.id] || ''}
                                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                onKeyPress={(e) => e.key === 'Enter' && createComment(post.id)}
                                            />
                                            <button
                                                onClick={() => createComment(post.id)}
                                                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600"
                                            >
                                                Post
                                            </button>
                                        </div>

                                        {/* Comments List */}
                                        {comments[post.id]?.length === 0 ? (
                                            <div className="text-center text-gray-500 text-sm py-2">
                                                No comments yet. Be the first!
                                            </div>
                                        ) : (
                                            comments[post.id]?.map((comment) => (
                                                <div key={comment.id} className="bg-gray-50 p-2 rounded-lg mb-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <Link to={`/profile/${comment.author?.id}`} className="font-semibold text-sm hover:underline">
                                                                {comment.author?.username}
                                                            </Link>
                                                            <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {new Date(comment.created_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        {comment.author?.id === user?.id && (
                                                            <button
                                                                onClick={() => deleteComment(comment.id, post.id)}
                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                                title="Delete comment"
                                                            >
                                                                <FaTrash size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors mb-4"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}