'use client'

import { User } from "firebase/auth";
import { useAuth } from "../AuthContext";
import styles from "./page.module.css";
import MyUploads from "../myuploads/myuploads";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";

export default function Me() {
    const { user, loading } = useAuth();
    const [activeSection, setActiveSection] = useState<'profile' | 'uploads'>('profile');

    useEffect(() => {
        if (!loading && !user) {
            console.log("User not logged in!");
            redirect('/');
        }
    }, [user, loading]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div
                    className={`${styles.headerLink} ${activeSection === 'profile' ? styles.active : ''}`}
                    onClick={() => setActiveSection('profile')}
                >
                    My Profile
                </div>
                <div
                    className={`${styles.headerLink} ${activeSection === 'uploads' ? styles.active : ''}`}
                    onClick={() => setActiveSection('uploads')}
                >
                    My Uploads
                </div>
            </div>

            {loading ? (
                <p>Loading user information...</p>
            ) : user ? (
                <>
                    {activeSection === 'profile' && <UserDetailsTable user={user} />}
                    {activeSection === 'uploads' && <MyUploads />}
                </>
            ) : (
                <p>Not logged in.</p>
            )}
        </div>
    );
}

function UserDetailsTable({ user }: { user: User }) {
    return (
        <div className={styles.userDetailsContainer}>
            <table className={styles.userDetailsTable}>
                <tbody>
                    <tr>
                        <th className={styles.detailKey}>Display Name</th>
                        <td className={styles.detailValue}>{user.displayName || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th className={styles.detailKey}>User ID</th>
                        <td className={styles.detailValue}>{user.uid}</td>
                    </tr>
                    <tr>
                        <th className={styles.detailKey}>Email</th>
                        <td className={styles.detailValue}>{user.email || 'N/A'}</td>
                    </tr>
                    {user.photoURL && (
                        <tr>
                            <th className={styles.detailKey}>Photo</th>
                            <td className={styles.detailValue}>
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className={styles.profileImage}
                                    width="80"
                                    height="80"
                                    style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #28a745' }}
                                />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}