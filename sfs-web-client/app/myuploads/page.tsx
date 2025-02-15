'use client'

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { onAuthStateChangedHelper } from '../firebase/firebase';
import { User } from 'firebase/auth';
import { getMyUploads, Video } from '../firebase/functions';

import styles from "./page.module.css";

export default function MyUploads() {
    const [user, setUser] = useState<User | null>(null);
    const [uploads, setUploads] = useState<Video[] | []>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper(async (user) => {
            setUser(user);
            setIsLoading(true);
            if (user) {
                // Now you can pass the authenticated user when calling the Firebase function
                try {
                    const result = await getMyUploads(); // Call the function here
                    setUploads(result);
                } catch (error) {
                    console.error("Error fetching uploads:", error);
                    // Handle error, maybe show an error message
                }
            } else {
                // Redirect or show a message when not authenticated
                console.log("User not authenticated");
                redirect('/');
            }
            setIsLoading(false);
        });
    
        return () => unsubscribe(); // Cleanup subscription
    }, []);
    
    return (
        <div>
            {
                isLoading ? <h1>Loading ...</h1> :
                    <>
                        {uploads.length === 0 ? (
                            <div>No uploads found.</div>
                        ) : (
                            <div className={styles.container}>
                            <h1>My Uploads</h1>
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
                                            <td>{videoMeta.title}</td>
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