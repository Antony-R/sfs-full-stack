'use client'

import Image from "next/image";
import styles from "./navbar.module.css";
import Link from "next/link";
import SignIn from "./sign-in";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import Upload from "./upload";

export default function Navbar() {
    //Init user state
    const [user, setUser] = useState<User | null>(null);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) => {
            setUser(user);
        });

        //Cleanup subscription on unmount
        return () => unsubscribe();
    });

    return (
        <nav className={styles.nav}>
            <Link href="/">
                <Image src="/blob.svg" alt="Logo " width={90} height={20}/>
            </Link>
            {
                user && <Upload />
            }
            <SignIn user={user}/>
        </nav>
    ); 
}