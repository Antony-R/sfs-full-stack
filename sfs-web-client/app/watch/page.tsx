'use client'

import { redirect, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";
import { getLikesCount, isVideoLikedByUser, likeVideo } from "./like-video";
import { useAuth } from "../AuthContext";
import { getUserMeta, getVideoMeta, Video } from "../firebase/functions";
import { UserInfo } from "firebase/auth";

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
    const [videoMeta, setVideoMeta] = useState<Video | null>(null);
    const [videoUploader, setVideoUploader] = useState<UserInfo | null>(null);
    
    const videoId = useSearchParams().get('v');
    if (!videoId) {
        redirect("/");
    }

    async function updateLikesCount() {
        if (videoId) {
            const count = await getLikesCount(videoId);
            setLikeCount(count);
        }
    }

    async function checkUserLiked() {
        if (videoId) {
            const isLiked = await isVideoLikedByUser(videoId);
            setLiked(isLiked);
        }
    }

    async function fetchLikesData() {  //Combined function to fetch all data
        await updateLikesCount();
        if (user) {
            await checkUserLiked();
        }
        setLikeStatusLoading(false);
    }

    async function fetchVideoMeta() {
        if (!videoId) {
            console.warn("videoId is not set. Cannot fetch video metadata.");
            return; // Early return if videoId is missing
        }

        try {
            const meta = await getVideoMeta(videoId);

            if (!meta || !meta.uid) {
                throw new Error(`Video metadata not found for videoId: ${videoId}`);
            }

            const videoUploaderMeta = await getUserMeta(meta.uid);
            setVideoUploader(videoUploaderMeta);
            setVideoMeta(meta);
        } catch (error) {
            console.log("Error fetching video metadata:", error);
            alert("Failed to fetch video metadata. Please try again.");
            redirect('/');
        }
    }

    useEffect(() => {
        if (loading) {
            return; //fetch data only once
        }
        fetchVideoMeta();
        fetchLikesData();

        //prevent copying the video link
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
    }, [user, loading]); // Dependencies

    const handleLike = async () => {
        if (!user || loading || !videoId) {
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
                <h1 className={styles.title}>{videoMeta?.title}</h1>
                <video controls src={videoPrefix + videoMeta?.fileName} className={styles.video} controlsList="nodownload" />

                <div className={styles.bottomContainer}>
                    <div className={styles.likeContainer}>
                        <button
                            className={styles.likeButton}
                            style={{
                                '--like-color': liked ? '#D3D3D3' : undefined,
                                '--like-text-color': liked ? '#333' : undefined,
                            } as React.CSSProperties}
                            onClick={handleLike}
                            disabled={likeStatusLoading || !user} // Disable while loading or not logged in
                        >
                            {likeStatusLoading ? 'Loading...' : (liked ? 'Unlike' : 'Like')}
                        </button>
                        <span className={styles.likeCount}>{likeCount}</span>
                    </div>

                    <div className={styles.uploadedBy}>
                        Uploaded by <span className={styles.uploader}>{videoUploader?.displayName}</span>
                    </div>
                </div>
            </div>
        }
        </>
    );
}