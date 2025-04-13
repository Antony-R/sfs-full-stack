'use client';

import styles from "./navbar.module.css";
import SignIn from "./sign-in";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChangedHelper } from "../firebase/firebase";
import Logo from "./logo";
import { usePathname } from "next/navigation";
import UploadButton from "./upload-button";
import Link from 'next/link';
import MeButton from "./me-button";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
          <div className={styles.menuIcon} onClick={toggleMenu}>
            <div className={`${styles.bar} ${isMenuOpen ? styles.open : ''}`} />
            <div className={`${styles.bar} ${isMenuOpen ? styles.open : ''}`} />
            <div className={`${styles.bar} ${isMenuOpen ? styles.open : ''}`} />
          </div>
        </div>
        <div className={`${styles.navbarRight} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
          {user && <UploadButton />}
          {user && pathname !== '/me' && <MeButton />}
          {user && pathname !== '/chats' && (
            <Link href="/chats" className={styles.navbarButton}>
              Chats
            </Link>
          )}
          {pathname !== '/about' && 
          <Link href="/about" className={styles.navbarButton}>
              About
          </Link>
          }
          <SignIn user={user} />
        </div>
      </div>
    </nav>
  );
}