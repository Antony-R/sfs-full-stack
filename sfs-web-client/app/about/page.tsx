import styles from './page.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ShortStream: Ignite Your Filmmaking Journey! 🎬</h1>

      <section className={styles.section}>
        <p className={styles.paragraph}>
          <strong className={styles.strong}>Dreaming of crafting cinematic masterpieces?</strong>{' '}
          <strong className={styles.strong}>Ready to build your dream film crew?</strong>
        </p>
        <p className={styles.paragraph}>
          ShortStream isn't just another video platform. It's your launchpad into the
          vibrant world of collaborative filmmaking. Forget solo struggles –
          we're connecting visionary filmmakers with the talent that makes movies
          magic.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Here's the Reel Deal:</h2>
        <ol className={styles.orderedList}>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Dive into a Sea of Short Films:</strong> Explore a curated
            collection of dynamic short films, showcasing the brilliance of
            emerging filmmakers.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Assemble Your A-Team:</strong> Discover the talent behind the
            lens! Every film highlights its cast and crew, making it easy to
            connect and build your perfect team. Find your cinematographer from
            Film A, your editor from Film B, and create something extraordinary.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>From Vision to Reality:</strong> ShortStream bridges the gap,
            empowering you to find the skilled collaborators you need to bring
            your cinematic visions to life.
          </li>
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Behind the Scenes: Our Tech Powerhouse</h2>
        <ul className={styles.unorderedList}>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Google Cloud Run:</strong> Lightning-fast hosting for a seamless
            experience.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Express.js Backend:</strong> The engine powering our video
            processing magic.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Google Cloud Storage:</strong> Secure and scalable storage for
            your cinematic creations.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Pub/Sub Messaging:</strong> Real-time video processing triggered
            by uploads.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Firestore:</strong> Robust metadata storage for your films
            and crew details.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Next.js Frontend:</strong> A sleek and responsive interface
            for effortless exploration.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Dockerized Backend:</strong> Efficient deployment and scaling
            on Google Cloud Run.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Google Artifact Registry:</strong> Manages our container images.
          </li>
          <li className={styles.listItem}>
            <strong className={styles.strong}>Firebase Auth:</strong> Handles user authentication.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact Us</h2>
        <p className={styles.paragraph}>
          Have any questions or feedback? Reach out to us at:{' '}
          <a href="mailto:r.antony67@gmail.com" className={styles.emailLink}>
            r.antony67@gmail.com
          </a>
        </p>
      </section>
    </div>
  );
}