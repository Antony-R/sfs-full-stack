'use client'

import Link from "next/link";
import { getVideos, Video } from "./firebase/functions";
import styles from "./page.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isInitialFetch = useRef(true);

  const fetchVideos = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      const videosResponse: any = await getVideos(lastVisibleId);

      if (videosResponse && videosResponse.videos && videosResponse.videos.length > 0) {
        setVideos((prevVideos) => [...prevVideos, ...videosResponse.videos]);
        setLastVisibleId(videosResponse.lastVisibleId);
      } else {
        setHasMore(false); // No more videos
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialFetch.current) {
      fetchVideos();
      isInitialFetch.current = false;
    }
  }, []); // Fetch initial videos on mount

  const loadMore = () => {
    fetchVideos();
  };

  return (
    <div className={styles.page}>
      <main>
        <div className={styles.videoList}> {/* Container for videos */}
          {videos.map((video) => (
            <Link
              href={`/watch?v=${video.id}`}
              key={video.id}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <Image
                src={'/filmthumbnail.png'}
                alt="video"
                width={120}
                height={80}
                className={styles.thumbnail}
              />
              <span className={styles.text}>{video.title}</span>
            </Link>
          ))}
        </div> {/* End of video container */}

        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <button
              onClick={loadMore}
              className={styles.loadMoreButton}
              disabled={loading} // Disable the button while loading
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
        {!hasMore && <p className={styles.noMoreVideos}>No more videos</p>}
      </main>
    </div>
  );
}

// disable cache. fetch videos after 30 secs
//export const revalidate = 30;