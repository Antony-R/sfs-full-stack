'use client'

import styles from "./navbar.module.css";
import SignIn from "./sign-in";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import Logo from "./logo";
import MyUploadsButton from "./myuploads-button";
import { usePathname, useRouter } from "next/navigation";
import UploadButton from "./upload-button";
import Link from 'next/link'; // Import Link for navigation

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();
    const router = useRouter(); // Initialize useRouter

    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContent}>
                <div className={styles.navbarLeft}>
                    <Logo />
                </div>
                <div className={styles.navbarCenter}>
                    {user && <UploadButton />}
                </div>
                <div className={styles.navbarRight}>
                    {user && pathname !== '/myuploads' && <MyUploadsButton />}
                    {user && pathname !== '/chats' && <Link href="/chats" className={styles.navbarButton}>Chats</Link>}
                    <SignIn user={user} />
                </div>
            </div>
        </nav>
    );
}