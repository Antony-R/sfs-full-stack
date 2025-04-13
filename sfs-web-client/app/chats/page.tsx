'use client';

import { useAuth } from '@/app/AuthContext';
import { firestore } from '@/app/firebase/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserMeta } from '../firebase/functions';
import styles from './page.module.css';

interface ChatItem {
    chatId: string;
    otherUserName: string;
    lastMessage: string;
}

export default function ChatsList() {
    const { user, loading } = useAuth();
    const [chatsLoading, setChatsLoading] = useState(true);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchChats = async () => {
            if (!user) return;

            const chatsRef = collection(firestore, 'chats');
            const chatsQuery = query(chatsRef, where('participants', 'array-contains', user.uid));
            const chatsSnapshot = await getDocs(chatsQuery);

            const chatItems: ChatItem[] = [];
            for (const chatDoc of chatsSnapshot.docs) {
                const chatId = chatDoc.id;
                const chatData = chatDoc.data();
                const otherUserId = chatData.participants.find((uid: string) => uid !== user.uid);

                if (otherUserId) {
                    const otherUser = await getUserMeta(otherUserId);
                    const otherUserName = otherUser.displayName ? otherUser.displayName : 'Unknown User';

                    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
                    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
                    const messagesSnapshot = await getDocs(messagesQuery);

                    const lastMessage = messagesSnapshot.docs[0]?.data().text || 'No messages';

                    chatItems.push({
                        chatId,
                        otherUserName,
                        lastMessage,
                    });
                }
            }

            setChats(chatItems);
            setChatsLoading(false);
        };

        fetchChats();
    }, [user]);

    const handleChatClick = (chatId: string) => {
        router.push(`/chats/${chatId}`);
    };

    if (loading) {
        return <h1>Loading...</h1>;
    }

    if (!user) {
        return <h1>Please sign in to view your chats.</h1>;
    }

    return (
        <div className={styles.chatsListContainer}>
            <h1 className={styles.chatsListTitle}>Your Chats</h1>
            {chats.length === 0 ? (
                chatsLoading ? 
                <p className={styles.noChatsMessage}>Loading chats...</p>
                : 
                <p className={styles.noChatsMessage}>You have no active chats.</p>
            ) : (
                <ul className={styles.chatsList}>
                    {chats.map((chat) => (
                        <li key={chat.chatId} className={styles.chatItem}>
                            <div
                                className={styles.chatItemContent}
                                onClick={() => handleChatClick(chat.chatId)}
                            >
                                <span className={styles.otherUserName}>{chat.otherUserName}</span>
                                <span className={styles.lastMessage}>{chat.lastMessage}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}