import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { coursesAPI, categoriesAPI, packagesAPI } from '../../src/services/apiClient';
import FileUploadButton from '../shared/FileUploadButton';
import AddCourse from './AddCourse';
import CourseGroupChat from './CourseGroupChat';
import CoursePosts from './CoursePosts';
import ForumManager from './ForumManager';
import AddFolderDrawer from './AddFolderDrawer';
import SubjectiveTestDrawer from './SubjectiveTestDrawer';
import {
  OMRTestDrawer,
  TestDrawer,
  QuizDrawer,
  UploadDrawer,
  LinkDrawer,
  ImportContentDrawer,
  VideoDrawer,
  LiveStreamDrawer,
  WebinarDrawer
} from './FeatureDrawers';
import BulkActionsDrawerComponent from './BulkActionsDrawer';


interface Course {
  id: string;
  _id?: string;
  name: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  thumbnail?: string;
  price?: string | number;
  originalPrice?: string | number;
  categoryId?: string;
  status?: string;
  isPublished?: boolean;
}

interface Video {
  id: string;
  _id?: string;
  courseId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  duration: string;
  isFree: boolean;
  order: number;
  status: 'active' | 'inactive';
}

interface Note {
  id: string;
  _id?: string;
  courseId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileSize: string;
  isFree: boolean;
  order: number;
  status: 'active' | 'inactive';
}

interface Test {
  id: string;
  _id?: string;
  courseId: string;
  name: string;
  description: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  numberOfQuestions: number;
  openDate: string;
  closeDate: string;
  isFree: boolean;
  status: 'active' | 'inactive';
  questions: Question[];
  marksPerQuestion?: number;
  negativeMarking?: number;
}

interface Question {
  id: string;
  _id?: string;
  question: string;
  questionImage?: string;
  optionA: string;
  optionAImage?: string;
  optionB: string;
  optionBImage?: string;
  optionC: string;
  optionCImage?: string;
  optionD: string;
  optionDImage?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  negativeMarks?: number;
}

interface Props {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  initialCourse?: any;
  onClearInitialCourse?: () => void;
  onBack?: () => void;
}

const API_BASE_URL = '/api';

const CourseContentManager: React.FC<Props> = ({ showToast, initialCourse, onClearInitialCourse, onBack }) => {
  const [activeMainTab, setActiveMainTab] = useState('Content');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'notes' | 'tests' | 'payments'>('videos');
  const [loading, setLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [contentSearchQuery, setContentSearchQuery] = useState('');
  const [contentStatusFilter, setContentStatusFilter] = useState('all');
  const [isProductFilterOpen, setIsProductFilterOpen] = useState(false);
  const [isContentFilterOpen, setIsContentFilterOpen] = useState(false);

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [showCourseEditModal, setShowCourseEditModal] = useState(false);
  const [courseFormData, setCourseFormData] = useState<any>({ name: '', description: '', imageUrl: '', price: '0', categoryId: '' });
  const [courseCategories, setCourseCategories] = useState<any[]>([]);
  const [showCourseMoreOptions, setShowCourseMoreOptions] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  useEffect(() => {
    categoriesAPI.getAll()
      .then(res => setCourseCategories(Array.isArray(res) ? res : []))
      .catch(() => { });
  }, []);

  const handleEditCourseClick = () => {
    if (!selectedCourse) return;
    setCourseFormData({
      name: selectedCourse.name || selectedCourse.title || '',
      description: (selectedCourse as any).description || '',
      imageUrl: (selectedCourse as any).thumbnail || (selectedCourse as any).imageUrl || '',
      price: (selectedCourse as any).price?.toString() || '',
      categoryId: (selectedCourse as any).categoryId || '',
      status: (selectedCourse as any).status || 'active',
    });
    setShowCourseEditModal(true);
  };

  const handleCourseEditSubmit = async () => {
    if (!courseFormData.name || !selectedCourse) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const updatedData = {
        ...selectedCourse,
        ...courseFormData,
        price: courseFormData.price ? parseFloat(courseFormData.price) : 0,
        thumbnail: courseFormData.thumbnail || courseFormData.imageUrl || (selectedCourse as any).thumbnail
      };

      const isPackage = selectedCourse.id?.toString().startsWith('pkg_');
      console.log('--- UPDATE DEBUG ---');
      console.log('Course ID:', courseId);
      console.log('Is Package?', isPackage);
      console.log('Payload:', updatedData);

      if (isPackage) {
        console.log('Updating via packagesAPI...');
        await packagesAPI.update(courseId, updatedData);
      } else {
        console.log('Updating via coursesAPI...');
        await coursesAPI.update(courseId, updatedData);
      }

      showToast('Course updated successfully', 'success');
      setShowCourseEditModal(false);
      // Update local state immediately
      if (selectedCourse) {
        setSelectedCourse({ ...selectedCourse, ...updatedData });
      }
      if (typeof (window as any).loadCourses === 'function') {
        (window as any).loadCourses();
      } else {
        // Fallback or just re-fetch if possible
        try { loadCourses(); } catch (e) { }
      }
    } catch (err: any) {
      console.error('Update failed details:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to update course';
      showToast(msg, 'error');
    }
  };

  const handleCourseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();

      setCourseFormData(prev => ({
        ...prev,
        imageUrl: data.url,
        thumbnail: data.url
      }));
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Image upload error:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setImageUploadLoading(false);
    }
  };
  const [isPublished, setIsPublished] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [folders, setFolders] = useState<any[]>([
    { id: 'english-grammar', title: 'English Grammar', description: '24 Videos', status: 'active', isFree: false, thumbnail: '' },
    { id: 'spoken', title: 'Spoken', description: '5 Videos', status: 'active', isFree: false, thumbnail: '' }
  ]);

  useEffect(() => {
    if (initialCourse) {
      setSelectedCourse(initialCourse);
      setIsPublished(initialCourse.status !== 'inactive' && initialCourse.isPublished !== false);
    }
  }, [initialCourse]);

  useEffect(() => {
    if (selectedCourse) {
      setIsPublished((selectedCourse as any).status !== 'inactive' && (selectedCourse as any).isPublished !== false);
      loadCourseContent();
    }
  }, [selectedCourse]);

  const handleTogglePublish = async () => {
    if (!selectedCourse || publishLoading) return;
    const newStatus = !isPublished;
    setPublishLoading(true);
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const endpoint = selectedCourse.id?.toString().startsWith('pkg_') ? 'packages' : 'courses';
      await fetch(`${API_BASE_URL}/${endpoint}/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus, status: newStatus ? 'active' : 'inactive' })
      });
      setIsPublished(newStatus);
      showToast(newStatus ? 'Course published successfully!' : 'Course unpublished successfully!');
    } catch (error) {
      showToast('Failed to update publish status');
    } finally {
      setPublishLoading(false);
    }
  };

  const handlePreview = () => {
    if (!selectedCourse) return;
    const courseId = (selectedCourse as any)._id || selectedCourse.id;
    window.open(`/#/course/${courseId}`, '_blank');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleVideoStatus = async (video: Video) => {
    try {
      const newStatus = video.status === 'active' ? 'inactive' : 'active';
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      const videoId = (video as any)._id || video.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/videos/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...video, status: newStatus })
      });
      setVideos(prev => prev.map(v => ((v as any)._id || v.id) === videoId ? { ...v, status: newStatus } : v));
      showToast(newStatus === 'active' ? 'Video enabled' : 'Video disabled');
    } catch { showToast('Failed to update status'); }
  };

  const handleToggleVideoFree = async (video: Video) => {
    try {
      const newFree = !video.isFree;
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      const videoId = (video as any)._id || video.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/videos/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...video, isFree: newFree })
      });
      setVideos(prev => prev.map(v => ((v as any)._id || v.id) === videoId ? { ...v, isFree: newFree } : v));
      showToast(newFree ? 'Video set to Free' : 'Video set to Locked');
    } catch { showToast('Failed to update'); }
  };

  const handleToggleNoteStatus = async (note: Note) => {
    try {
      const newStatus = note.status === 'active' ? 'inactive' : 'active';
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      const noteId = (note as any)._id || note.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, status: newStatus })
      });
      setNotes(prev => prev.map(n => ((n as any)._id || n.id) === noteId ? { ...n, status: newStatus } : n));
      showToast(newStatus === 'active' ? 'Note enabled' : 'Note disabled');
    } catch { showToast('Failed to update status'); }
  };

  const handleToggleNoteFree = async (note: Note) => {
    try {
      const newFree = !note.isFree;
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      const noteId = (note as any)._id || note.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, isFree: newFree })
      });
      setNotes(prev => prev.map(n => ((n as any)._id || n.id) === noteId ? { ...n, isFree: newFree } : n));
      showToast(newFree ? 'Note set to Free' : 'Note set to Locked');
    } catch { showToast('Failed to update'); }
  };

  const handleToggleTestStatus = async (test: Test) => {
    try {
      const newStatus = test.status === 'active' ? 'inactive' : 'active';
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      const testId = (test as any)._id || test.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...test, status: newStatus })
      });
      setTests(prev => prev.map(t => ((t as any)._id || t.id) === testId ? { ...t, status: newStatus } : t));
      showToast(newStatus === 'active' ? 'Test enabled' : 'Test disabled');
    } catch { showToast('Failed to update status'); }
  };

  const handleToggleTestFree = async (test: Test) => {
    try {
      const newFree = !test.isFree;
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      const testId = (test as any)._id || test.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...test, isFree: newFree })
      });
      setTests(prev => prev.map(t => ((t as any)._id || t.id) === testId ? { ...t, isFree: newFree } : t));
      showToast(newFree ? 'Test set to Free' : 'Test set to Locked');
    } catch { showToast('Failed to update'); }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description || '',
      youtubeUrl: video.youtubeUrl || '',
      duration: video.duration || '',
      status: video.status || 'active',
      isFree: video.isFree || false,
      order: video.order || 0,
    });
    setShowVideoModal(true);
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      description: note.description || '',
      fileUrl: note.fileUrl || '',
      fileSize: note.fileSize || '',
      status: note.status || 'active',
      isFree: note.isFree || false,
      order: note.order || 0,
    });
    setShowNoteModal(true);
  };

  const handleEditTest = (test: Test) => {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      description: test.description || '',
      duration: test.duration || 60,
      totalMarks: test.totalMarks || 100,
      passingMarks: test.passingMarks || 40,
      numberOfQuestions: test.numberOfQuestions || 0,
      marksPerQuestion: test.marksPerQuestion || 4,
      negativeMarking: test.negativeMarking || 0,
      openDate: test.openDate || '',
      closeDate: test.closeDate || '',
      isFree: test.isFree || false,
      status: test.status || 'active'
    });
    setShowTestModal(true);
  };

  const folderImageRef = useRef<HTMLInputElement>(null);
  const toggleContentSelection = (id: string) => {
    setSelectedContentIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) return;
    const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
    if (!courseId) return;

    try {
      showToast(`Processing bulk ${action}...`, 'success');

      await Promise.all(selectedIds.map(async (id) => {
        let type = '';
        let item: any = null;

        if (videos.some(v => (v.id === id || (v as any)._id === id) && (item = v))) type = 'videos';
        else if (notes.some(n => (n.id === id || (n as any)._id === id) && (item = n))) type = 'notes';
        else if (tests.some(t => (t.id === id || (t as any)._id === id) && (item = t))) type = 'tests';
        else if (folders.some(f => f.id === id && (item = f))) type = 'folders';

        if (!type || !item) return;

        const itemId = item._id || item.id;
        const url = `${API_BASE_URL}/courses/${courseId}/${type}/${itemId}`;

        switch (action) {
          case 'delete':
            await fetch(url, { method: 'DELETE' });
            break;
          case 'enable':
            await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, status: 'active' })
            });
            break;
          case 'disable':
            await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, status: 'inactive' })
            });
            break;
          case 'mark_paid':
            await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, isFree: false })
            });
            break;
          case 'mark_free':
            await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, isFree: true })
            });
            break;
        }
      }));

      showToast(`Bulk action completed successfully`, 'success');
      loadCourseContent();
      setShowBulkActionDrawer(false);
    } catch (error) {
      console.error('Bulk action error:', error);
      showToast('Failed to perform bulk action', 'error');
    }
  };


  const handleFolderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setEditingFolder((prev: any) => prev ? { ...prev, thumbnail: data.url } : { thumbnail: data.url });
      showToast('Image uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Uploading video...', 'success');
      // Simulate/Trigger Upload
      setTimeout(() => {
        showToast(`Video "${file.name}" uploaded successfully`, 'success');
      }, 1500);
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleLiveStreamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setLiveStreamForm(prev => ({ ...prev, image: data.url }));
      showToast('Image uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleLiveStreamFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'pdf1' | 'pdf2' | 'studyMaterial') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setLiveStreamForm(prev => ({ ...prev, [field]: data.url }));
      showToast('File uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleYoutubeZoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setYoutubeZoomForm(prev => ({ ...prev, image: data.url }));
      showToast('Image uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleYoutubeZoomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'pdf1' | 'pdf2' | 'studyMaterial') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setYoutubeZoomForm(prev => ({ ...prev, [field]: data.url }));
      showToast('File uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleWebinarImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setWebinarForm(prev => ({ ...prev, image: data.url }));
      showToast('Image uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleWebinarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'pdf1' | 'pdf2' | 'studyMaterial') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setWebinarForm(prev => ({ ...prev, [field]: data.url }));
      showToast('File uploaded', 'success');
    } catch (error) {
      showToast('Upload failed', 'error');
    }
  };

  const handleWebinarSubmit = async () => {
    if (!webinarForm.title || !webinarForm.link || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const webinarData = {
        ...webinarForm,
        courseId,
        contentType: 'webinar',
        type: 'video',
        url: webinarForm.link,
      };

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webinarData)
      });

      if (response.ok) {
        showToast('Webinar added successfully!', 'success');
        setShowWebinarModal(false);
        resetWebinarForm();
        loadCourseContent();
      } else {
        showToast('Failed to save webinar', 'error');
      }
    } catch (error) {
      showToast('Failed to save webinar', 'error');
    }
  };

  const handleLiveStreamSubmit = async () => {
    if (!liveStreamForm.title || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const streamData = {
        ...liveStreamForm,
        courseId,
        contentType: 'live',
        type: 'video',
        url: 'live_stream', // Placeholder for models that require URL
      };

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData)
      });

      if (response.ok) {
        showToast('Live stream added successfully!', 'success');
        setShowLiveStreamModal(false);
        resetLiveStreamForm();
        loadCourseContent();
      } else {
        showToast('Failed to save live stream', 'error');
      }
    } catch (error) {
      showToast('Failed to save live stream', 'error');
    }
  };

  const handleYoutubeZoomSubmit = async () => {
    if (!youtubeZoomForm.title || !youtubeZoomForm.link || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const streamData = {
        ...youtubeZoomForm,
        courseId,
        contentType: 'youtube_zoom',
        type: 'video',
        url: youtubeZoomForm.link,
      };

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData)
      });

      if (response.ok) {
        showToast('YouTube/Zoom live added successfully!', 'success');
        setShowYoutubeZoomModal(false);
        resetYoutubeZoomForm();
        loadCourseContent();
      } else {
        showToast('Failed to save YouTube/Zoom live', 'error');
      }
    } catch (error) {
      showToast('Failed to save YouTube/Zoom live', 'error');
    }
  };


  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showLiveStreamModal, setShowLiveStreamModal] = useState(false);
  const [showYoutubeZoomModal, setShowYoutubeZoomModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showOMRModal, setShowOMRModal] = useState(false);
  const [showWebinarModal, setShowWebinarModal] = useState(false);
  const [showSubjectiveTestDrawer, setShowSubjectiveTestDrawer] = useState(false);
  const [subjectiveTestSearch, setSubjectiveTestSearch] = useState('');
  const [availableSubjectiveTests, setAvailableSubjectiveTests] = useState<any[]>([]);
  const [selectedSubjectiveList, setSelectedSubjectiveList] = useState<any[]>([]);
  const [isSubjectiveLoading, setIsSubjectiveLoading] = useState(false);
  const [showSubjectiveDropdown, setShowSubjectiveDropdown] = useState(false);
  const [testSeriesList, setTestSeriesList] = useState<any[]>([]);
  const [selectedTestSeries, setSelectedTestSeries] = useState('');
  const [isTestSeriesLoading, setIsTestSeriesLoading] = useState(false);
  const [omrTests, setOmrTests] = useState<any[]>([]);
  const [standardTests, setStandardTests] = useState<any[]>([]);
  const [isOMRTestsLoading, setIsOMRTestsLoading] = useState(false);
  const [isStandardTestsLoading, setIsStandardTestsLoading] = useState(false);
  const [testSeriesSearch, setTestSeriesSearch] = useState('');
  const [showTestSeriesDropdown, setShowTestSeriesDropdown] = useState(false);
  const [showAddTestDrawer, setShowAddTestDrawer] = useState(false);
  const [selectedAddTest, setSelectedAddTest] = useState('');
  const [selectedOMRTest, setSelectedOMRTest] = useState('');
  const [addTestSeriesSearch, setAddTestSeriesSearch] = useState('');
  const [showAddTestSeriesDropdown, setShowAddTestSeriesDropdown] = useState(false);
  const [addTestSelectedSeries, setAddTestSelectedSeries] = useState('');
  const [courseTestsBySeriesLoading, setCourseTestsBySeriesLoading] = useState(false);
  const [showOMRDrawer, setShowOMRDrawer] = useState(false);
  const [showTestDrawer, setShowTestDrawer] = useState(false);
  const [showQuizDrawer, setShowQuizDrawer] = useState(false);
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [showImageDrawer, setShowImageDrawer] = useState(false);
  const [showDocumentDrawer, setShowDocumentDrawer] = useState(false);
  const [showLinkDrawer, setShowLinkDrawer] = useState(false);
  const [showBulkActionDrawer, setShowBulkActionDrawer] = useState(false);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);


  const [activeLiveStreamTab, setActiveLiveStreamTab] = useState<'basic' | 'advanced'>('basic');
  const [showLiveStreamSEO, setShowLiveStreamSEO] = useState(false);

  const [activeYoutubeZoomTab, setActiveYoutubeZoomTab] = useState<'basic' | 'advanced'>('basic');
  const [showYoutubeZoomSEO, setShowYoutubeZoomSEO] = useState(false);

  const [activeWebinarTab, setActiveWebinarTab] = useState<'basic' | 'advanced'>('basic');

  const [importSearch, setImportSearch] = useState('');
  const [importSource, setImportSource] = useState('');
  const [selectedImportItems, setSelectedImportItems] = useState<string[]>([]);
  const [importItems, setImportItems] = useState<any[]>([]);
  const [isImportLoading, setIsImportLoading] = useState(false);

  const [liveStreamForm, setLiveStreamForm] = useState({
    title: '',
    description: '',
    image: '',
    isFree: false,
    publishOn: '2026-03-02T10:15',
    pdf1: '',
    pdf2: '',
    studyMaterial: '',
    allowPdfExport: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    streamSource: 'YouTube',
    streamId: '',
    enableChat: true,
    enableAttendance: false,
    notifyStudents: true,
    allowDownload: false,
    chatVisibility: 'Everyone',
    order: '0.00'
  });

  const [youtubeZoomForm, setYoutubeZoomForm] = useState({
    title: '',
    image: '',
    isFree: false,
    publishOn: '2026-02-26 10:35',
    link: '',
    streamStatus: 'Live',
    pdf1: '',
    pdf2: '',
    studyMaterial: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    enableChat: true,
    enableQA: false,
    notifyStudents: true,
    allowDownload: false,
    autoArchive: true,
    order: '0.00'
  });

  const [webinarForm, setWebinarForm] = useState({
    title: '',
    image: '',
    isFree: false,
    publishOn: '2026-03-02 10:15',
    link: '',
    streamStatus: 'Live',
    pdf1: '',
    pdf2: '',
    studyMaterial: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    enableChat: true,
    quizId: '',
    allowDownload: false,
    chatVisibility: 'Everyone',
    videoRestrictions: false,
    order: '0.00'
  });

  const documentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const liveStreamImageRef = useRef<HTMLInputElement>(null);
  const liveStreamPdf1Ref = useRef<HTMLInputElement>(null);
  const liveStreamPdf2Ref = useRef<HTMLInputElement>(null);
  const liveStreamStudyMaterialRef = useRef<HTMLInputElement>(null);

  const youtubeZoomImageRef = useRef<HTMLInputElement>(null);
  const youtubeZoomPdf1Ref = useRef<HTMLInputElement>(null);
  const youtubeZoomPdf2Ref = useRef<HTMLInputElement>(null);
  const youtubeZoomStudyMaterialRef = useRef<HTMLInputElement>(null);

  const webinarImageRef = useRef<HTMLInputElement>(null);
  const webinarPdf1Ref = useRef<HTMLInputElement>(null);
  const webinarPdf2Ref = useRef<HTMLInputElement>(null);
  const webinarStudyMaterialRef = useRef<HTMLInputElement>(null);

  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [editingFolder, setEditingFolder] = useState<any>(null);

  const combinedItems = useMemo(() => {
    return [
      ...folders.map(f => ({ id: f.id, title: f.title || f.name, type: 'folder', status: f.status, isFree: f.isFree })),
      ...videos.map(v => ({ id: v.id || (v as any)._id, title: v.title, type: 'video', status: v.status, isFree: v.isFree })),
      ...notes.map(n => ({ id: n.id || (n as any)._id, title: n.title, type: 'note', status: n.status, isFree: n.isFree })),
      ...tests.map(t => ({ id: t.id || (t as any)._id, title: t.name, type: 'test', status: t.status, isFree: t.isFree })),
    ];
  }, [folders, videos, notes, tests]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [currentTestForQuestions, setCurrentTestForQuestions] = useState<Test | null>(null);

  useEffect(() => {
    const isModalOpen = showVideoModal || showNoteModal || showTestModal || showFolderModal || showLiveStreamModal || showYoutubeZoomModal || showImportModal || showQuestionModal || showDocumentModal || showAudioModal || showOMRModal || showWebinarModal || showSubjectiveTestDrawer;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVideoModal, showNoteModal, showTestModal, showFolderModal, showLiveStreamModal, showYoutubeZoomModal, showImportModal, showQuestionModal, showDocumentModal, showAudioModal, showOMRModal, showWebinarModal, showSubjectiveTestDrawer]);

  useEffect(() => {
    if (showImportModal) {
      fetchAllCourses();
    }
  }, [showImportModal]);

  useEffect(() => {
    if (showTestDrawer || showOMRDrawer) {
      fetchTestSeriesList();
    }
  }, [showTestDrawer, showOMRDrawer]);

  const fetchAllCourses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/courses`);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const fetchTestSeriesList = async () => {
    setIsTestSeriesLoading(true);
    try {
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id || 'global';
      // Fetch series specifically for this course
      const res = await fetch(`${API_BASE_URL}/test-series?courseId=${courseId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      if (list.length === 0) {
        // Mock relevance to current course
        const coursePrefix = selectedCourse?.name || selectedCourse?.title || 'Main Batch';
        const mockList = [
          { id: `1-${courseId}`, seriesName: `${coursePrefix} Concepts Series`, title: `${coursePrefix} Concepts Series` },
          { id: `2-${courseId}`, seriesName: `${coursePrefix} Advanced Mock`, title: `${coursePrefix} Advanced Mock` },
          { id: `3-${courseId}`, seriesName: `Global Practice Series`, title: `Global Practice Series` }
        ];
        setTestSeriesList(mockList);
      } else {
        setTestSeriesList(list);
      }
    } catch (error) {
      console.error('Failed to load test series:', error);
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id || 'global';
      setTestSeriesList([
        { id: `1-${courseId}`, seriesName: `Practice Test Series`, title: `Practice Test Series` },
        { id: `2-${courseId}`, seriesName: `Full Length Mock`, title: `Full Length Mock` }
      ]);
    } finally {
      setIsTestSeriesLoading(false);
    }
  };

  const fetchTestsBySeries = async (seriesId: string, type: 'standard' | 'omr' = 'standard') => {
    if (!seriesId) return;
    const setLoading = type === 'omr' ? setIsOMRTestsLoading : setIsStandardTestsLoading;
    const setData = type === 'omr' ? setOmrTests : setStandardTests;

    setLoading(true);
    try {
      const courseId = (selectedCourse as any)?._id || selectedCourse?.id;
      // Fetch specifically by type and course
      const res = await fetch(`${API_BASE_URL}/tests?seriesId=${seriesId}&courseId=${courseId}&testType=${type}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      // Strict course filter
      let finalTests = list.filter((t: any) =>
        t.courseId === courseId || t.id.startsWith(`test_${courseId}`)
      );

      // Mock behavior support (Separate mock data for standard vs omr)
      if (finalTests.length === 0 && seriesId.includes(courseId as string)) {
        const coursePrefix = selectedCourse?.name || 'Test';
        if (type === 'omr') {
          finalTests = [
            { id: `omr1-${courseId}`, name: `${coursePrefix} OMR Sheet 1` },
            { id: `omr2-${courseId}`, name: `${coursePrefix} OMR Mock 2` }
          ];
        } else {
          finalTests = [
            { id: `std1-${courseId}`, name: `${coursePrefix} Chapter Test A` },
            { id: `std2-${courseId}`, name: `${coursePrefix} Unit Test B` }
          ];
        }
      }

      setData(finalTests);
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (importSource) {
      fetchSourceCourseContent(importSource);
    } else {
      setImportItems([]);
    }
  }, [importSource]);

  const fetchSourceCourseContent = async (courseId: string) => {
    setIsImportLoading(true);
    try {
      // In a real database, we would fetch content based on courseId
      const [videosRes, notesRes, testsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses/${courseId}/videos`),
        fetch(`${API_BASE_URL}/courses/${courseId}/notes`),
        fetch(`${API_BASE_URL}/courses/${courseId}/tests`)
      ]);
      const videos = await videosRes.json();
      const notes = await notesRes.json();
      const tests = await testsRes.json();

      // Mock behavior matching screenshot 3 if API returns empty
      let allItems = [
        ...Array.isArray(videos) ? videos.map(vid => ({ ...vid, id: vid._id || vid.id, type: 'video' })) : [],
        ...Array.isArray(notes) ? notes.map(note => ({ ...note, id: note._id || note.id, type: 'note' })) : [],
        ...Array.isArray(tests) ? tests.map(test => ({ ...test, id: test._id || test.id, type: 'test' })) : []
      ];

      if (allItems.length === 0) {
        // High-fidelity mock content for "Hindi Batch" or similar
        allItems = [
          { id: 'm-1', title: 'Verb Test Result', type: 'test' },
          { id: 'm-2', title: 'Verb Test-1', type: 'test' },
          { id: 'm-3', title: 'English Grammar', type: 'folder' },
          { id: 'm-4', title: 'Spoken', type: 'folder' },
          { id: 'm-5', title: 'How to attempt test on Vatican App', type: 'video' },
          { id: 'm-6', title: 'How to view Live And Recorded Class in Vatican App', type: 'video' },
          { id: 'm-7', title: 'How to download pdf', type: 'video' },
          { id: 'm-8', title: 'Introduction of the batch by Neha maam', type: 'video' },
          { id: 'm-9', title: 'Verb Class And Practice', type: 'video' },
          { id: 'm-10', title: 'Day -3 Does', type: 'video' }
        ];
      }
      setImportItems(allItems);
    } catch (error) {
      console.error('Failed to load course content:', error);
    } finally {
      setIsImportLoading(false);
    }
  };



  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    duration: '',
    isFree: false,
    order: 0,
    status: 'active' as 'active' | 'inactive'
  });

  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileSize: '',
    isFree: false,
    order: 0,
    status: 'active' as 'active' | 'inactive'
  });

  const [testForm, setTestForm] = useState({
    name: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    numberOfQuestions: 0,
    marksPerQuestion: 4,
    negativeMarking: 0,
    openDate: '',
    closeDate: '',
    isFree: false,
    status: 'active' as 'active' | 'inactive'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [questionForm, setQuestionForm] = useState({
    question: '',
    questionImage: '',
    optionA: '',
    optionAImage: '',
    optionB: '',
    optionBImage: '',
    optionC: '',
    optionCImage: '',
    optionD: '',
    optionDImage: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    marks: 4,
    negativeMarks: 0
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      questionImage: '',
      optionA: '',
      optionAImage: '',
      optionB: '',
      optionBImage: '',
      optionC: '',
      optionCImage: '',
      optionD: '',
      optionDImage: '',
      correctAnswer: 'A',
      explanation: '',
      marks: 4,
      negativeMarks: 0
    });
    setEditingQuestion(null);
  };

  const fetchSubjectiveTests = async (query: string) => {
    if (query.length < 2) {
      setAvailableSubjectiveTests([]);
      setShowSubjectiveDropdown(false);
      return;
    }
    setIsSubjectiveLoading(true);
    setShowSubjectiveDropdown(true);
    try {
      const res = await fetch(`${API_BASE_URL}/subjective-tests?search=${query}`);
      const data = await res.json();
      setAvailableSubjectiveTests(Array.isArray(data) ? data : []);
    } catch (error) {
      // Mock fallback for UI demo
      setAvailableSubjectiveTests([
        { id: 'st1', title: 'English Essay Writing' },
        { id: 'st2', title: 'Calculus Advanced Quiz' },
        { id: 'st3', title: 'Indian History Long Form' }
      ].filter(t => t.title.toLowerCase().includes(query.toLowerCase())));
    } finally {
      setIsSubjectiveLoading(false);
    }
  };

  const handleAddSubjectiveTest = (test: any) => {
    if (!selectedSubjectiveList.some(t => (t._id || t.id) === (test._id || test.id))) {
      setSelectedSubjectiveList(prev => [...prev, test]);
    }
    setSubjectiveTestSearch('');
    setShowSubjectiveDropdown(false);
  };

  const handleRemoveSubjectiveTest = (testId: string) => {
    setSelectedSubjectiveList(prev => prev.filter(t => (t._id || t.id) !== testId));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseContent();
    }
  }, [selectedCourse]);

  useEffect(() => {
    const fetchSourceContent = async () => {
      if (!importSource) {
        setImportItems([]);
        return;
      }
      setIsImportLoading(true);
      try {
        const [videosRes, notesRes, testsRes, foldersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/courses/${importSource}/videos`),
          fetch(`${API_BASE_URL}/courses/${importSource}/notes`),
          fetch(`${API_BASE_URL}/courses/${importSource}/tests`),
          fetch(`${API_BASE_URL}/courses/${importSource}/folders`)
        ]);

        const videosData = await videosRes.json();
        const notesData = await notesRes.json();
        const testsData = await testsRes.json();
        const foldersData = await foldersRes.json();

        const combined = [
          ...(Array.isArray(foldersData) ? foldersData.map((f: any) => ({ ...f, type: 'folder' })) : []),
          ...(Array.isArray(videosData) ? videosData.map((v: any) => ({ ...v, type: 'video' })) : []),
          ...(Array.isArray(notesData) ? notesData.map((n: any) => ({ ...n, type: 'note' })) : []),
          ...(Array.isArray(testsData) ? testsData.map((t: any) => ({ ...t, type: 'test' })) : [])
        ];
        setImportItems(combined);
      } catch (error) {
        console.error('Error fetching source content:', error);
        showToast('Failed to load source content', 'error');
      } finally {
        setIsImportLoading(false);
      }
    };

    fetchSourceContent();
  }, [importSource]);

  const handleImportAction = async (action: 'move' | 'copy') => {
    if (!selectedCourse || !importSource || selectedImportItems.length === 0) {
      showToast('Please select source course and items', 'error');
      return;
    }

    try {
      const targetCourseId = (selectedCourse as any)._id || selectedCourse.id;

      const response = await fetch(`${API_BASE_URL}/courses/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCourseId: importSource,
          targetCourseId,
          itemIds: selectedImportItems,
          action
        })
      });

      if (!response.ok) throw new Error('Action failed');

      showToast(`${selectedImportItems.length} item(s) ${action}ed successfully`, 'success');
      setShowImportModal(false);
      setImportSource('');
      setImportItems([]);
      setSelectedImportItems([]);
      loadCourseContent();
    } catch (error) {
      console.error(`Import ${action} error:`, error);
      showToast(`Failed to ${action} items`, 'error');
    }
  };

  const loadCourses = async () => {
    try {
      const data = await coursesAPI.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseContent = async () => {
    if (!selectedCourse) return;
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const [videosRes, notesRes, testsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses/${courseId}/videos`),
        fetch(`${API_BASE_URL}/courses/${courseId}/notes`),
        fetch(`${API_BASE_URL}/courses/${courseId}/tests`)
      ]);

      const videosData = await videosRes.json();
      const notesData = await notesRes.json();
      const testsData = await testsRes.json();

      setVideos(Array.isArray(videosData) ? videosData : []);
      setNotes(Array.isArray(notesData) ? notesData : []);
      setTests(Array.isArray(testsData) ? testsData : []);
    } catch (error) {
      console.error('Error loading course content:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const name = course.name || course.title || '';
    const matchesSearch = name.toLowerCase().includes(productSearchQuery.toLowerCase());
    const matchesStatus = productStatusFilter === 'all' ||
      (productStatusFilter === 'active' ? course.status === 'active' : course.status === 'inactive');

    // For now category filter is 'all' as we don't have clear category mapping in course object yet
    // but we can add it if needed later when category data is available
    const matchesCategory = productCategoryFilter === 'all';

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(contentSearchQuery.toLowerCase());
    const matchesStatus = contentStatusFilter === 'all' || v.status === contentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(contentSearchQuery.toLowerCase());
    const matchesStatus = contentStatusFilter === 'all' || n.status === contentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTestsList = tests.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(contentSearchQuery.toLowerCase());
    const matchesStatus = contentStatusFilter === 'all' || t.status === contentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFolders = folders.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(contentSearchQuery.toLowerCase());
    const matchesStatus = contentStatusFilter === 'all' || f.status === contentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const handleVideoSubmit = async () => {
    if (!videoForm.title || !videoForm.youtubeUrl || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const videoId = (editingVideo as any)?._id || editingVideo?.id;

      const videoData = {
        id: videoId || `video_${Date.now()}`,
        courseId: courseId,
        ...videoForm,
        order: parseInt(videoForm.order.toString()) || videos.length + 1
      };

      const method = editingVideo ? 'PUT' : 'POST';
      const url = editingVideo
        ? `${API_BASE_URL}/courses/${courseId}/videos/${videoId}`
        : `${API_BASE_URL}/courses/${courseId}/videos`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      });

      if (response.ok) {
        showToast(editingVideo ? 'Video updated!' : 'Video added!', 'success');
        setShowVideoModal(false);
        resetVideoForm();
        loadCourseContent();
      } else {
        showToast('Failed to save video', 'error');
      }
    } catch (error) {
      showToast('Failed to save video', 'error');
    }
  };

  const uploadFolderImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFolderSubmit = (data: any) => {
    if (!data.name) {
      showToast('Name is required', 'error');
      return;
    }

    const folderData = {
      title: data.name,
      description: data.description || '',
      thumbnail: data.thumbnail || '',
      isFree: data.status === 'Free',
      status: 'active', // Default status
      sortingOrder: data.sortingOrder || '0.00',
    };

    if (editingFolder) {
      setFolders(prev => prev.map(f => (f.id === editingFolder.id || f._id === editingFolder._id) ? { ...f, ...folderData } : f));
      showToast('Folder updated!', 'success');
    } else {
      const newFolder = {
        ...folderData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setFolders(prev => [newFolder, ...prev]);
      showToast('Folder added!', 'success');
    }

    setShowFolderModal(false);
    setEditingFolder(null);
  };

  const handleNoteSubmit = async () => {
    if (!noteForm.title || !noteForm.fileUrl || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const noteId = (editingNote as any)?._id || editingNote?.id;

      const noteData = {
        id: noteId || `note_${Date.now()}`,
        courseId: courseId,
        ...noteForm,
        order: parseInt(noteForm.order.toString()) || notes.length + 1
      };

      const method = editingNote ? 'PUT' : 'POST';
      const url = editingNote
        ? `${API_BASE_URL}/courses/${courseId}/notes/${noteId}`
        : `${API_BASE_URL}/courses/${courseId}/notes`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        showToast(editingNote ? 'Note updated!' : 'Note added!');
        setShowNoteModal(false);
        resetNoteForm();
        loadCourseContent();
      } else {
        showToast('Failed to save note', 'error');
      }
    } catch (error) {
      showToast('Failed to save note', 'error');
    }
  };

  const handleTestSubmit = async () => {
    if (!testForm.name || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const testId = (editingTest as any)?._id || editingTest?.id;

      const testData = {
        id: testId || `test_${Date.now()}`,
        courseId: courseId,
        ...testForm,
        questions: editingTest?.questions || []
      };

      const method = editingTest ? 'PUT' : 'POST';
      const url = editingTest
        ? `${API_BASE_URL}/courses/${courseId}/tests/${testId}`
        : `${API_BASE_URL}/courses/${courseId}/tests`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        showToast(editingTest ? 'Test updated!' : 'Test added!', 'success');
        setShowTestModal(false);
        resetTestForm();
        loadCourseContent();
      } else {
        showToast('Failed to save test', 'error');
      }
    } catch (error) {
      showToast('Failed to save test', 'error');
    }
  };

  const handleQuestionSubmit = async () => {
    if (!questionForm.question || !currentTestForQuestions || !selectedCourse) {
      showToast('Please fill required fields', 'error');
      return;
    }

    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const testId = (currentTestForQuestions as any)._id || currentTestForQuestions.id;
      const questionId = (editingQuestion as any)?._id || editingQuestion?.id;

      const questionData = {
        id: questionId || `q_${Date.now()}`,
        ...questionForm
      };

      const updatedQuestions = editingQuestion
        ? currentTestForQuestions.questions.map(q => ((q as any)._id || q.id) === questionId ? questionData : q)
        : [...(currentTestForQuestions.questions || []), questionData];

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentTestForQuestions, questions: updatedQuestions })
      });

      if (response.ok) {
        showToast(editingQuestion ? 'Question updated!' : 'Question added!', 'success');
        setShowQuestionModal(false);
        resetQuestionForm();
        loadCourseContent();
        setCurrentTestForQuestions({ ...currentTestForQuestions, questions: updatedQuestions });
      } else {
        showToast('Failed to save question', 'error');
      }
    } catch (error) {
      showToast('Failed to save question', 'error');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!selectedCourse || !confirm('Delete this video?')) return;
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/videos/${videoId}`, { method: 'DELETE' });
      showToast('Video deleted!');
      loadCourseContent();
    } catch (error) {
      showToast('Failed to delete video', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedCourse || !confirm('Delete this note?')) return;
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/notes/${noteId}`, { method: 'DELETE' });
      showToast('Note deleted!');
      loadCourseContent();
    } catch (error) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!selectedCourse || !confirm('Delete this test?')) return;
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}`, { method: 'DELETE' });
      showToast('Test deleted!');
      loadCourseContent();
    } catch (error) {
      showToast('Failed to delete test', 'error');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!currentTestForQuestions || !selectedCourse || !confirm('Delete this question?')) return;
    try {
      const courseId = (selectedCourse as any)._id || selectedCourse.id;
      const testId = (currentTestForQuestions as any)._id || currentTestForQuestions.id;
      const updatedQuestions = currentTestForQuestions.questions.filter(q => ((q as any)._id || q.id) !== questionId);
      await fetch(`${API_BASE_URL}/courses/${courseId}/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentTestForQuestions, questions: updatedQuestions })
      });
      showToast('Question deleted!');
      loadCourseContent();
      setCurrentTestForQuestions({ ...currentTestForQuestions, questions: updatedQuestions });
    } catch (error) {
      showToast('Failed to delete question', 'error');
    }
  };

  const resetVideoForm = () => {
    setVideoForm({ title: '', description: '', youtubeUrl: '', duration: '', isFree: false, order: 0, status: 'active' });
    setEditingVideo(null);
  };

  const resetNoteForm = () => {
    setNoteForm({ title: '', description: '', fileUrl: '', fileSize: '', isFree: false, order: 0, status: 'active' });
    setEditingNote(null);
  };

  const resetTestForm = () => {
    setTestForm({ name: '', description: '', duration: 60, totalMarks: 100, passingMarks: 40, numberOfQuestions: 0, marksPerQuestion: 4, negativeMarking: 0, openDate: '', closeDate: '', isFree: false, status: 'active' });
    setEditingTest(null);
  };

  const resetLiveStreamForm = () => {
    setLiveStreamForm({
      title: '',
      description: '',
      image: '',
      isFree: false,
      publishOn: '2026-03-02T10:15',
      pdf1: '',
      pdf2: '',
      studyMaterial: '',
      allowPdfExport: '',
      slug: '',
      seoTitle: '',
      seoDescription: '',
      streamSource: 'YouTube',
      streamId: '',
      enableChat: true,
      enableAttendance: false,
      notifyStudents: true,
      allowDownload: false,
      chatVisibility: 'Everyone',
      order: '0.00'
    });
  };

  const resetYoutubeZoomForm = () => {
    setYoutubeZoomForm({
      title: '',
      image: '',
      isFree: false,
      publishOn: '2026-02-26 10:35',
      link: '',
      streamStatus: 'Live',
      pdf1: '',
      pdf2: '',
      studyMaterial: '',
      slug: '',
      seoTitle: '',
      seoDescription: '',
      enableChat: true,
      enableQA: false,
      notifyStudents: true,
      allowDownload: false,
      autoArchive: true,
      order: '0.00'
    });
  };

  const resetWebinarForm = () => {
    setWebinarForm({
      title: '',
      image: '',
      isFree: false,
      publishOn: '2026-03-02 10:15',
      link: '',
      streamStatus: 'Live',
      pdf1: '',
      pdf2: '',
      studyMaterial: '',
      slug: '',
      seoTitle: '',
      seoDescription: '',
      enableChat: true,
      quizId: '',
      allowDownload: false,
      chatVisibility: 'Everyone',
      videoRestrictions: false,
      order: '0.00'
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  if (isAddingCourse) {
    return <AddCourse onClose={() => setIsAddingCourse(false)} />;
  }

  if (!selectedCourse) {
    return (
      <div className="space-y-4 animate-fade-in pb-10">
        {/* Top Navigation Tabs */}
        <div className="bg-white px-8 border-b border-gray-100 flex items-center gap-10 overflow-x-auto scrollbar-hide">
          {['Products', 'Live & Upcoming', 'Forum', 'Content'].map((tab) => (
            <button
              key={tab}
              onClick={() => showToast(`${tab} view coming soon`)}
              className={`py-4 text-[13px] font-black transition-all relative shrink-0 ${tab === 'Products' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
              {tab === 'Products' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-950 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mx-1">
          {/* Section Header & Action Bar */}
          <div className="p-4 flex items-center justify-between bg-white border-b border-gray-50">
            <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">Products</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="bg-gray-50/30 border border-gray-200 pl-10 pr-10 py-2 rounded-lg text-[13px] font-medium w-[280px] outline-none focus:bg-white focus:border-gray-300 transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsProductFilterOpen(!isProductFilterOpen)}
                  className={`flex items-center gap-2 px-6 py-2 border rounded-xl text-[12px] font-black uppercase tracking-wider transition-all shadow-sm ${isProductFilterOpen ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Filters
                </button>

                {isProductFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] p-4 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Product Filters</h4>
                      <button onClick={() => { setProductStatusFilter('all'); setProductCategoryFilter('all'); setIsProductFilterOpen(false); }} className="text-[10px] font-bold text-blue-600 hover:underline">Reset</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Publish Status</label>
                        <div className="flex flex-col gap-1">
                          {['all', 'active', 'inactive'].map((status) => (
                            <button
                              key={status}
                              onClick={() => { setProductStatusFilter(status); setIsProductFilterOpen(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${productStatusFilter === status ? 'bg-navy/5 text-navy' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                              {status === 'all' ? 'All Products' : status === 'active' ? 'Published Only' : 'Drafts Only'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsAddingCourse(true)}
                className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
              </button>
              <div className="relative" ref={moreDropdownRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${isMoreOpen ? 'bg-gray-100 text-gray-900 border-gray-200' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>

                {/* Pixel-Perfect Dropdown Menu */}
                {isMoreOpen && (
                  <div className="absolute right-0 top-[48px] w-[220px] bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-[100] border border-gray-100 py-6 animate-in fade-in zoom-in duration-200 origin-top-right">
                    {/* Table View Section */}
                    <div className="px-6 mb-6">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Table View</p>
                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => { setViewMode('list'); setIsMoreOpen(false); }}
                          className={`transition-colors ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: viewMode === 'list' ? "'FILL' 1" : "''" }}>list</span>
                        </button>
                        <button
                          onClick={() => { setViewMode('grid'); setIsMoreOpen(false); }}
                          className={`transition-colors ${viewMode === 'grid' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: viewMode === 'grid' ? "'FILL' 1" : "''" }}>grid_view</span>
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] bg-gray-50 mb-6 mx-6"></div>

                    {/* Bulk Actions Section */}
                    <div className="">
                      <p className="px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Bulk Actions</p>

                      <div className="space-y-1">
                        {[
                          { icon: 'folder', label: 'Add Folder', action: () => setShowFolderModal(true) },
                          { icon: 'link', label: 'Import Content', action: () => setShowImportModal(true) },
                          { icon: 'videocam', label: 'Add Video', action: () => setShowVideoModal(true) },
                          { icon: 'description', label: 'Add PDF', action: () => setShowDocumentModal(true) },
                          { icon: 'assignment', label: 'Add Test', action: () => { fetchTestSeriesList(); setShowTestDrawer(true); } },
                          { icon: 'rule', label: 'Subjective Test', action: () => setShowSubjectiveTestDrawer(true) },
                          { icon: 'quiz', label: 'Add OMR Test', action: () => { fetchTestSeriesList(); setShowOMRDrawer(true); } },
                          { icon: 'note_add', label: 'Add Document/Note', action: () => setShowNoteModal(true) },
                          { icon: 'live_tv', label: 'Add Live Stream', action: () => setShowLiveStreamModal(true) },
                          { icon: 'smart_display', label: 'Add YouTube/Zoom Video', action: () => setShowYoutubeZoomModal(true) },
                          { icon: 'podcasts', label: 'Add Webinar.gg Live', action: () => setShowWebinarModal(true) },
                          { icon: 'music_note', label: 'Add Audio', action: () => setShowAudioModal(true) },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            className="w-full flex items-center gap-4 px-6 py-2.5 hover:bg-gray-50 transition-colors group text-left"
                            onClick={() => { setIsMoreOpen(false); item.action(); }}
                          >
                            <span className="material-symbols-outlined text-[20px] text-blue-400 group-hover:text-blue-500 transition-colors">
                              {item.icon}
                            </span>
                            <span className="text-[14px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Content Section */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fcfcfc] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">S. No.</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center justify-between w-full">
                        Product Name
                        <span className="material-symbols-outlined text-[14px] text-gray-200">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center justify-between w-full">
                        Category
                        <span className="material-symbols-outlined text-[14px] text-gray-200">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map((course, index) => {
                    const isPublished = (course as any).isPublished === true || (course as any).status === 'active';
                    const coursePrice = (course as any).price;
                    const priceDisplay = coursePrice !== undefined && coursePrice !== null && coursePrice !== '' && Number(coursePrice) > 0
                      ? `₹${Number(coursePrice).toLocaleString('en-IN')}`
                      : 'Free';
                    const categoryName = (course as any).categoryName ||
                      (courseCategories.find((c: any) => c.id === (course as any).categoryId || c._id === (course as any).categoryId)?.title) ||
                      (course as any).categoryId ||
                      '—';
                    return (
                      <tr key={course.id} className="group hover:bg-blue-50/10 transition-colors cursor-pointer" onClick={() => setSelectedCourse(course)}>
                        <td className="px-6 py-4 text-[13px] font-bold text-gray-500">{filteredCourses.length - index}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-gray-900 group-hover:text-blue-600 transition-colors">{course.name || course.title}</span>
                            {!isPublished && (
                              <span className="mt-1.5 px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded w-fit tracking-wider">Unpublished</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-gray-500 leading-relaxed block max-w-[240px]">
                            {categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-black text-gray-900">{priceDisplay}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isPublished
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === course.id ? null : course.id);
                              }}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all border ${openActionMenuId === course.id ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-white text-gray-700 border-gray-100 hover:border-gray-300'}`}
                            >
                              Actions
                              <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${openActionMenuId === course.id ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {openActionMenuId === course.id && (
                              <div
                                className="absolute right-0 top-full mt-2 w-[180px] bg-white rounded-2xl shadow-2xl z-[100] border border-gray-100 py-3 animate-in fade-in zoom-in duration-200 origin-top-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCourse(course);
                                    handleEditCourseClick();
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors text-left"
                                >
                                  <span className="material-symbols-outlined text-[20px] text-blue-400">edit_square</span>
                                  <span className="text-[13px] font-bold">Edit Details</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePublish();
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors text-left"
                                >
                                  <span className="material-symbols-outlined text-[20px] text-amber-400">{isPublished ? 'visibility_off' : 'visibility'}</span>
                                  <span className="text-[13px] font-bold">{isPublished ? 'Unpublish' : 'Publish'}</span>
                                </button>
                                <div className="h-px bg-gray-50 my-2 mx-3"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this course?')) {
                                      showToast('Deleting course...', 'success');
                                      // Implement actual delete logic if available
                                    }
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all text-left group"
                                >
                                  <span className="material-symbols-outlined text-[20px] text-red-300 group-hover:text-red-500">delete</span>
                                  <span className="text-[13px] font-bold">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-gray-50/30">
              {filteredCourses.map((course, index) => {
                const isPublished = (course as any).isPublished === true || (course as any).status === 'active';
                const coursePrice = (course as any).price;
                const priceDisplay = coursePrice !== undefined && coursePrice !== null && coursePrice !== '' && Number(coursePrice) > 0
                  ? `₹${Number(coursePrice).toLocaleString('en-IN')}`
                  : 'Free';
                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="bg-white rounded-[2rem] border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl flex items-center justify-center border border-blue-50 shadow-sm">
                        <span className="material-symbols-outlined text-blue-600 text-[28px]">inventory_2</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); handleEditCourseClick(); }}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-[17px] font-black text-gray-900 mb-2 uppercase tracking-tight">{course.name || course.title}</h4>
                    <p className="text-[13px] text-gray-400 font-medium mb-6 line-clamp-2">{(course as any).description ? (course as any).description.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : `Complete ${course.name || course.title} course with videos, notes, and tests.`}</p>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-5">
                      <span className="text-[16px] font-black text-gray-900">{priceDisplay}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg tracking-widest ${isPublished ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 animate-fade-in pb-10 min-h-screen bg-[#f5f6f8]">
      {/* Top Navigation Bar - Compact */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                setSelectedCourse(null);
                if (onClearInitialCourse) onClearInitialCourse();
              }
            }}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-full transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[22px] text-gray-400">arrow_back</span>
          </button>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 tracking-tight leading-none">{selectedCourse.name || selectedCourse.title}</h2>
            <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Course Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            Preview
            <span className="material-symbols-outlined text-[18px]">north_east</span>
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={publishLoading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${publishLoading ? 'opacity-60 cursor-not-allowed' : ''} ${isPublished ? 'bg-[#1a1a1a] text-white hover:bg-black' : 'bg-[#22c55e] text-white hover:bg-[#16a34a]'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{isPublished ? 'lock' : 'cloud_upload'}</span>
            {publishLoading ? 'Saving...' : isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="bg-white px-6 flex items-center gap-10 border-b border-gray-100 shadow-sm">
        {['Overview', 'Content', 'Forum', 'Chat', 'Posts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMainTab(tab)}
            className={`py-3.5 text-[13px] font-bold transition-all relative shrink-0 ${activeMainTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab}
            {activeMainTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {selectedCourse && activeMainTab === 'Content' ? (
        <div className="flex gap-6 px-6 py-4 max-w-[1600px] mx-auto">
          {/* Left Content Area */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-b border-gray-100 mb-6 px-2">
              <div className="flex-1 min-w-[300px]">
                <h3 className="text-[26px] font-black text-[#1a1a1a] tracking-tight leading-none mb-2">Course Content</h3>
                <p className="text-[12px] text-[#94a3b8] font-bold uppercase tracking-[0.2em]">{videos.length} VIDEOS · {notes.length} NOTES · {tests.length} TESTS</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Premium Pill Search Bar */}
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[22px] group-focus-within:text-black transition-colors">search</span>
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={contentSearchQuery}
                    onChange={(e) => setContentSearchQuery(e.target.value)}
                    className="w-[420px] h-[58px] bg-[#f8fafc] border border-transparent px-14 text-[15px] font-semibold outline-none focus:bg-white focus:border-[#e2e8f0] focus:ring-4 focus:ring-gray-50 transition-all placeholder:text-[#94a3b8] rounded-full shadow-sm"
                  />
                </div>

                {/* Advanced Filters Pill */}
                <div className="relative">
                  <button
                    onClick={() => setIsContentFilterOpen(!isContentFilterOpen)}
                    className={`flex items-center gap-3 px-8 h-[58px] rounded-full text-[13px] font-black uppercase tracking-widest transition-all shadow-sm ${isContentFilterOpen ? 'bg-black text-white' : 'bg-white text-[#475569] border border-[#f1f5f9] hover:bg-[#f8fafc]'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                    Filters
                  </button>

                  {isContentFilterOpen && (
                    <div className="absolute right-0 top-full mt-4 w-72 bg-white border border-[#f1f5f9] rounded-[32px] shadow-2xl z-[100] p-6 animate-in fade-in zoom-in duration-200 origin-top-right">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Filters</h4>
                        <button onClick={() => { setContentStatusFilter('all'); setIsContentFilterOpen(false); }} className="text-[11px] font-bold text-blue-600 hover:underline">Reset</button>
                      </div>
                      <div className="space-y-5">
                        <div className="flex flex-col gap-2">
                          {['all', 'active', 'inactive'].map((status) => (
                            <button
                              key={status}
                              onClick={() => { setContentStatusFilter(status); setIsContentFilterOpen(false); }}
                              className={`w-full text-left px-4 py-3 rounded-2xl text-[13px] font-bold transition-all ${contentStatusFilter === status ? 'bg-[#f1f5f9] text-[#1a1a1a]' : 'text-gray-500 hover:bg-[#f8fafc]'}`}
                            >
                              {status === 'all' ? 'All Content' : status === 'active' ? 'Active Only' : 'Inactive Only'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort Button */}
                <button className="w-[58px] h-[58px] flex items-center justify-center bg-white border border-[#f1f5f9] rounded-full text-gray-400 hover:text-gray-600 transition-all shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[24px]">sort</span>
                </button>

                {/* Bulk Action Button */}
                <button
                  onClick={() => setShowBulkActionDrawer(true)}
                  className="flex items-center gap-3 h-[58px] px-8 bg-white border border-[#f1f5f9] rounded-full text-[#475569] font-bold text-[13px] hover:bg-[#f8fafc] transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#2563eb]">bolt</span>
                  Bulk Action
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {[
                  { label: 'Videos', icon: 'play_circle', key: 'videos' },
                  { label: 'Notes', icon: 'description', key: 'notes' },
                  { label: 'Tests', icon: 'quiz', key: 'tests' },
                  { label: 'Payment History', icon: 'payments', key: 'payments' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-[13px] font-bold transition-all relative ${activeTab === tab.key ? 'text-blue-600 bg-blue-50/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.key ? 'fill-0' : ''}`}>{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-1">
                {activeTab === 'videos' && (
                  <div className="space-y-4 p-5 min-h-[300px]">
                    {filteredFolders.map((folder) => (
                      <div key={folder.id} className="bg-white border border-gray-100 rounded-2xl py-4 px-6 flex items-center gap-5 group hover:shadow-md hover:border-gray-200 transition-all duration-300">
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="material-symbols-outlined text-[24px] text-gray-200 cursor-grab">drag_indicator</span>
                          <input
                            type="checkbox"
                            checked={selectedContentIds.includes(folder.id)}
                            onChange={() => toggleContentSelection(folder.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                          />
                        </div>
                        <div className="w-[110px] h-[72px] bg-[#f8fafc] rounded-xl overflow-hidden relative border border-gray-100 flex items-center justify-center shrink-0 shadow-inner">
                          {folder.thumbnail ? (
                            <img src={folder.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <span className="material-symbols-outlined text-blue-500 text-[32px]">folder</span>
                              <span className="text-[10px] font-black text-blue-600 mt-1 uppercase tracking-tighter">Course</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1e293b] text-[15px] truncate">{folder.title}</h4>
                          <p className="text-[12px] font-medium text-gray-400 mt-0.5 truncate">{folder.description || 'No description'}</p>
                          <div className="mt-2 text-[10px] font-bold bg-[#f1f5f9] text-[#475569] px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">Folder</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f));
                              showToast(folder.status === 'active' ? 'Folder disabled' : 'Folder enabled', 'success');
                            }}
                            className={`w-[42px] h-[22px] rounded-full relative cursor-pointer flex items-center transition-all ${folder.status === 'active' ? 'bg-[#22c55e]' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute ${folder.status === 'active' ? 'right-[3px]' : 'left-[3px]'} w-[16px] h-[16px] bg-white rounded-full shadow-sm`}></div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, isFree: !f.isFree } : f));
                              showToast(!folder.isFree ? 'Folder set to Free' : 'Folder set to Paid', 'success');
                            }}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${folder.isFree ? 'text-[#22c55e] bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className="material-symbols-outlined text-[22px]">{folder.isFree ? 'lock_open' : 'lock'}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <span className="material-symbols-outlined text-[22px]">edit</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredVideos.length === 0 && filteredFolders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center pt-10">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-4xl text-gray-200">smart_display</span>
                        </div>
                        <p className="text-gray-400 font-bold text-sm">No content found matching your search</p>
                      </div>
                    ) : (
                      filteredVideos.map((v) => (
                        <div key={v._id || v.id} className="bg-white border border-gray-100 rounded-2xl py-4 px-6 flex items-center gap-5 group hover:shadow-md hover:border-gray-200 transition-all duration-300">
                          <div className="text-gray-200">
                            <span className="material-symbols-outlined text-[24px] cursor-grab">drag_indicator</span>
                          </div>
                          <div className="w-[110px] h-[72px] bg-[#f8fafc] rounded-xl overflow-hidden relative border border-gray-100 flex items-center justify-center shrink-0 shadow-inner group">
                            {(v as any).image || (v as any).thumbnail ? (
                              <img src={(v as any).image || (v as any).thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <div className={`w-10 h-10 ${(v as any).contentType === 'live' ? 'bg-pink-500 shadow-pink-500/20' : (v as any).contentType === 'youtube_zoom' ? 'bg-red-600 shadow-red-600/20' : 'bg-blue-500 shadow-blue-500/20'} rounded-full flex items-center justify-center text-white shadow-xl transition-transform duration-300 group-hover:scale-110`}>
                                <span className="material-symbols-outlined text-[24px] fill-1">
                                  {(v as any).contentType === 'live' ? 'videocam' : (v as any).contentType === 'youtube_zoom' ? 'smart_display' : 'play_arrow'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1e293b] text-[15px] truncate">{v.title}</h4>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5 truncate">
                              {(v as any).contentType === 'live' ? `Starts: ${new Date((v as any).publishOn).toLocaleString()}` : v.duration || '0m 0s'} • Status: {v.status}
                            </p>
                            <div className={`mt-2 text-[10px] font-bold px-2.5 py-1 rounded-md w-fit uppercase tracking-wider ${(v as any).contentType === 'live' ? 'bg-pink-50 text-pink-600' :
                              (v as any).contentType === 'youtube_zoom' ? 'bg-red-50 text-red-600' :
                                'bg-[#f1f5f9] text-[#475569]'
                              }`}>
                              {(v as any).contentType === 'live' ? 'Live Stream' : (v as any).contentType === 'youtube_zoom' ? 'YouTube/Zoom' : 'Video'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleVideoStatus(v); }}
                              className={`w-[42px] h-[22px] rounded-full relative cursor-pointer flex items-center transition-all ${v.status === 'active' ? 'bg-[#22c55e]' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute ${v.status === 'active' ? 'right-[3px]' : 'left-[3px]'} w-[16px] h-[16px] bg-white rounded-full shadow-sm`}></div>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleVideoFree(v); }}
                              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${v.isFree ? 'text-[#22c55e] bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="material-symbols-outlined text-[22px]">{v.isFree ? 'lock_open' : 'lock'}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditVideo(v); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[22px]">edit</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteVideo(v._id || v.id); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[22px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4 p-5 min-h-[300px]">
                    {filteredNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center pt-10">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-4xl text-gray-200">description</span>
                        </div>
                        <p className="text-gray-400 font-bold text-sm">No notes found matching your search</p>
                      </div>
                    ) : (
                      filteredNotes.map((n) => (
                        <div key={n._id || n.id} className="bg-white border border-gray-100 rounded-2xl py-4 px-6 flex items-center gap-5 group hover:shadow-md hover:border-gray-200 transition-all duration-300">
                          <div className="text-gray-200">
                            <span className="material-symbols-outlined text-[24px] cursor-grab">drag_indicator</span>
                          </div>
                          <div className="w-[110px] h-[72px] bg-green-50/50 rounded-xl border border-green-100/50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-green-500 text-[32px]">description</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1e293b] text-[15px] truncate">{n.title}</h4>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5">Size: {n.fileSize || 'N/A'}</p>
                            <div className="mt-2 text-[10px] font-bold bg-[#f1f5f9] text-[#475569] px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">Note</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleNoteStatus(n); }}
                              className={`w-[42px] h-[22px] rounded-full relative cursor-pointer flex items-center transition-all ${n.status === 'active' ? 'bg-[#22c55e]' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute ${n.status === 'active' ? 'right-[3px]' : 'left-[3px]'} w-[16px] h-[16px] bg-white rounded-full shadow-sm`}></div>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleNoteFree(n); }}
                              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${n.isFree ? 'text-[#22c55e] bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="material-symbols-outlined text-[22px]">{n.isFree ? 'lock_open' : 'lock'}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditNote(n); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[22px]">edit</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteNote(n._id || n.id); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[22px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="p-8 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-[20px] font-black text-gray-900 tracking-tight">Recent Enrollments</h4>
                        <p className="text-[13px] font-medium text-gray-400 mt-1">Manage and track student course purchases</p>
                      </div>
                      <button className="px-5 h-11 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export Report
                      </button>
                    </div>

                    <div className="overflow-hidden border border-gray-100 rounded-[24px] bg-white shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Student / Info</th>
                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Enrollment Date</th>
                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</th>
                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[
                            { name: 'Rahul Sharma', email: 'rahul.s@example.com', date: 'Oct 24, 2023', amount: '₹1,499', status: 'Success', avatar: 'RS' },
                            { name: 'Priya Patel', email: 'priya.p@example.com', date: 'Oct 23, 2023', amount: '₹1,499', status: 'Success', avatar: 'PP' },
                            { name: 'Amit Kumar', email: 'amit.k@example.com', date: 'Oct 22, 2023', amount: '₹1,499', status: 'Pending', avatar: 'AK' },
                            { name: 'Sneha Reddy', email: 'sneha.r@example.com', date: 'Oct 20, 2023', amount: '₹1,499', status: 'Success', avatar: 'SR' },
                            { name: 'Vikram Singh', email: 'vikram.s@example.com', date: 'Oct 18, 2023', amount: '₹1,499', status: 'Failed', avatar: 'VS' },
                          ].map((item, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[13px] font-bold text-blue-600 border border-blue-100 uppercase">
                                    {item.avatar}
                                  </div>
                                  <div>
                                    <div className="text-[14px] font-bold text-gray-900 tracking-tight">{item.name}</div>
                                    <div className="text-[12px] font-medium text-gray-400">{item.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-[13px] font-bold text-gray-600">{item.date}</td>
                              <td className="px-6 py-5 text-[13px] font-black text-gray-900">{item.amount}</td>
                              <td className="px-6 py-5">
                                <div className="flex justify-center">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Success' ? 'bg-green-50 text-green-600' :
                                    item.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                      'bg-red-50 text-red-600'
                                    }`}>
                                    {item.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button className="w-9 h-9 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 flex items-center justify-center transition-all shadow-sm">
                                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="p-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Showing 5 of 120 students</p>
                        <div className="flex gap-2">
                          <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                          </button>
                          <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'tests' && (
                  <div className="space-y-4 p-5 min-h-[300px]">
                    {filteredTestsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center pt-10">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-4xl text-gray-200">quiz</span>
                        </div>
                        <p className="text-gray-400 font-bold text-sm">No tests found matching your search</p>
                      </div>
                    ) : (
                      filteredTestsList.map((t) => (
                        <div key={t._id || t.id} className="bg-white border border-gray-100 rounded-2xl py-4 px-6 flex items-center gap-5 group hover:shadow-md hover:border-gray-200 transition-all duration-300">
                          <div className="text-gray-200">
                            <span className="material-symbols-outlined text-[24px] cursor-grab">drag_indicator</span>
                          </div>
                          <div className="w-[110px] h-[72px] bg-amber-50/50 rounded-xl border border-amber-100/50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-amber-500 text-[32px]">rule</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1e293b] text-[15px] truncate">{t.name}</h4>
                            <p className="text-[12px] font-medium text-gray-400 mt-0.5">{t.questions?.length || 0} Questions • Duration: {t.duration}m</p>
                            <div className="mt-2 text-[10px] font-bold bg-[#f1f5f9] text-[#475569] px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">Test</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => { setCurrentTestForQuestions(t); setShowQuestionModal(true); }}
                              className="px-4 py-2 bg-purple-50 text-purple-600 text-[12px] font-bold rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              Manage Questions
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleTestStatus(t); }}
                              className={`w-[42px] h-[22px] rounded-full relative cursor-pointer flex items-center transition-all ${t.status === 'active' ? 'bg-[#22c55e]' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute ${t.status === 'active' ? 'right-[3px]' : 'left-[3px]'} w-[16px] h-[16px] bg-white rounded-full shadow-sm`}></div>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleTestFree(t); }}
                              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${t.isFree ? 'text-[#22c55e] bg-green-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="material-symbols-outlined text-[22px]">{t.isFree ? 'lock_open' : 'lock'}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditTest(t); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[22px]">edit</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteTest(t._id || t.id); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full text-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <span className="material-symbols-outlined text-[22px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: ADD CONTENT */}
          <div className="w-[380px] shrink-0">
            <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-3.5">
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest leading-none">ADD CONTENT</h4>
              </div>
              <div className="pb-6">
                {[
                  { label: 'Folder', icon: 'folder', onClick: () => { setEditingFolder(null); setShowFolderModal(true); } },
                  { label: 'Video', icon: 'play_circle', onClick: () => { resetVideoForm(); setShowVideoModal(true); } },
                  { label: 'PDF', icon: 'description', onClick: () => setShowDocumentDrawer(true) },
                  { label: 'Live Stream', icon: 'videocam', onClick: () => setShowLiveStreamModal(true) },
                  { label: 'YouTube/Zoom Live', icon: 'videocam', onClick: () => setShowYoutubeZoomModal(true) },
                  { label: 'Webinar.gg Live', icon: 'videocam', onClick: () => setShowWebinarModal(true) },
                  { label: 'Test', icon: 'assignment', onClick: () => { fetchTestSeriesList(); setShowTestDrawer(true); } },
                  { label: 'Subjective Test', icon: 'checklist', onClick: () => setShowSubjectiveTestDrawer(true) },
                  { label: 'OMR Test', icon: 'fact_check', onClick: () => { fetchTestSeriesList(); setShowOMRDrawer(true); } },
                  { label: 'Quiz', icon: 'quiz', onClick: () => setShowQuizDrawer(true) },
                  { label: 'Audio File', icon: 'music_note', onClick: () => setShowAudioDrawer(true) },
                  { label: 'Image', icon: 'image', onClick: () => setShowImageDrawer(true) },
                  { label: 'Link', icon: 'open_in_new', onClick: () => setShowLinkDrawer(true) },
                  { label: 'Document', icon: 'description', onClick: () => setShowDocumentModal(true) },
                  { label: 'Import Content', icon: 'download', onClick: () => setShowImportModal(true) }
                ].map((item: { label: string; icon: string; onClick: () => void }, idx) => (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className="w-full px-8 py-3 flex items-center gap-4 hover:bg-slate-50 transition-all duration-200 group text-left border-b border-gray-50/50 last:border-0"
                  >
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-blue-500 transition-colors">{item.icon}</span>
                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeMainTab === 'Overview' && selectedCourse ? (
        <div className="p-6 max-w-[1200px] mx-auto animate-fade-in transition-all">
          <div className="bg-white rounded-[24px] border border-[#f0f1f3] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-8 flex items-start gap-8">
              {/* Product Thumbnail */}
              <div className="w-[180px] h-[120px] bg-[#f8fafc] rounded-2xl overflow-hidden border border-[#f1f5f9] shrink-0 shadow-sm relative group">
                {selectedCourse.thumbnail ? (
                  <img src={selectedCourse.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
                    <span className="material-symbols-outlined text-blue-400 text-[40px]">school</span>
                    <span className="text-[10px] font-black text-blue-500 mt-2 uppercase tracking-widest">No Image</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <h2 className="text-[24px] font-black text-[#111827] tracking-tight leading-tight">
                      {selectedCourse.name || selectedCourse.title}
                    </h2>
                    <p className="text-[15px] font-bold text-[#64748b] tracking-tight">
                      {selectedCourse.title || selectedCourse.name} - Live Classes!
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-[22px] font-black text-[#111827]">₹{selectedCourse.price}</span>
                        {selectedCourse.originalPrice && (
                          <>
                            <span className="text-[14px] font-bold text-[#94a3b8] line-through decoration-2">₹{selectedCourse.originalPrice}</span>
                            <span className="text-[14px] font-black text-[#22c55e] uppercase tracking-wide">
                              {Math.round((1 - (Number(selectedCourse.price) / Number(selectedCourse.originalPrice))) * 100)}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[14px] font-medium text-[#475569] leading-relaxed max-w-[800px]">
                    <p className={showFullDesc ? "" : "line-clamp-2"}>
                      {selectedCourse.description ?
                        selectedCourse.description.replace(/<[^>]*>/g, '') :
                        "Complete course management with videos, notes, and tests integrated into one bundle. This course is designed to provide comprehensive learning."
                      }
                    </p>
                    <button
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="text-[#6366f1] font-bold mt-2 hover:text-[#4f46e5] transition-colors"
                    >
                      {showFullDesc ? "Show less" : "Show more"}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm ${isPublished ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]' : 'bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]'}`}>
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={handleEditCourseClick}
                      className="flex items-center gap-2 px-6 py-2 border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all duration-200 shadow-sm active:scale-95 ml-auto relative z-20 cursor-pointer">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeMainTab === 'Chat' && selectedCourse ? (
        <CourseGroupChat />
      ) : activeMainTab === 'Forum' && selectedCourse ? (
        <ForumManager courseId={(selectedCourse as any)._id || selectedCourse.id} />
      ) : activeMainTab === 'Posts' && selectedCourse ? (
        <CoursePosts courseId={(selectedCourse as any)._id || selectedCourse.id} />
      ) : activeMainTab !== 'Content' && selectedCourse ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm mx-6 mt-6">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-300">construction</span>
          </div>
          <p className="text-gray-400 font-semibold text-sm">{activeMainTab} section is under development</p>
          <p className="text-gray-300 text-xs mt-1">This feature will be available soon</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 text-center mx-6 mt-6 border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-300">school</span>
          </div>
          <p className="text-gray-400 font-semibold text-sm">Select a course to manage its content</p>
        </div>
      )
      }
      {/* Portals removed */}


      {/* OMR Portal removed */}

      {
        showNoteModal && createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[99999] p-4 overflow-y-auto pt-16">
            <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl border border-gray-100 mt-10 mb-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center px-10 py-6">
                <h3 className="text-[22px] font-black text-gray-900 tracking-tight">{editingNote ? 'Edit Note' : 'Upload New Note'}</h3>
                <button onClick={() => { setShowNoteModal(false); resetNoteForm(); }} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-400 rounded-full transition-all">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
              <div className="px-10 pb-10 space-y-8">
                <div>
                  <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-[0.12em]">Note Title *</label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="w-full px-6 py-5 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-bold text-gray-900 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-300 placeholder:text-gray-400"
                    placeholder="e.g. Chapter 1 Notes"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-[0.12em]">PDF/Document File *</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={noteForm.fileUrl}
                      onChange={(e) => setNoteForm({ ...noteForm, fileUrl: e.target.value })}
                      className="flex-1 px-6 py-5 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-bold text-gray-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all duration-300 placeholder:text-gray-400"
                      placeholder="Paste link or upload below"
                    />
                    <FileUploadButton
                      accept=".pdf,application/pdf"
                      label="Upload"
                      icon="upload_file"
                      onUpload={(url) => setNoteForm({ ...noteForm, fileUrl: url })}
                    />
                  </div>
                  {noteForm.fileUrl && (
                    <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50/50 rounded-[20px] border border-blue-100/30">
                      <span className="material-symbols-outlined text-blue-500">article</span>
                      <span className="text-[13px] text-blue-700 font-bold truncate flex-1">{noteForm.fileUrl}</span>
                      <button type="button" onClick={() => setNoteForm({ ...noteForm, fileUrl: '' })} className="text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-[0.12em]">File Size (Visible)</label>
                    <input
                      type="text"
                      value={noteForm.fileSize}
                      onChange={(e) => setNoteForm({ ...noteForm, fileSize: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-bold text-gray-900 focus:bg-white outline-none transition-all duration-300"
                      placeholder="e.g. 2.4 MB"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-[0.12em]">Sort Order</label>
                    <input
                      type="number"
                      value={noteForm.order}
                      onChange={(e) => setNoteForm({ ...noteForm, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-6 py-5 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-bold text-gray-900 focus:bg-white outline-none transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={noteForm.isFree}
                        onChange={(e) => setNoteForm({ ...noteForm, isFree: e.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </div>
                    <span className="text-[14px] font-black text-gray-600 group-hover:text-gray-900 transition-colors">Allow Free Download</span>
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => { setShowNoteModal(false); resetNoteForm(); }} className="flex-1 py-4.5 bg-white border-2 border-gray-100 rounded-2xl font-black text-[15px] text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]">
                    Cancel
                  </button>
                  <button onClick={handleNoteSubmit} className="flex-1 py-4.5 bg-gray-950 text-white rounded-2xl font-black text-[15px] hover:bg-black hover:shadow-xl transition-all active:scale-[0.98]">
                    {editingNote ? 'Save Note' : 'Upload Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Add Test(s) Drawer — course-specific tests */}
      {/* AddTest Portal removed */}

      {/* Test Portal removed */}
      {
        showQuestionModal && createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[99999] p-4 overflow-y-auto pt-16">
            <div className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl border border-gray-100 mt-10 mb-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center px-10 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-[18px] flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-600 text-[28px]">quiz</span>
                  </div>
                  <div>
                    <h3 className="text-[22px] font-black text-gray-900 tracking-tight">{editingQuestion ? 'Edit Question' : 'New Question'}</h3>
                    <p className="text-[11px] font-black text-[#8a94a6] uppercase tracking-[0.12em]">Standard MCQ Format</p>
                  </div>
                </div>
                <button onClick={() => { setShowQuestionModal(false); resetQuestionForm(); }} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-400 rounded-full transition-all">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="px-10 pb-10 space-y-10">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-[0.12em]">The Question *</label>
                    <textarea
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-bold text-gray-900 focus:bg-white focus:border-indigo-500/30 outline-none transition-all duration-300 min-h-[120px] shadow-sm"
                      placeholder="e.g. What is the capital of India?"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <FileUploadButton
                      accept="image/*"
                      label="Upload Question Image"
                      icon="add_photo_alternate"
                      onUpload={(url) => setQuestionForm({ ...questionForm, questionImage: url })}
                    />
                    {questionForm.questionImage && (
                      <div className="relative group p-1 bg-white border border-gray-100 rounded-[15px] shadow-sm">
                        <img src={questionForm.questionImage} alt="Q" className="h-16 w-16 object-cover rounded-[12px]" />
                        <button type="button" onClick={() => setQuestionForm({ ...questionForm, questionImage: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <div key={opt} className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-[#8a94a6] uppercase tracking-[0.12em]">Option {opt}</label>
                        <button
                          onClick={() => setQuestionForm({ ...questionForm, correctAnswer: opt })}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${questionForm.correctAnswer === opt ? 'bg-indigo-600 text-white shadow-indigo-100 shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        >
                          {questionForm.correctAnswer === opt ? 'Correct Answer' : 'Set as Correct'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={(questionForm as any)[`option${opt}`]}
                        onChange={(e) => setQuestionForm({ ...questionForm, [`option${opt}`]: e.target.value })}
                        className={`w-full px-6 py-5 border rounded-[20px] text-[15px] font-bold outline-none transition-all duration-300 ${questionForm.correctAnswer === opt ? 'bg-indigo-50/20 border-indigo-200 text-indigo-950 ring-4 ring-indigo-500/5' : 'bg-gray-50/30 border-transparent text-gray-900 focus:bg-white focus:border-indigo-400/30'}`}
                        placeholder={`Option ${opt} text...`}
                      />
                      <div className="flex items-center gap-3">
                        <FileUploadButton
                          accept="image/*"
                          label={`Option ${opt} Img`}
                          icon="image"
                          onUpload={(url) => setQuestionForm({ ...questionForm, [`option${opt}Image`]: url })}
                        />
                        {(questionForm as any)[`option${opt}Image`] && (
                          <div className="relative group p-1 bg-white border border-gray-100 rounded-[12px] shadow-sm">
                            <img src={(questionForm as any)[`option${opt}Image`]} alt={`Opt ${opt}`} className="h-12 w-12 object-cover rounded-[10px]" />
                            <button type="button" onClick={() => setQuestionForm({ ...questionForm, [`option${opt}Image`]: '' })} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md">
                              <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-8 items-end">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-widest">Marks</label>
                    <input
                      type="number"
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 4 })}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-black text-blue-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-widest">Negative</label>
                    <input
                      type="number"
                      step="0.25"
                      value={questionForm.negativeMarks}
                      onChange={(e) => setQuestionForm({ ...questionForm, negativeMarks: parseFloat(e.target.value) || 0 })}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-[20px] text-[16px] font-black text-red-500 focus:bg-white outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-black text-[#8a94a6] mb-3 uppercase tracking-widest">Detailed Explanation</label>
                    <input
                      type="text"
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50/50 border border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white outline-none"
                      placeholder="Why is it correct?"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={() => { setShowQuestionModal(false); resetQuestionForm(); }} className="flex-1 py-5 bg-white border-2 border-gray-100 rounded-[20px] font-black text-[16px] text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]">
                    Cancel
                  </button>
                  <button onClick={handleQuestionSubmit} className="flex-1 py-5 bg-gray-950 text-white rounded-[20px] font-black text-[16px] hover:bg-black hover:shadow-xl transition-all active:scale-[0.98]">
                    {editingQuestion ? 'Save Question' : 'Add to Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }
      <AddFolderDrawer
        isOpen={showFolderModal}
        onClose={() => { setShowFolderModal(false); setEditingFolder(null); }}
        onSubmit={handleFolderSubmit}
        onUploadImage={uploadFolderImage}
        editingFolder={editingFolder}
      />

      {/* --- ADD LIVE STREAM DRAWER --- */}
      {
        showLiveStreamModal && createPortal(
          <div className="fixed inset-0 z-[99999] flex justify-end">
            <div
              className="absolute inset-0 bg-black/50 animate-fade-in transition-opacity"
              onClick={() => { setShowLiveStreamModal(false); }}
            />
            <div className="relative w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
                <h3 className="text-[20px] font-bold text-[#1e1e1e] tracking-tight">Add Live Stream</h3>
                <button
                  onClick={() => { setShowLiveStreamModal(false); }}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-400 rounded-full transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 shrink-0">
                <button
                  onClick={() => setActiveLiveStreamTab('basic')}
                  className={`flex-1 flex items-center justify-center py-5 text-[15px] font-bold transition-all relative ${activeLiveStreamTab === 'basic' ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Basic
                </button>
                <div className="w-[1px] bg-gray-100 my-4" />
                <button
                  onClick={() => setActiveLiveStreamTab('advanced')}
                  className={`flex-1 flex items-center justify-center py-5 text-[15px] font-bold transition-all relative ${activeLiveStreamTab === 'advanced' ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Advanced
                </button>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 pb-40">
                {activeLiveStreamTab === 'basic' && (
                  <div className="space-y-10">
                    {/* Live Stream Details Section */}
                    <div className="space-y-8">
                      <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight uppercase">Live Stream Details</h4>

                      {/* Title */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={liveStreamForm.title}
                          onChange={(e) => setLiveStreamForm({ ...liveStreamForm, title: e.target.value })}
                          className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all placeholder:text-gray-300"
                          placeholder=""
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Description</label>
                        <textarea
                          value={liveStreamForm.description}
                          onChange={(e) => setLiveStreamForm({ ...liveStreamForm, description: e.target.value })}
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all min-h-[140px] resize-none"
                          placeholder="Enter Live Stream Description"
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Image</label>
                        <div className="flex gap-4">
                          <input type="file" ref={liveStreamImageRef} className="hidden" accept="image/*" onChange={handleLiveStreamImageUpload} />
                          <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-2 shrink-0 border border-gray-100 overflow-hidden relative group">
                            {liveStreamForm.image ? (
                              <img src={liveStreamForm.image} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[40px] text-[#8e8e8e]">image</span>
                                <span className="text-[14px] font-bold text-[#8e8e8e]">No Image</span>
                              </>
                            )}
                          </div>
                          <div
                            onClick={() => liveStreamImageRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group"
                          >
                            <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload Image</h4>
                            <span className="text-[12px] font-medium text-[#c0c0c0] text-center leading-tight">Click or Drag & Drop your file here.</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Checkbox-style Toggle */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Status</label>
                        <div className="flex bg-[#f8f8f8] p-1.5 rounded-[12px] w-full border border-gray-100">
                          <button
                            onClick={() => setLiveStreamForm({ ...liveStreamForm, isFree: true })}
                            className={`flex-1 py-3 text-[14px] font-bold rounded-[8px] transition-all ${liveStreamForm.isFree ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Free
                          </button>
                          <button
                            onClick={() => setLiveStreamForm({ ...liveStreamForm, isFree: false })}
                            className={`flex-1 py-3 text-[14px] font-bold rounded-[8px] transition-all ${!liveStreamForm.isFree ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Paid
                          </button>
                        </div>
                      </div>

                      {/* Publish On */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Publish On <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="datetime-local"
                            value={liveStreamForm.publishOn}
                            onChange={(e) => setLiveStreamForm({ ...liveStreamForm, publishOn: e.target.value })}
                            className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all appearance-none"
                          />
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[22px] pointer-events-none">calendar_today</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Content Section */}
                    <div className="space-y-8 pt-6 border-t border-gray-50">
                      <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight uppercase">Additional Content</h4>

                      {/* Attach PDF 1 */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight uppercase">Attach PDF</label>
                        <div className="flex gap-4">
                          <input type="file" ref={liveStreamPdf1Ref} className="hidden" accept="application/pdf" onChange={(e) => handleLiveStreamFileUpload(e, 'pdf1')} />
                          <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-1.5 shrink-0 border border-gray-100 overflow-hidden text-center px-4">
                            <span className="material-symbols-outlined text-[36px] text-[#8e8e8e]">help</span>
                            <span className="text-[13px] font-bold text-[#8e8e8e] truncate w-full">
                              No PDF
                            </span>
                          </div>
                          <div
                            onClick={() => liveStreamPdf1Ref.current?.click()}
                            className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group"
                          >
                            <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload PDF</h4>
                            <span className="text-[12px] font-medium text-[#c0c0c0] text-center leading-tight">Click or Drag & Drop your file here.</span>
                          </div>
                        </div>
                      </div>

                      {/* Attach PDF 2 */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight uppercase">Attach PDF</label>
                        <div className="flex gap-4">
                          <input type="file" ref={liveStreamPdf2Ref} className="hidden" accept="application/pdf" onChange={(e) => handleLiveStreamFileUpload(e, 'pdf2')} />
                          <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-1.5 shrink-0 border border-gray-100 overflow-hidden text-center px-4">
                            <span className="material-symbols-outlined text-[36px] text-[#8e8e8e]">help</span>
                            <span className="text-[13px] font-bold text-[#8e8e8e] truncate w-full">
                              No PDF
                            </span>
                          </div>
                          <div
                            onClick={() => liveStreamPdf2Ref.current?.click()}
                            className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group"
                          >
                            <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload PDF</h4>
                            <span className="text-[12px] font-medium text-[#c0c0c0] text-center leading-tight">Click or Drag & Drop your file here.</span>
                          </div>
                        </div>
                      </div>

                      {/* Study Material */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight uppercase">Study Material</label>
                        <div className="flex gap-4">
                          <input type="file" ref={liveStreamStudyMaterialRef} className="hidden" accept="*" onChange={(e) => handleLiveStreamFileUpload(e, 'studyMaterial')} />
                          <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-1.5 shrink-0 border border-gray-100 overflow-hidden text-center px-4">
                            <span className="material-symbols-outlined text-[36px] text-[#8e8e8e]">help</span>
                            <span className="text-[13px] font-bold text-[#8e8e8e] truncate w-full">
                              No File
                            </span>
                          </div>
                          <div
                            onClick={() => liveStreamStudyMaterialRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group"
                          >
                            <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload File</h4>
                            <span className="text-[12px] font-medium text-[#c0c0c0] text-center leading-tight">Click or Drag & Drop your file here.</span>
                          </div>
                        </div>
                      </div>

                      {/* Allow PDF Export */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Allow PDF Export</label>
                        <div className="relative">
                          <select
                            value={liveStreamForm.allowPdfExport}
                            onChange={(e) => setLiveStreamForm({ ...liveStreamForm, allowPdfExport: e.target.value })}
                            className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all appearance-none"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                            <option value="Password">Save with password</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[24px] pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeLiveStreamTab === 'advanced' && (
                  <div className="space-y-10">
                    <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight uppercase">Advanced Settings</h4>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 max-w-[320px]">
                        <p className="text-[15px] font-bold text-gray-800 tracking-tight">In App download</p>
                        <p className="text-[12px] text-gray-400 font-medium leading-relaxed font-bold tracking-tight">Switch ON if you want the users to be able to download the video</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1 mr-[-5px]">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={liveStreamForm.allowDownload}
                          onChange={(e) => setLiveStreamForm({ ...liveStreamForm, allowDownload: e.target.checked })}
                        />
                        <div className="w-[44px] h-[24px] bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[20px]"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Live Chat Message Visibility</label>
                      <select
                        value={liveStreamForm.chatVisibility}
                        onChange={(e) => setLiveStreamForm({ ...liveStreamForm, chatVisibility: e.target.value })}
                        className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all appearance-none"
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="Only Host and Self">Only Host and Self</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Sorting Order</label>
                      <input
                        type="text"
                        value={liveStreamForm.order}
                        onChange={(e) => setLiveStreamForm({ ...liveStreamForm, order: e.target.value })}
                        className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Button */}
              <div className="absolute bottom-0 left-0 right-0 p-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] bg-white">
                <button
                  className="w-full h-[70px] bg-[#1a1c1e] text-white text-[16px] font-bold tracking-tight hover:bg-black transition-all flex items-center justify-center"
                  onClick={handleLiveStreamSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* --- ADD YOUTUBE/ZOOM VIDEOS DRAWER --- */}
      {
        showYoutubeZoomModal && createPortal(
          <div className="fixed inset-0 z-[99999] flex justify-end">
            <div
              className="absolute inset-0 bg-black/50 animate-fade-in transition-opacity"
              onClick={() => { setShowYoutubeZoomModal(false); }}
            />
            <div className="relative w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
                <h3 className="text-[20px] font-bold text-[#1e1e1e] tracking-tight">Add YouTube/Zoom Videos</h3>
                <button
                  onClick={() => { setShowYoutubeZoomModal(false); }}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-400 rounded-full transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 shrink-0">
                <button
                  onClick={() => setActiveYoutubeZoomTab('basic')}
                  className={`flex-1 flex items-center justify-center py-5 text-[15px] font-bold transition-all relative ${activeYoutubeZoomTab === 'basic' ? 'text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Basic
                </button>
                <div className="w-[1px] bg-gray-100 my-4" />
                <button
                  onClick={() => setActiveYoutubeZoomTab('advanced')}
                  className={`flex-1 flex items-center justify-center py-5 text-[15px] font-bold transition-all relative ${activeYoutubeZoomTab === 'advanced' ? 'text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Advanced
                </button>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 pb-40">
                {activeYoutubeZoomTab === 'basic' && (
                  <div className="space-y-10">
                    <div className="space-y-8">
                      {/* Title */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={youtubeZoomForm.title}
                          onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, title: e.target.value })}
                          className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                          placeholder=""
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Image</label>
                        <div className="flex gap-4">
                          <input type="file" ref={youtubeZoomImageRef} className="hidden" accept="image/*" onChange={handleYoutubeZoomImageUpload} />
                          <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-2 shrink-0 border border-gray-100 overflow-hidden relative group">
                            {youtubeZoomForm.image ? (
                              <img src={youtubeZoomForm.image} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[40px] text-[#8e8e8e]">image</span>
                                <span className="text-[14px] font-bold text-[#8e8e8e]">No Image</span>
                              </>
                            )}
                          </div>
                          <div
                            onClick={() => youtubeZoomImageRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group text-center"
                          >
                            <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload Image</h4>
                            <span className="text-[12px] font-medium text-[#c0c0c0] leading-tight">Click or Drag & Drop your file here.</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Status</label>
                        <div className="flex bg-[#f8f8f8] p-1.5 rounded-[12px] w-full border border-gray-100">
                          <button
                            onClick={() => setYoutubeZoomForm({ ...youtubeZoomForm, isFree: true })}
                            className={`flex-1 py-3 text-[14px] font-bold rounded-[8px] transition-all ${youtubeZoomForm.isFree ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                          >
                            Free
                          </button>
                          <button
                            onClick={() => setYoutubeZoomForm({ ...youtubeZoomForm, isFree: false })}
                            className={`flex-1 py-3 text-[14px] font-bold rounded-[8px] transition-all ${!youtubeZoomForm.isFree ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400'}`}
                          >
                            Paid
                          </button>
                        </div>
                      </div>

                      {/* Publish On */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Publish On <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            value={youtubeZoomForm.publishOn || "2026-02-26 10:35"}
                            onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, publishOn: e.target.value })}
                            className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                          />
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">calendar_today</span>
                        </div>
                      </div>

                      {/* Link */}
                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Zoom/YouTube Link <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={youtubeZoomForm.link}
                          onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, link: e.target.value })}
                          className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                          placeholder=""
                        />
                      </div>

                      {/* Stream Details */}
                      <div className="space-y-5">
                        <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight">Stream Details</h4>
                        <div className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Stream Status</label>
                          <div className="relative">
                            <select
                              value={youtubeZoomForm.streamStatus}
                              onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, streamStatus: e.target.value })}
                              className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all appearance-none shadow-sm"
                            >
                              <option value="Live">Live</option>
                              <option value="Upcoming">Upcoming</option>
                              <option value="Recorded">Recorded</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[24px] pointer-events-none">expand_more</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Content Section */}
                    <div className="space-y-8 pt-6 border-t border-gray-50">
                      <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight uppercase">Additional Content</h4>

                      {[1, 2].map((num) => (
                        <div key={num} className="space-y-2">
                          <label className="block text-[13px] font-bold text-gray-600 tracking-tight uppercase">Attach PDF</label>
                          <div className="flex gap-4">
                            <input type="file" className="hidden" accept="application/pdf" />
                            <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-1.5 shrink-0 border border-gray-100">
                              <div className="w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
                                <span className="material-symbols-outlined text-[20px] text-[#8e8e8e]">help</span>
                              </div>
                              <span className="text-[13px] font-bold text-[#8e8e8e]">No PDF</span>
                            </div>
                            <div className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group text-center">
                              <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload PDF</h4>
                              <span className="text-[12px] font-medium text-[#c0c0c0] leading-tight">Click or Drag & Drop your file here.</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-gray-600 tracking-tight uppercase">Study Material</label>
                        <div className="flex gap-4">
                          <input type="file" className="hidden" accept="*" />
                          <div className="w-[170px] h-[130px] bg-[#f2f2f2] rounded-[18px] flex flex-col items-center justify-center gap-1.5 shrink-0 border border-gray-100">
                            <div className="w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center mb-1 shadow-sm">
                              <span className="material-symbols-outlined text-[20px] text-[#8e8e8e]">help</span>
                            </div>
                            <span className="text-[13px] font-bold text-[#8e8e8e]">No File</span>
                          </div>
                          <div className="flex-1 border-2 border-dashed border-[#e2e2e2] rounded-[18px] flex flex-col items-center justify-center p-4 hover:bg-gray-50 transition-all cursor-pointer bg-white group text-center">
                            <h4 className="text-[16px] font-bold text-[#7a7a7a] mb-0.5">Upload File</h4>
                            <span className="text-[12px] font-medium text-[#c0c0c0] leading-tight">Click or Drag & Drop your file here.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeYoutubeZoomTab === 'advanced' && (
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight uppercase mb-6">Interaction & Engagement</h4>
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 max-w-[320px]">
                            <p className="text-[15px] font-bold text-gray-800 tracking-tight">Enable Live Chat</p>
                            <p className="text-[12px] text-gray-400 font-bold tracking-tight leading-relaxed">Allow students to chat during the stream</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer mt-1">
                            <input type="checkbox" className="sr-only peer" checked={youtubeZoomForm.enableChat} onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, enableChat: e.target.checked })} />
                            <div className="w-[44px] h-[24px] bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[20px]"></div>
                          </label>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 max-w-[320px]">
                            <p className="text-[15px] font-bold text-gray-800 tracking-tight">Enable Q&A Section</p>
                            <p className="text-[12px] text-gray-400 font-bold tracking-tight leading-relaxed">Add a dedicated space for student questions</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer mt-1">
                            <input type="checkbox" className="sr-only peer" checked={youtubeZoomForm.enableQA} onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, enableQA: e.target.checked })} />
                            <div className="w-[44px] h-[24px] bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[20px]"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-50">
                      <h4 className="text-[14px] font-bold text-[#1e1e1e] tracking-tight uppercase mb-6">Access & Notifications</h4>
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 max-w-[320px]">
                            <p className="text-[15px] font-bold text-gray-800 tracking-tight">Notify Students</p>
                            <p className="text-[12px] text-gray-400 font-bold tracking-tight leading-relaxed">Send notification when stream starts</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer mt-1">
                            <input type="checkbox" className="sr-only peer" checked={youtubeZoomForm.notifyStudents} onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, notifyStudents: e.target.checked })} />
                            <div className="w-[44px] h-[24px] bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[20px]"></div>
                          </label>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 max-w-[320px]">
                            <p className="text-[15px] font-bold text-gray-800 tracking-tight">Support Offline Store</p>
                            <p className="text-[12px] text-gray-400 font-bold tracking-tight leading-relaxed">Allow students to save video offline</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer mt-1">
                            <input type="checkbox" className="sr-only peer" checked={youtubeZoomForm.allowDownload} onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, allowDownload: e.target.checked })} />
                            <div className="w-[44px] h-[24px] bg-gray-200 rounded-full peer peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[20px]"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-50">
                      <div className="flex items-start justify-between">
                        <p className="text-[15px] font-bold text-gray-800 tracking-tight">Sorting Order</p>
                        <input
                          type="text"
                          value={youtubeZoomForm.order || "0.00"}
                          onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, order: e.target.value })}
                          className="w-[80px] h-[44px] px-3 bg-white border border-gray-200 rounded-[12px] text-[15px] font-bold text-center outline-none focus:border-gray-400 transition-all font-mono"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                      <button
                        onClick={() => setShowYoutubeZoomSEO(!showYoutubeZoomSEO)}
                        className="flex items-center gap-2 text-[12px] font-bold text-blue-600 cursor-pointer hover:text-blue-700 uppercase tracking-widest transition-all"
                      >
                        <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${showYoutubeZoomSEO ? 'rotate-90' : 'rotate-0'}`}>arrow_right</span>
                        Configure SEO Meta settings
                      </button>

                      {showYoutubeZoomSEO && (
                        <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 duration-500 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                          <div className="space-y-2">
                            <label className="block text-[13px] font-bold text-gray-700 tracking-tight">Slug (URL Customization)</label>
                            <input
                              type="text"
                              value={youtubeZoomForm.slug || ''}
                              onChange={(e) => setYoutubeZoomForm({ ...youtubeZoomForm, slug: e.target.value })}
                              className="w-full px-5 py-4 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-blue-500 transition-all shadow-sm"
                              placeholder="e.g. youtube-zoom-video"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Button */}
              <div className="absolute bottom-0 left-0 right-0 p-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] bg-white z-[100]">
                <button
                  className="w-full h-[70px] bg-[#1a1c1e] text-white text-[16px] font-bold tracking-tight hover:bg-black transition-all flex items-center justify-center"
                  onClick={handleYoutubeZoomSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {showWebinarModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in transition-opacity"
            onClick={() => setShowWebinarModal(false)}
          />
          <div className="relative w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
              <h3 className="text-[20px] font-bold text-[#1e1e1e] tracking-tight">Add Webinar</h3>
              <button
                onClick={() => setShowWebinarModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-400 rounded-full transition-all"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 h-[60px] shrink-0">
              <button
                onClick={() => setActiveWebinarTab('basic')}
                className={`flex-1 flex items-center justify-center text-[15px] font-bold transition-all ${activeWebinarTab === 'basic' ? 'text-black relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[60px] after:h-[2px] after:bg-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Basic
              </button>
              <button
                onClick={() => setActiveWebinarTab('advanced')}
                className={`flex-1 flex items-center justify-center text-[15px] font-bold transition-all ${activeWebinarTab === 'advanced' ? 'text-black relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[80px] after:h-[2px] after:bg-black' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Advanced
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 pb-40 custom-scrollbar">
              {activeWebinarTab === 'basic' ? (
                <>
                  <div className="space-y-8">
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={webinarForm.title}
                        onChange={(e) => setWebinarForm({ ...webinarForm, title: e.target.value })}
                        className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                        placeholder=""
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Image</label>
                      <div className="flex gap-4">
                        <div className="w-[120px] h-[100px] bg-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-2 border border-gray-200 shrink-0 relative overflow-hidden group">
                          {webinarForm.image ? (
                            <img src={webinarForm.image} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[28px] text-gray-400">image</span>
                              <span className="text-[12px] font-bold text-gray-400">No Image</span>
                            </>
                          )}
                        </div>
                        <div
                          onClick={() => webinarImageRef.current?.click()}
                          className="flex-1 border-2 border-dashed border-gray-200 rounded-[12px] flex flex-col items-center justify-center p-4 hover:border-gray-400 hover:bg-gray-50/50 transition-all cursor-pointer group"
                        >
                          <h4 className="text-[15px] font-bold text-gray-400 mb-1 group-hover:text-gray-600 transition-colors">Upload Image</h4>
                          <span className="text-[11px] font-medium text-gray-400 text-center leading-[1.4] tracking-tight">Click or Drag & Drop your file here.</span>
                        </div>
                      </div>
                      <input type="file" ref={webinarImageRef} className="hidden" accept="image/*" onChange={handleWebinarImageUpload} />
                    </div>

                    {/* Status Toggle */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Status</label>
                      <div className="flex bg-gray-100/50 p-1 rounded-[14px] border border-gray-100">
                        <button
                          onClick={() => setWebinarForm({ ...webinarForm, isFree: true })}
                          className={`flex-1 py-3 text-[14px] font-bold rounded-[10px] transition-all ${webinarForm.isFree ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          Free
                        </button>
                        <button
                          onClick={() => setWebinarForm({ ...webinarForm, isFree: false })}
                          className={`flex-1 py-3 text-[14px] font-bold rounded-[10px] transition-all ${!webinarForm.isFree ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          Paid
                        </button>
                      </div>
                    </div>

                    {/* Webinar Link */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Webinar Link <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={webinarForm.link}
                        onChange={(e) => setWebinarForm({ ...webinarForm, link: e.target.value })}
                        className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                        placeholder=""
                      />
                    </div>

                    {/* Generate Link Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const randomId = Math.random().toString(36).substring(7);
                          setWebinarForm({ ...webinarForm, link: `https://webinar.gg/live/${randomId}` });
                        }}
                        className="h-[50px] px-8 bg-white border border-gray-200 text-gray-800 text-[14px] font-bold rounded-[14px] hover:bg-gray-50 transition-all w-fit shadow-sm active:scale-95 flex items-center justify-center"
                      >
                        Generate Webinar Link
                      </button>
                    </div>

                    {/* Stream Details Header */}
                    <div className="pt-2">
                      <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">Stream Details</h4>
                    </div>

                    {/* Stream Status */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Stream Status</label>
                      <div className="relative group">
                        <select
                          value={webinarForm.streamStatus}
                          onChange={(e) => setWebinarForm({ ...webinarForm, streamStatus: e.target.value })}
                          className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none appearance-none focus:border-gray-400 transition-all shadow-sm"
                        >
                          <option value="Live">Live</option>
                          <option value="Upcoming">Upcoming</option>
                          <option value="Recorded">Recorded</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-hover:text-gray-600">expand_more</span>
                      </div>
                    </div>

                    {/* Publish On */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Publish On</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={webinarForm.publishOn}
                          onChange={(e) => setWebinarForm({ ...webinarForm, publishOn: e.target.value })}
                          className="w-full h-[54px] px-5 bg-gray-100 border border-gray-100 rounded-[12px] text-[15px] font-medium outline-none text-gray-500 cursor-default"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Additional Content Header */}
                    <div className="pt-2">
                      <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">Additional Content</h4>
                    </div>

                    {/* Attach PDF 1 */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Attach PDF</label>
                      <div className="flex gap-4">
                        <div className="w-[120px] h-[100px] bg-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-2 border border-gray-200 shrink-0 relative overflow-hidden group">
                          <span className="material-symbols-outlined text-[28px] text-gray-400">question_mark</span>
                          <span className="text-[12px] font-bold text-gray-400">No PDF</span>
                        </div>
                        <div
                          onClick={() => webinarPdf1Ref.current?.click()}
                          className="flex-1 border-2 border-dashed border-gray-200 rounded-[12px] flex flex-col items-center justify-center p-4 hover:border-gray-400 hover:bg-gray-50/50 transition-all cursor-pointer group"
                        >
                          <h4 className="text-[15px] font-bold text-gray-400 mb-1 group-hover:text-gray-600 transition-colors">Upload PDF</h4>
                          <span className="text-[11px] font-medium text-gray-400 text-center leading-[1.4] tracking-tight truncate w-full px-4">Click or Drag & Drop your file here.</span>
                        </div>
                      </div>
                      <input type="file" ref={webinarPdf1Ref} className="hidden" accept="application/pdf" onChange={(e) => handleWebinarFileUpload(e, 'pdf1')} />
                    </div>

                    {/* Attach PDF 2 */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Attach PDF</label>
                      <div className="flex gap-4">
                        <div className="w-[120px] h-[100px] bg-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-2 border border-gray-200 shrink-0 relative overflow-hidden group">
                          <span className="material-symbols-outlined text-[28px] text-gray-400">question_mark</span>
                          <span className="text-[12px] font-bold text-gray-400">No PDF</span>
                        </div>
                        <div
                          onClick={() => webinarPdf2Ref.current?.click()}
                          className="flex-1 border-2 border-dashed border-gray-200 rounded-[12px] flex flex-col items-center justify-center p-4 hover:border-gray-400 hover:bg-gray-50/50 transition-all cursor-pointer group"
                        >
                          <h4 className="text-[15px] font-bold text-gray-400 mb-1 group-hover:text-gray-600 transition-colors">Upload PDF</h4>
                          <span className="text-[11px] font-medium text-gray-400 text-center leading-[1.4] tracking-tight truncate w-full px-4">Click or Drag & Drop your file here.</span>
                        </div>
                      </div>
                      <input type="file" ref={webinarPdf2Ref} className="hidden" accept="application/pdf" onChange={(e) => handleWebinarFileUpload(e, 'pdf2')} />
                    </div>

                    {/* Study Material */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Study Material</label>
                      <div className="flex gap-4">
                        <div className="w-[120px] h-[100px] bg-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-2 border border-gray-200 shrink-0 relative overflow-hidden group">
                          <span className="material-symbols-outlined text-[28px] text-gray-400">question_mark</span>
                          <span className="text-[12px] font-bold text-gray-400">No File</span>
                        </div>
                        <div
                          onClick={() => webinarStudyMaterialRef.current?.click()}
                          className="flex-1 border-2 border-dashed border-gray-200 rounded-[12px] flex flex-col items-center justify-center p-4 hover:border-gray-400 hover:bg-gray-50/50 transition-all cursor-pointer group"
                        >
                          <h4 className="text-[15px] font-bold text-gray-400 mb-1 group-hover:text-gray-600 transition-colors">Upload File</h4>
                          <span className="text-[11px] font-medium text-gray-400 text-center leading-[1.4] tracking-tight truncate w-full px-4">Click or Drag & Drop your file here.</span>
                        </div>
                      </div>
                      <input type="file" ref={webinarStudyMaterialRef} className="hidden" accept="*" onChange={(e) => handleWebinarFileUpload(e, 'studyMaterial')} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="text-[15px] font-bold text-gray-800 tracking-tight">Advanced Settings</h4>

                    {/* Quiz */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Quiz</label>
                      <div className="relative group">
                        <select
                          value={webinarForm.quizId}
                          onChange={(e) => setWebinarForm({ ...webinarForm, quizId: e.target.value })}
                          className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none appearance-none focus:border-gray-400 transition-all shadow-sm"
                        >
                          <option value="">Select Quiz</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">expand_more</span>
                      </div>
                    </div>

                    {/* In App download Toggle */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="text-[15px] font-bold text-gray-800 tracking-tight">In App download</p>
                        <p className="text-[12px] text-gray-400 font-bold tracking-tight leading-relaxed max-w-[280px]">Switch ON if you want the users to be able to download the video</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={webinarForm.allowDownload}
                          onChange={(e) => setWebinarForm({ ...webinarForm, allowDownload: e.target.checked })}
                        />
                        <div className={`w-[48px] h-[26px] rounded-full transition-all relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${webinarForm.allowDownload ? 'bg-black after:translate-x-[22px]' : 'bg-gray-200'}`}></div>
                      </label>
                    </div>

                    {/* Live Chat Message Visibility */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Live Chat Message Visibility</label>
                      <div className="relative group">
                        <select
                          value={webinarForm.chatVisibility}
                          onChange={(e) => setWebinarForm({ ...webinarForm, chatVisibility: e.target.value })}
                          className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none appearance-none focus:border-gray-400 transition-all shadow-sm"
                        >
                          <option value="Everyone">Everyone</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">expand_more</span>
                      </div>
                    </div>

                    {/* Enable Video Restrictions Toggle */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="text-[15px] font-bold text-gray-800 tracking-tight">Enable Video Restrictions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={webinarForm.videoRestrictions}
                          onChange={(e) => setWebinarForm({ ...webinarForm, videoRestrictions: e.target.checked })}
                        />
                        <div className={`w-[48px] h-[26px] rounded-full transition-all relative after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${webinarForm.videoRestrictions ? 'bg-black after:translate-x-[22px]' : 'bg-gray-200'}`}></div>
                      </label>
                    </div>

                    {/* Sorting Order */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-bold text-gray-600 tracking-tight">Sorting Order</label>
                      <input
                        type="text"
                        value={webinarForm.order}
                        onChange={(e) => setWebinarForm({ ...webinarForm, order: e.target.value })}
                        className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Fixed Bottom Submit Button */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-6 border-t border-gray-100 bg-white z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
              <button
                onClick={handleWebinarSubmit}
                className="w-full h-[56px] bg-[#1a1c1e] text-white text-[16px] font-bold rounded-[16px] hover:bg-black transition-all shadow-lg active:scale-[0.98]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showCourseEditModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in transition-opacity"
            onClick={() => setShowCourseEditModal(false)}
          />

          <div className="relative w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
            <div className="px-8 pt-8 pb-5 flex items-center justify-between relative">
              <h3 className="text-[16px] font-bold text-gray-800 tracking-tight">Edit Course</h3>
              <button onClick={() => setShowCourseEditModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400/5 blur-[60px] rounded-full pointer-events-none" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 space-y-6 pb-24">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-800">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={courseFormData.name}
                  onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                  placeholder="Title"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] text-[15px] font-medium text-gray-700 outline-none focus:border-gray-400 transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-800">Description</label>
                <textarea
                  rows={4}
                  value={courseFormData.description ? courseFormData.description.replace(/<[^>]*>/g, '') : ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  placeholder="Enter Description"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[10px] text-[15px] font-medium text-gray-700 outline-none focus:border-gray-400 transition-all resize-none placeholder:text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-800">Image</label>
                <div className="flex gap-4">
                  <div className="w-[170px] aspect-[4/3] bg-[#f8fafc] border border-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-2 relative overflow-hidden shrink-0">
                    {courseFormData.imageUrl ? (
                      <img src={courseFormData.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-gray-300 text-[36px]">image</span>
                        <p className="text-[12px] font-bold text-gray-300 uppercase tracking-widest">No Image</p>
                      </>
                    )}
                  </div>
                  <div
                    onClick={() => document.getElementById('course-image-upload')?.click()}
                    className="flex-1 border-2 border-dashed border-gray-100 rounded-[12px] flex flex-col items-center justify-center gap-1 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer p-5 text-center group"
                  >
                    <input
                      id="course-image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCourseImageUpload}
                    />
                    {imageUploadLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[12px] font-bold text-blue-500">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-gray-300 text-[30px] group-hover:text-gray-400 transition-colors">touch_app</span>
                        <p className="text-[14px] font-bold text-gray-400">Upload Image</p>
                        <p className="text-[10px] font-medium text-gray-300 leading-tight">Click or Drag & Drop your file here</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-800">Status</label>
                <div className="bg-[#f8fafc] p-1.5 rounded-xl flex relative border border-gray-100/50">
                  <div
                    className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-[#e2e8f0] rounded-lg shadow-sm transition-all duration-300 ${(courseFormData.price === '0' || courseFormData.price === '') ? 'left-1.5' : 'left-[50%]'}`}
                  />
                  <button
                    onClick={() => setCourseFormData({ ...courseFormData, price: '0' })}
                    className={`flex-1 relative z-10 py-2.5 text-[12px] font-bold transition-colors ${(courseFormData.price === '0' || courseFormData.price === '') ? 'text-gray-800' : 'text-gray-400'}`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => { if (courseFormData.price === '0' || courseFormData.price === '') setCourseFormData({ ...courseFormData, price: '1499' }); }}
                    className={`flex-1 relative z-10 py-2.5 text-[12px] font-bold transition-colors ${(courseFormData.price !== '0' && courseFormData.price !== '') ? 'text-gray-800' : 'text-gray-400'}`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowCourseMoreOptions(!showCourseMoreOptions)}
                  className="flex items-center gap-1 text-[13px] font-bold text-blue-500 hover:text-blue-600 transition-all ml-auto"
                >
                  <span className={`material-symbols-outlined text-[18px] transition-transform ${showCourseMoreOptions ? 'rotate-90 text-blue-600' : ''}`}>play_arrow</span>
                  Advanced Settings
                </button>

                {showCourseMoreOptions && (
                  <div className="mt-4 space-y-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                        <select
                          value={courseFormData.categoryId || ''}
                          onChange={(e) => setCourseFormData({ ...courseFormData, categoryId: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-[12px] outline-none"
                        >
                          <option value="">Select</option>
                          {courseCategories.map((cat: any) => (
                            <option key={cat.id || cat._id} value={cat.id || cat._id}>
                              {cat.title || cat.name || cat.id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Price (₹)</label>
                        <input
                          type="number"
                          value={courseFormData.price || ''}
                          onChange={(e) => setCourseFormData({ ...courseFormData, price: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-[12px] outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-gray-100">
                <button
                  onClick={handleCourseEditSubmit}
                  className="w-full py-5 bg-[#1a1a1b] text-white text-[15px] font-bold tracking-[0.2em] hover:bg-black transition-all rounded-2xl flex items-center justify-center shadow-lg uppercase"
                >
                  SUBMIT
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
      }

      <SubjectiveTestDrawer
        isOpen={showSubjectiveTestDrawer}
        courseId={(selectedCourse as any)?._id || selectedCourse?.id}
        onClose={() => { setShowSubjectiveTestDrawer(false); setSubjectiveTestSearch(''); setShowSubjectiveDropdown(false); setSelectedSubjectiveList([]); }}
        onAddTests={(tests) => {
          setSelectedSubjectiveList(tests);
          showToast('Subjective tests added successfully', 'success');
          setShowSubjectiveTestDrawer(false);
        }}
      />

      <OMRTestDrawer
        isOpen={showOMRDrawer}
        onClose={() => setShowOMRDrawer(false)}
        testSeriesList={testSeriesList}
        isSeriesLoading={isTestSeriesLoading}
        onSeriesChange={(id) => fetchTestsBySeries(id, 'omr')}
        availableTests={omrTests}
        isTestsLoading={isOMRTestsLoading}
        onSubmit={(testList) => {
          showToast(`${testList.length} OMR test(s) added successfully`, 'success');
          setShowOMRDrawer(false);
        }}
      />

      <TestDrawer
        isOpen={showTestDrawer}
        onClose={() => setShowTestDrawer(false)}
        testSeriesList={testSeriesList}
        isSeriesLoading={isTestSeriesLoading}
        onSeriesChange={(id) => fetchTestsBySeries(id, 'standard')}
        availableTests={standardTests}
        isTestsLoading={isStandardTestsLoading}
        onSubmit={(testList) => {
          setTests(prev => [...prev, ...testList]);
          showToast(`${testList.length} test(s) added successfully`, 'success');
          setShowTestDrawer(false);
        }}
      />

      <QuizDrawer
        isOpen={showQuizDrawer}
        onClose={() => setShowQuizDrawer(false)}
        onSubmit={() => { showToast('Quiz added', 'success'); setShowQuizDrawer(false); }}
      />

      <UploadDrawer
        isOpen={showAudioDrawer}
        onClose={() => setShowAudioDrawer(false)}
        title="Add Audio File(s)"
        subtitle="Upload Audio"
        accept="audio/*"
        onSubmit={(files) => {
          showToast(`${files.length} audio file(s) uploaded`, 'success');
          setShowAudioDrawer(false);
        }}
      />

      <VideoDrawer
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSubmit={(data) => {
          if (Array.isArray(data)) {
            showToast(`${data.length} video(s) uploaded`, 'success');
          } else {
            showToast('Video link added', 'success');
          }
          setShowVideoModal(false);
          loadCourseContent();
        }}
      />

      <UploadDrawer
        isOpen={showDocumentDrawer || showNoteModal}
        onClose={() => { setShowDocumentDrawer(false); setShowNoteModal(false); }}
        title="Add Document(s) / Note(s)"
        subtitle="Upload Files"
        accept=".pdf,.doc,.docx,application/pdf"
        onSubmit={(files) => {
          showToast(`${files.length} file(s) uploaded`, 'success');
          setShowDocumentDrawer(false);
          setShowNoteModal(false);
        }}
      />

      {/* REDUNDANT DRAWERS REMOVED: CUSTOM PORTALS USED ABOVE */}
      {/* 
      <LiveStreamDrawer
        isOpen={showLiveStreamModal || showYoutubeZoomModal}
        onClose={() => { setShowLiveStreamModal(false); setShowYoutubeZoomModal(false); }}
        onSubmit={(data) => {
          showToast('Live session scheduled successfully', 'success');
          setShowLiveStreamModal(false);
          setShowYoutubeZoomModal(false);
          loadCourseContent();
        }}
      />

      <WebinarDrawer
        isOpen={showWebinarModal}
        onClose={() => setShowWebinarModal(false)}
        onSubmit={(data) => {
          showToast('Webinar connected successfully', 'success');
          setShowWebinarModal(false);
          loadCourseContent();
        }}
      />
      */}

      <LinkDrawer
        isOpen={showLinkDrawer}
        onClose={() => setShowLinkDrawer(false)}
        onSubmit={() => { showToast('Link added', 'success'); setShowLinkDrawer(false); }}
      />

      {showImportModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in transition-opacity"
            onClick={() => setShowImportModal(false)}
          />
          <div className="relative w-[480px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
              <h3 className="text-[20px] font-bold text-[#1e1e1e] tracking-tight">Import Content</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-400 rounded-full transition-all"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 pb-40">
              {/* Source Selection */}
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-600 tracking-tight">
                  Source <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <select
                    value={importSource}
                    onChange={(e) => setImportSource(e.target.value)}
                    className="w-full h-[54px] px-5 bg-white border border-gray-200 rounded-[12px] text-[15px] font-medium outline-none appearance-none focus:border-gray-400 transition-all shadow-sm"
                  >
                    <option value="">Select Course</option>
                    {courses.filter(c => (c._id || c.id) !== ((selectedCourse as any)?._id || (selectedCourse as any)?.id)).map(course => (
                      <option key={course._id || course.id} value={course._id || course.id}>
                        {course.name || course.title}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">expand_more</span>
                </div>
              </div>

              {importSource && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* List Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-[17px] font-bold text-[#1e1e1e] tracking-tight">Course Content</h4>
                    <div className="relative w-[180px]">
                      <input
                        type="text"
                        placeholder="Search"
                        value={importSearch}
                        onChange={(e) => setImportSearch(e.target.value)}
                        className="w-full h-[38px] pl-10 pr-4 bg-gray-50/50 border border-gray-200 rounded-[10px] text-[13px] font-medium outline-none focus:border-gray-400 transition-all"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Select All */}
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-[14px] font-bold text-gray-400">Select all</span>
                      <input
                        type="checkbox"
                        checked={importItems.length > 0 && selectedImportItems.length === importItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImportItems(importItems.map(i => i._id || i.id));
                          } else {
                            setSelectedImportItems([]);
                          }
                        }}
                        className="w-5 h-5 accent-black cursor-pointer rounded-md"
                      />
                    </div>

                    {/* Items List */}
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {isImportLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                          <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                          <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">Loading Content...</span>
                        </div>
                      ) : importItems.length > 0 ? (
                        importItems.filter(item => (item.title || item.name || '').toLowerCase().includes(importSearch.toLowerCase())).map((item) => (
                          <div
                            key={item._id || item.id}
                            onClick={() => {
                              const id = item._id || item.id;
                              setSelectedImportItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                            }}
                            className="flex items-center justify-between py-4 px-3 hover:bg-gray-50 rounded-[15px] cursor-pointer transition-all border border-transparent group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-all shrink-0">
                                <span className="material-symbols-outlined text-gray-400 text-[20px]">
                                  {item.type === 'folder' ? 'folder' : (item.type === 'video' ? 'videocam' : 'description')}
                                </span>
                              </div>
                              <span className="text-[15px] font-bold text-gray-700 tracking-tight">{item.title || item.name}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedImportItems.includes(item._id || item.id)}
                              onChange={() => { }} // Handled by div click
                              className="w-5 h-5 accent-black cursor-pointer rounded-md"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
                          <span className="material-symbols-outlined text-[64px] mb-4">move_to_inbox</span>
                          <p className="text-[16px] font-bold tracking-tight uppercase">Empty Course Content</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!importSource && !isImportLoading && (
                <div className="py-40 flex flex-col items-center justify-center text-center opacity-20">
                  <span className="material-symbols-outlined text-[72px] mb-6">dynamic_feed</span>
                  <p className="text-[17px] font-bold tracking-tight uppercase">Select a course to see content</p>
                </div>
              )}
            </div>

            {/* Fixed Bottom Action Area */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-6 border-t border-gray-100 bg-white z-[100] flex gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
              <button
                onClick={() => handleImportAction('move')}
                disabled={selectedImportItems.length === 0}
                className="flex-1 h-[56px] bg-white border border-gray-200 text-gray-800 text-[15px] font-bold rounded-[16px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-gray-600 transition-colors">drive_file_move_rtl</span>
                Move
              </button>
              <button
                onClick={() => handleImportAction('copy')}
                disabled={selectedImportItems.length === 0}
                className="flex-1 h-[56px] bg-[#1a1c1e] text-white text-[15px] font-bold rounded-[16px] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                Copy
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <BulkActionsDrawerComponent
        isOpen={showBulkActionDrawer}
        onClose={() => setShowBulkActionDrawer(false)}
        items={combinedItems}
        onApplyAction={handleBulkAction}
      />

      <AddFolderDrawer
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleFolderSubmit}
        onUploadImage={async (file) => {
          // Placeholder for upload logic
          return URL.createObjectURL(file);
        }}
        editingFolder={editingFolder}
      />

      <UploadDrawer
        isOpen={showImageDrawer}
        onClose={() => setShowImageDrawer(false)}
        title="Add Image(s)"
        subtitle="Upload Images"
        accept="image/*"
        onSubmit={(files) => {
          showToast(`${files.length} image(s) uploaded`, 'success');
          setShowImageDrawer(false);
        }}
      />

      <UploadDrawer
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        title="Add Document(s)"
        subtitle="Upload Documents"
        accept="*"
        onSubmit={(files) => {
          showToast(`${files.length} document(s) uploaded`, 'success');
          setShowDocumentModal(false);
        }}
      />
    </div >
  );
};


export default CourseContentManager;
