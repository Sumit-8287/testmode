import React, { useState, useEffect } from 'react';
import { blogAPI } from '../../src/services/apiClient';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string;
  status: 'draft' | 'published';
  featured: boolean;
  readingTime: number;
  views: number;
  publishDate: string;
  createdAt: string;
  thumbnail?: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Blog: React.FC<Props> = ({ showToast }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category: '',
    tags: '',
    status: 'draft',
    featured: false,
    readingTime: 0,
    views: 0,
    publishDate: new Date().toISOString().split('T')[0],
    thumbnail: ''
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await blogAPI.getAll();
      setPosts(data || []);
    } catch (error) {
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    try {
      const postData = {
        id: editingPost?.id || `post_${Date.now()}`,
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        author: formData.author,
        category: formData.category,
        tags: formData.tags,
        status: formData.status as 'draft' | 'published',
        featured: formData.featured,
        readingTime: parseInt(formData.readingTime.toString()) || 5,
        views: formData.views,
        publishDate: formData.publishDate,
        thumbnail: formData.thumbnail,
        createdAt: editingPost?.createdAt || new Date().toISOString()
      };

      if (editingPost) {
        await blogAPI.update(editingPost.id, postData);
        showToast('Post updated successfully!');
      } else {
        await blogAPI.create(postData);
        showToast('Post created successfully!');
      }

      setShowModal(false);
      setEditingPost(null);
      setThumbnailFile(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        author: '',
        category: '',
        tags: '',
        status: 'draft',
        featured: false,
        readingTime: 0,
        views: 0,
        publishDate: new Date().toISOString().split('T')[0],
        thumbnail: ''
      });
      loadPosts();
    } catch (error) {
      showToast('Failed to save post', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await blogAPI.delete(id);
        showToast('Post deleted successfully!');
        loadPosts();
      } catch (error) {
        showToast('Failed to delete post', 'error');
      }
    }
  };

  const handleThumbnailFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setThumbnailFile(file);
      setFormData(prev => ({ ...prev, thumbnail: file.name }));
      showToast(`Thumbnail selected: ${file.name}`);
    } else {
      showToast('Please select a valid image file', 'error');
    }
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setThumbnailFile(null);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category || '',
      tags: post.tags || '',
      status: post.status,
      featured: post.featured || false,
      readingTime: post.readingTime || 5,
      views: post.views || 0,
      publishDate: post.publishDate || new Date().toISOString().split('T')[0],
      thumbnail: post.thumbnail || ''
    });
    setShowModal(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-lg font-black text-navy uppercase tracking-widest">Blog Posts</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Total: {posts.length}</p>
        </div>
        <button
          onClick={() => { setEditingPost(null); setThumbnailFile(null); setFormData({ title: '', content: '', excerpt: '', author: '', category: '', tags: '', status: 'draft', featured: false, readingTime: 0, views: 0, publishDate: new Date().toISOString().split('T')[0], thumbnail: '' }); setShowModal(true); }}
          className="bg-navy text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2"
        >
          <span className="material-icons-outlined text-base">add</span> Add Post
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <span className="material-icons-outlined text-6xl text-gray-200">article</span>
            <p className="font-black mt-2 uppercase tracking-widest text-gray-300 text-sm">No Posts Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">#</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Title</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Author</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Reading Time</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Views</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Featured</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-navy uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-navy uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post, index) => (
                  <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 text-[11px] font-bold text-navy max-w-xs truncate">{post.title}</td>
                    <td className="px-6 py-4 text-[10px] text-gray-600">{post.author}</td>
                    <td className="px-6 py-4 text-[10px] text-gray-600">{post.category || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase inline-block ${
                        post.status === 'published' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-600">{post.readingTime || 5} min</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-600">{(post.views || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      {post.featured ? (
                        <span className="material-icons-outlined text-sm text-green-600">star</span>
                      ) : (
                        <span className="material-icons-outlined text-sm text-gray-300">star_outline</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-400">{new Date(post.publishDate || post.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEditModal(post)} className="p-2 text-navy hover:bg-gray-100 rounded-lg transition-colors">
                          <span className="material-icons-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <span className="material-icons-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-lg font-black text-navy uppercase tracking-widest">{editingPost ? 'Edit Post' : 'Add Post'}</h3>
              <button onClick={() => { setShowModal(false); setThumbnailFile(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5">
              {/* Title */}
              <div>
                <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Title *</label>
                <input
                  type="text"
                  placeholder="Post title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                />
              </div>

              {/* Author & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Author</label>
                  <input
                    type="text"
                    placeholder="Author name"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Technology, News"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Excerpt</label>
                <textarea
                  placeholder="Short summary"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors resize-none"
                  rows={2}
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Content *</label>
                <textarea
                  placeholder="Full post content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors resize-none"
                  rows={6}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="Comma separated tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Thumbnail Image</label>
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleThumbnailFile(file);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-100 rounded-xl p-6 text-center cursor-pointer hover:border-navy hover:bg-gray-50 transition-all"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleThumbnailFile(e.target.files[0])}
                    className="hidden"
                    id="thumbnail-input"
                  />
                  <label htmlFor="thumbnail-input" className="cursor-pointer block">
                    {thumbnailFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-icons-outlined text-green-600 text-3xl">check_circle</span>
                        <p className="text-[11px] font-black text-green-600 uppercase">{thumbnailFile.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-icons-outlined text-gray-300 text-3xl">image</span>
                        <p className="text-[11px] font-black text-gray-600 uppercase">Drop image or click to browse</p>
                        <p className="text-[9px] text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Reading Time */}
              <div>
                <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Reading Time (minutes)</label>
                <input
                  type="number"
                  placeholder="5"
                  value={formData.readingTime}
                  onChange={(e) => setFormData({ ...formData, readingTime: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                  min="1"
                />
              </div>

              {/* Publish Date & Views */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Publish Date</label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Views</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.views}
                    onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none placeholder-gray-400 focus:border-navy transition-colors"
                    min="0"
                  />
                </div>
              </div>

              {/* Status & Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-navy uppercase tracking-widest block mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold outline-none focus:border-navy transition-colors"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-100 accent-navy"
                    />
                    <span className="text-[10px] font-black text-navy uppercase tracking-widest">Featured Post</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-4 px-8 py-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setShowModal(false); setThumbnailFile(null); }}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-black text-xs uppercase hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-navy text-white py-3 rounded-xl font-black text-xs uppercase hover:shadow-md transition-all"
              >
                {editingPost ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
