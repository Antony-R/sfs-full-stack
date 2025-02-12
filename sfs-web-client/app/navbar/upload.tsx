'use client'

import { useState } from 'react';
import { submitVideoMeta, uploadVideo } from '../firebase/functions';

import styles from './upload.module.css';

export default function Upload({ onClose }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | undefined | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);
    if (file) {
      setVideoFile(file);
    }
  }

  const handleUpload = async (file: File) => {
    try {
      const videoId = await uploadVideo(file);
      console.log(`File uploaded sucessfully: ${videoId}`);
      return videoId;
    } catch (error) {
      alert(`Failed to upload file: ${error}`);
    }
  }

  const handleSubmit = (event: any) => {
    event.preventDefault();

    if (!title || !description || !videoFile) {
      setError("All fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    handleUpload(videoFile)
      .then(videoId => {
        submitVideoMeta(videoId, formData);
        onClose();
      })
      .catch(error => {
        console.error('Upload failed:', error);
        setError("Upload failed. Please try again.");
      });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Upload Video</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <label htmlFor="title" className={styles.label}>Title:</label><br />
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={styles.input} /><br /><br />
  
          <label htmlFor="description" className={styles.label}>Description:</label><br />
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className={styles.textarea} /><br /><br />
  
          <input type="file" id="upload" accept="video/*" onChange={handleFileChange} required className={styles.fileInput} /><br /><br />
  
          <button type="submit" className={styles.uploadButton}>Upload</button>
          <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
        </form>
      </div>
    </div>
  );
}