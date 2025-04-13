'use client';

import { useState, useEffect, useRef } from 'react';
import { submitVideoMeta, uploadVideo, getAllUsers } from '../firebase/functions';
import styles from './upload.module.css';
import { User } from 'firebase/auth';

interface CastEntry {
  role: string;
  userId: string;
}

interface UploadProps {
  onClose: () => void;
}

export default function Upload({ onClose }: UploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | undefined | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cast, setCast] = useState<CastEntry[]>([{ role: '', userId: '' }]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[][]>([]);
  const [showDropdowns, setShowDropdowns] = useState<boolean[]>([]);
  const dropdownRefs = useRef<(HTMLUListElement | null)[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [displayUserNames, setDisplayUserNames] = useState<string[]>(['']); // Initialize with empty string for the first row

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (fetchError) {
        console.error('Failed to fetch users:', fetchError);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    setShowDropdowns(cast.map(() => false));
    setFilteredUsers(cast.map(() => []));
    dropdownRefs.current = cast.map(() => null);
    // Keep displayUserNames based on user input, not directly from cast on every cast change
  }, [cast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);
    if (file) {
      setVideoFile(file);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const videoId = await uploadVideo(file);
      console.log(`File uploaded successfully: ${videoId}`);
      return videoId;
    } catch (uploadError) {
      alert(`Failed to upload file: ${uploadError}`);
      return null; // Indicate upload failure
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title || !description || !videoFile) {
      setError('All fields are required.');
      return;
    }
    setIsUploading(true); // Disable the button

    const castSimple: Record<string, string> = {};
    cast.forEach((castItem) => {
      if (castItem.userId) {
        castSimple[castItem.role] = castItem.userId;
      }
    });

    const videoId = await handleUpload(videoFile);
    if (videoId) {
      try {
        await submitVideoMeta(videoId, title, description, castSimple);
        onClose();
      } catch (submitError) {
        console.log('Failed to submit video metadata:', submitError);
        setError('Failed to submit video metadata. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else if (!error) {
      setError('Video upload failed.');
      setIsUploading(false);
    } else {
      setIsUploading(false);
    }
  };

  const handleCastChange = (index: number, field: 'role' | 'userId', value: string) => {
    const newCast = [...cast];
    newCast[index][field] = value;
    setCast(newCast);
  };

  const handleUserSearch = (index: number, searchText: string) => {
    const newDisplayNames = [...displayUserNames];
    newDisplayNames[index] = searchText;
    setDisplayUserNames(newDisplayNames);

    const filtered = allUsers.filter((user) =>
      user.displayName?.toLowerCase().includes(searchText.toLowerCase())
    );
    const newFilteredUsers = [...filteredUsers];
    newFilteredUsers[index] = filtered;
    setFilteredUsers(newFilteredUsers);

    const newShowDropdowns = [...showDropdowns];
    newShowDropdowns[index] = true;
    setShowDropdowns(newShowDropdowns);
  };

  const selectUser = (index: number, userId: string, displayName: string) => {
    const newCast = [...cast];
    newCast[index].userId = userId;
    setCast(newCast);

    const newFilteredUsers = [...filteredUsers];
    newFilteredUsers[index] = [];
    setFilteredUsers(newFilteredUsers);

    const newShowDropdowns = [...showDropdowns];
    newShowDropdowns[index] = false;
    setShowDropdowns(newShowDropdowns);

    const newDisplayNames = [...displayUserNames];
    newDisplayNames[index] = displayName;
    setDisplayUserNames(newDisplayNames);
  };

  const addCastField = () => {
    setCast([...cast, { role: '', userId: '' }]);
    setDisplayUserNames([...displayUserNames, '']); // Add a new empty display name
  };

  const removeCastField = (index: number) => {
    if (cast.length > 1) {
      const newCast = [...cast];
      newCast.splice(index, 1);
      setCast(newCast);

      const newDisplayNames = [...displayUserNames];
      newDisplayNames.splice(index, 1);
      setDisplayUserNames(newDisplayNames);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Upload Video</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <label htmlFor="title" className={styles.label}>
            Title:
          </label>
          <br />
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={styles.input}
          />
          <br />
          <br />

          <label htmlFor="description" className={styles.label}>
            Description:
          </label>
          <br />
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className={styles.textarea}
            placeholder="Consider this your one take. No 'undo / edit' button for these fields."
          />
          <br />
          <br />

          <div className={styles.castSection}>
            <div className={styles.castHeader}>
              <label className={styles.label}>Cast:</label>
              <button type="button" onClick={addCastField} className={styles.castButton}>
                +
              </button>
            </div>
            {cast.map((entry, index) => (
              <div key={index} className={styles.castRow}>
                <input
                  type="text"
                  placeholder="Role"
                  value={entry.role}
                  onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                  className={`${styles.input} ${styles.castInput}`}
                  required
                />
                <div className={styles.userSearchContainer}>
                  <input
                    type="text"
                    placeholder="User Name"
                    value={displayUserNames[index] || ''} // Use displayUserNames for the input value
                    onChange={(e) => handleUserSearch(index, e.target.value)}
                    className={`${styles.input} ${styles.castInput}`}
                    required
                  />
                  {showDropdowns[index] && filteredUsers[index].length > 0 && (
                    <ul
                      ref={(el) => {
                        if (dropdownRefs.current) {
                          dropdownRefs.current[index] = el;
                        }
                      }}
                      className={styles.userDropdown}
                    >
                      {filteredUsers[index].map((user) => (
                        <li
                          key={user.uid}
                          onClick={() => selectUser(index, user.uid, user.displayName || '')}
                          className={styles.userListItem}
                          title={user.uid}
                        >
                          {user.displayName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {cast.length > 1 && (
                  <button type="button" onClick={() => removeCastField(index)} className={styles.castButton}>
                    -
                  </button>
                )}
              </div>
            ))}
          </div>

          <input type="file" id="upload" accept="video/*" onChange={handleFileChange} required className={styles.fileInput} />
          <br />
          <br />

          <div className={styles.buttonGroup}>
            <button type="submit" disabled={isUploading} className={`${styles.button} ${styles.uploadButton}`}>
              Upload
            </button>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}