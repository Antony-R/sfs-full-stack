import Link from "next/link";
import styles from "./navbar.module.css";

export default function MeButton() {
    return (
        <Link href={`/me`}>
            <button className={styles.navbarButton}>
                Me
            </button>
        </Link>
    );
}