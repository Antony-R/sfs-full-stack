'use client'

import { useEffect, useState } from 'react';
import { getMyUploads, Video } from '../firebase/functions';

import styles from "./myuploads.module.css";
import Link from 'next/link';
import { useAuth } from '../AuthContext';

export default function MyUploads() {
    const {user, loading} = useAuth();
    const [uploads, setUploads] = useState<Video[] | []>([]);
    const [isListLoading, setIsListLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUploads = async () => {
            setIsListLoading(true);
            if (user) {
                try {
                    const result = await getMyUploads();
                    setUploads(result);
                } catch (error) {
                    console.error("Error fetching uploads:", error);
                } finally {
                    setIsListLoading(false);
                }
            } else {
                setIsListLoading(false);
                setUploads([]);
            }
        };

        fetchUploads();
    }, [user]);
    
    return (
        <div>
            {
                isListLoading ? <p>Loading ...</p> :
                    <>
                        {uploads.length === 0 ? (
                            <div>No uploads found.</div>
                        ) : (
                            <div className={styles.container}>
                            <table className={styles.uploadsTable}>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Description</th>
                                        {/*<th>File Name</th>  Optional: Include file name if needed */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploads.map((videoMeta) => (
                                        <tr key={videoMeta.id}>
                                            <td>
                                                <Link href={`/watch?v=${videoMeta.id}`} className={styles.link}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth={1.5}
                                                        stroke="currentColor"
                                                        className={styles.playIcon}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
                                                        />
                                                    </svg>
                                                    {videoMeta.title}
                                                </Link>
                                            </td>
                                            <td>{videoMeta.description}</td>
                                            {/*<td>{videoMeta.fileName}</td> Optional: Include file name if needed */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </>
            }

        </div>
    );
}