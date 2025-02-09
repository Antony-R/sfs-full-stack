import Link from "next/link";
import { getVideos } from "./firebase/functions";
import styles from "./page.module.css";
import Image from "next/image";

export default async function Home() {
  const videos = await getVideos();
  console.log(videos);

  return (
    <div className={styles.page}>
      <main>
      {
        videos.map((video) => (
          <Link href={`/watch?v=${video.fileName}`} key={video.id}>
            <Image src={'/thumbnail.jpg'} alt='video' width={120} height={80}
              className={styles.thumbnail}/>
          </Link>
        ))
      }
      </main>
    </div>
  );
}

// disable cache. fetch videos after 30 secs
export const revalidate = 30;