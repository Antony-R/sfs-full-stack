// components/LikeButton.tsx
import React from "react";
import styles from "../watch/page.module.css";

interface LikeButtonProps {
    liked: boolean;
    likeCount: number;
    likeStatusLoading: boolean;
    user: any; // Replace 'any' with your user type
    handleLike: () => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
    liked,
    likeCount,
    likeStatusLoading,
    user,
    handleLike,
}) => {
    return (
        <div className={styles.likeContainer}>
            <button
                className={styles.likeButton}
                style={{
                    '--like-color': liked ? '#D3D3D3' : undefined,
                    '--like-text-color': liked ? '#333' : undefined,
                } as React.CSSProperties}
                onClick={handleLike}
                disabled={likeStatusLoading || !user}
            >
                {likeStatusLoading ? 'Loading...' : (liked ? 'Unlike' : 'Like')}
            </button>
            <span className={styles.likeCount}>{likeCount}</span>
        </div>
    );
};