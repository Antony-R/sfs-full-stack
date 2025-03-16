// components/ShowVideo.tsx
import React, { useEffect, useState } from "react";
import { redirect, useSearchParams, useRouter } from "next/navigation";
import styles from "../watch/page.module.css"
import { getLikesCount, isVideoLikedByUser, likeVideo } from "./like-video";
import { useAuth } from "../AuthContext";
import { getUserMeta, getVideoMeta, Video } from "../firebase/functions";
import { UserInfo } from "firebase/auth";
import { VideoPlayer } from "../videoplayer/videoplayer";
import { LikeButton } from "../likebutton/likebutton";
import { UploadedBy } from "../uploadedby/uploadedby";

const VIDEO_PREFIX = 'https://storage.googleapis.com/sfs-processed-videos/';

export const ShowVideo: React.FC = () => {
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

    async function fetchLikesData() {
        await updateLikesCount();
        if (user) {
            await checkUserLiked();
        }
        setLikeStatusLoading(false);
    }

    async function fetchVideoMeta() {
        if (!videoId) {
            console.warn("videoId is not set. Cannot fetch video metadata.");
            return;
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
            return;
        }
        fetchVideoMeta();
        fetchLikesData();

        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }

        return () => {
            if (video) {
                video.removeEventListener('contextmenu', (event) => {
                    event.preventDefault();
                });
            }
        };
    }, [user, loading]);

    const handleLike = async () => {
        if (!user || loading || !videoId) {
            return;
        }

        setLiked(!liked);

        await likeVideo(videoId);
        await updateLikesCount();

        console.log("Video liked:", !liked);
    };

    return (
        <>
            {
                loading ? <h1>Loading ...</h1> :
                    <div className={styles.videoContainer}>
                        <VideoPlayer videoUrl={VIDEO_PREFIX + videoMeta?.fileName} title={videoMeta?.title || ''} />
                        <div className={styles.bottomContainer}>
                            <LikeButton
                                liked={liked}
                                likeCount={likeCount}
                                likeStatusLoading={likeStatusLoading}
                                user={user}
                                handleLike={handleLike}
                            />
                            <UploadedBy
                                videoUploader={videoUploader}
                                user={user}
                            />
                        </div>
                    </div>
            }
        </>
    );
};