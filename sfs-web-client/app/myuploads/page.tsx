'use client'

// pages/myuploads.js (or wherever you handle /myuploads)
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { onAuthStateChangedHelper } from '../firebase/firebase';
import { User } from 'firebase/auth';
import { getMyUploads, Video } from '../firebase/functions';

// ... other imports

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
                        <h1>My Uploads</h1>
                        {uploads.length === 0 ? (
                            <div>No uploads found.</div>
                        ) : (
                            uploads.map((videoMeta) => (
                                <div key={videoMeta.id}>
                                    {videoMeta.fileName}
                                </div>
                            ))
                        )}
                    </>
            }

        </div>
    );
}