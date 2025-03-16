// components/VideoPlayer.tsx
import React from "react";
import styles from "../watch/page.module.css"

interface VideoPlayerProps {
    videoUrl: string;
    title: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
    return (
        <>
            <h1 className={styles.title}>{title}</h1>
            <video controls src={videoUrl} className={styles.video} controlsList="nodownload" />
        </>
    );
};