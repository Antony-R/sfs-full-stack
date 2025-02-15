'use client'

import { redirect, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";
import { getLikesCount, isVideoLikedByUser, likeVideo } from "./like-video";
import { useAuth } from "../AuthContext";

export default function Watch() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ShowVideo />
        </Suspense>
    );
}

const videoPrefix = 'https://storage.googleapis.com/sfs-processed-videos/';

function ShowVideo() {
    const { user, loading } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeStatusLoading, setLikeStatusLoading] = useState(true);

    const fileName = useSearchParams().get('v');
    if (!fileName) {
        redirect("/");
    }
    const videoId = fileName.split('.')[0].replace('processed-', '');

    async function updateLikesCount() {
        const count = await getLikesCount(videoId);
        setLikeCount(count);
    }

    async function checkUserLiked() {
        const isLiked = await isVideoLikedByUser(videoId);
        setLiked(isLiked);
    }

    async function fetchLikesData() {  //Combined function to fetch all data
        await updateLikesCount();
        if (user) {
            await checkUserLiked();
        }
        setLikeStatusLoading(false);
    }

    // to prevent copying the video link by right click
    useEffect(() => {
        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }

        fetchLikesData();
        return () => { // Clean up the listener when the component unmounts
            if (video) {
                video.removeEventListener('contextmenu', (event) => {
                    event.preventDefault();
                });
            }
        };
    }, [user, loading]); // Empty dependency array ensures this runs only once

    const handleLike = async () => {
        if (!user || loading) {
            return;
        }

        setLiked(!liked);

        await likeVideo(videoId);
        await updateLikesCount();

        console.log("Video liked:", !liked); // Or send data to backend.
    };

    return (
        <>
        {
            loading ? <h1>Loading ...</h1> :
            <div className={styles.videContainer}>
                <h1 className={styles.title}>Watch Page</h1>
                <video controls src={videoPrefix + fileName} className={styles.video} controlsList="nodownload" />

                <div className={styles.likeContainer}>
                    <button
                        className={styles.likeButton}
                        onClick={handleLike}
                        disabled={likeStatusLoading || !user} // Disable while loading or not logged in
                    >
                        {likeStatusLoading ? 'Loading...' : (liked ? 'Unlike' : 'Like')}
                    </button>
                    <span className={styles.likeCount}>{likeCount}</span>
                </div>
            </div>
        }
        </>
    );
}