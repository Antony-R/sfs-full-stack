'use client'

import Link from "next/link";
import { getVideos, Video } from "./firebase/functions";
import styles from "./page.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchStr, setSearchStr] = useState("");
  const isInitialFetch = useRef(true);

  const fetchVideos = async (searchQuery: string | null = null) => {
    if (loading && !isInitialFetch.current) return;
    setLoading(true);

    try {
      const videosResponse: any = await getVideos(
        searchQuery ? null : lastVisibleId,
        searchQuery
      );

      if (videosResponse && videosResponse.videos && videosResponse.videos.length > 0) {
        if (searchQuery) {
          setVideos(videosResponse.videos);
          setHasMore(false);
        } else {
          setVideos((prevVideos) => [...prevVideos, ...videosResponse.videos]);
          setLastVisibleId(videosResponse.lastVisibleId);
        }
      } else {
        if (searchQuery) {
          setVideos([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialFetch.current) {
      const initialFetch = async () => {
        await fetchVideos();
        setLoading(false);
        isInitialFetch.current = false;
      };
      initialFetch();
    }
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchVideos();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLastVisibleId(null);
    setHasMore(true);
    if (searchStr.trim()) {
      fetchVideos(searchStr.trim());
    } else {
      setVideos([]);
      fetchVideos();
    }
  };

  return (
    <div className={styles.page}>
      <main>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchStr}
            onChange={(e) => setSearchStr(e.target.value)}
            placeholder="Case sensitive prefix search..."
            className={styles.searchInput}
            disabled={loading}
          />
        </form>

        <div className={styles.videoList}>
          {isInitialFetch.current && loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : videos.length > 0 ? (
            videos.map((video) => (
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
            ))
          ) : (
            <p className={styles.noVideos}>No videos found</p>
          )}
        </div>

        {!loading && hasMore && !searchStr && (
          <div className={styles.loadMoreContainer}>
            <button
              onClick={loadMore}
              className={styles.loadMoreButton}
              disabled={loading}
            >
              Load More
            </button>
          </div>
        )}
        {!hasMore && !searchStr && videos.length > 0 && <p className={styles.noMoreVideos}>No more videos</p>}
        {loading && !isInitialFetch.current && <p className={styles.noMoreVideos}>Loading...</p>}
      </main>
    </div>
  );
}

// disable cache. fetch videos after 30 secs
//export const revalidate = 30;