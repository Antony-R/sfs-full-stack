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
                    <div className={styles.navbarButtonContainer}>
                        <button className={`${styles.navbarButton} ${styles.navbarButtonWithDisplayName}`} onClick={signOut}>
                            Sign Out
                            {user.displayName && (
                                <span className={styles.displayNameOverlay}>{user.displayName}</span>
                            )}
                        </button>
                    </div>
                ) : (
                    <button className={styles.navbarButton} onClick={signInWithGoogle}>
                        Sign In
                    </button>
                )
            }
        </Fragment>
    );
}