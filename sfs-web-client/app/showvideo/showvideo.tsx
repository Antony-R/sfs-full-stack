// components/ShowVideo.tsx
import React, { useEffect, useState } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import styles from "../watch/page.module.css";
import { getLikesCount, isVideoLikedByUser, likeVideo } from "./like-video";
import { useAuth } from "../AuthContext";
import { getOrCreateChat, getUserMeta, getVideoMeta, Video } from "../firebase/functions";
import { UserInfo } from "firebase/auth";
import { VideoPlayer } from "../videoplayer/videoplayer";
import { LikeButton } from "../likebutton/likebutton";
import { UploadedBy } from "../uploadedby/uploadedby";

const VIDEO_PREFIX = 'https://storage.googleapis.com/sfs-processed-videos/';

const loadingMessages = [
    'Fetching awesome film...',
    'Preparing the content...',
    'Almost there, just a moment...',
    'Loading the magic...',
    'Hold tight, film incoming...',
];

interface CastMember {
    role: string;
    displayName: string | null | undefined;
    uid: string;
}

export const ShowVideo: React.FC = () => {
    const { user, loading } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeStatusLoading, setLikeStatusLoading] = useState(true);
    const [metaStatusLoading, setMetaStatusLoading] = useState(true);
    const [videoMeta, setVideoMeta] = useState<Video | null>(null);
    const [videoUploader, setVideoUploader] = useState<UserInfo | null>(null);
    const [castMembers, setCastMembers] = useState<CastMember[]>([]);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]); // Initial message
    const [messageIndex, setMessageIndex] = useState(0);

    const videoId = useSearchParams().get('v');
    if (!videoId) {
        redirect("/");
    }

    const router = useRouter();

    const handleChat = async (otherUserId: string) => {
        if (user && user.uid && otherUserId) {
            const chatId = await getOrCreateChat(otherUserId);
            router.push(`/chats/${chatId}`);
        }
    };

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

    async function fetchVideoMetaAndCast() {
        if (!videoId) {
            console.warn("videoId is not set. Cannot fetch video metadata.");
            return;
        }

        try {
            const meta = await getVideoMeta(videoId);

            if (!meta || !meta.uid) {
                throw new Error(`Video metadata not found for videoId: ${videoId}`);
            }

            setVideoMeta(meta);

            const videoUploaderMeta = await getUserMeta(meta.uid);
            setVideoUploader(videoUploaderMeta);

            const castData = meta.cast || {};
            const castInfo: CastMember[] = [];
            for (const role in castData) {
                const uid = castData[role];
                const userMeta = await getUserMeta(uid);
                castInfo.push({ role, displayName: userMeta?.displayName, uid: userMeta.uid });
            }
            setCastMembers(castInfo);

        } catch (error) {
            console.log("Error fetching video metadata:", error);
            alert("Failed to fetch video metadata. Please try again.");
            redirect('/');
        }
        setMetaStatusLoading(false);
    }

    useEffect(() => {
        if (loading || metaStatusLoading) {
            const interval = setInterval(() => {
                setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
            }, 1000); // Change message every 1.5 seconds (adjust as needed)
            return () => clearInterval(interval);
        }
    }, [loading, metaStatusLoading]);

    useEffect(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
    }, [messageIndex]);

    useEffect(() => {
        if (loading) {
            return;
        }
        fetchVideoMetaAndCast();
        fetchLikesData();

        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
        }

        return () => {
            if (videoElement) {
                videoElement.removeEventListener('contextmenu', (event) => {
                    event.preventDefault();
                });
            }
        };
    }, [user, loading, videoId]);

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
        <div className={styles.watchPageContainer}>
            {
                loading || metaStatusLoading ? <p className={styles.loadingMessage}>{loadingMessage}</p> :
                    <>
                        <div className={styles.videoArea}>
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
                        </div>


                        <div className={styles.castArea}>
                            <div className={styles.castContainer}>
                                <h3 className={styles.castTitle}>Cast</h3>
                                {castMembers.length > 0 ? (
                                    <ul className={styles.castList}>
                                        {castMembers.map((member) => (
                                            <li key={member.role} className={styles.castItem}>
                                                <span className={styles.castRole}>{member.role}:</span>
                                                <span
                                                    className={styles.castName}
                                                >
                                                    {member.displayName || 'Unknown'}
                                                </span>
                                                {user && user.uid !== member.uid && (
                                                    <button className={styles.chatButton} onClick={() => handleChat(member.uid)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.chatIcon}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <ul>
                                        <li className={styles.castItem} key="noElFound">
                                            <span className={styles.castName}>Info unavailable.</span>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
            }
        </div>
    );
};