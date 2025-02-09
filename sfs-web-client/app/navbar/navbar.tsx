'use client'

import styles from "./navbar.module.css";
import SignIn from "./sign-in";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import Upload from "./upload";
import Logo from "./logo";
import MyUploadsButton from "./myuploads-button";
import { usePathname } from "next/navigation";

export default function Navbar() {
    //Init user state
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();
    
    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) => {
            setUser(user);
        });

        //Cleanup subscription on unmount
        return () => unsubscribe();
    });

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContent}>
                <div className={styles.navbarLeft}>
                    <Logo />
                </div>
                <div className={styles.navbarCenter}>
                    {
                        user && <Upload />
                    }
                </div>
                <div className={styles.navbarRight}>
                    {
                        user && pathname != '/myuploads' && <MyUploadsButton />
                    }
                    <SignIn user={user} />
                </div>
            </div>
        </nav>
    ); 
}