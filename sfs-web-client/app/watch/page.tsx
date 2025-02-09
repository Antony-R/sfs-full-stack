'use client'

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import styles from "./page.module.css";

export default function Watch() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ShowVideo/>
        </Suspense>
    );
}

function ShowVideo() {
    // to prevent copying the video link by right click
    useEffect(() => {
        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }
    
        return () => { // Clean up the listener when the component unmounts
            if (video) {
                video.removeEventListener('contextmenu', (event) => {
                    event.preventDefault();
                });
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    const videoPrefix = 'https://storage.googleapis.com/sfs-processed-videos/';
    const fileName = useSearchParams().get('v');
    return (
        <div className={styles['video-container']}>
            <h1 className={styles.title}>Watch Page</h1>
            <video controls src={videoPrefix + fileName} className={styles.video} controlsList="nodownload"/>
        </div> 
    );
}