'use client'

import { Fragment } from "react";

import styles from "./navbar.module.css";

import { signInWithGoogle, signOut } from "../firebase/firebase";
import { User } from "firebase/auth";

interface SignInProps {
    user: User | null;
}

export default function SignIn({ user }: SignInProps) {
    return (
        <Fragment>
            {
                user ? (
                    <button className={styles.navbarButton} onClick={signOut}>
                        Sign Out
                    </button>
                ) : (
                    <button className={styles.navbarButton} onClick={signInWithGoogle}>
                        Sign In
                    </button>
                )
            }
        </Fragment>
    );
}