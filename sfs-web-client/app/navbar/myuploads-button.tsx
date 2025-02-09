import Link from "next/link";
import styles from "./navbar.module.css";

export default function MyUploadsButton() {
    return (
        <Link href={`myuploads`}>
            <button className={styles.navbarButton}>
                My Uploads
            </button>
        </Link>
    );
}