'use client';

import { useAuth } from '@/app/AuthContext';
import { firestore } from '@/app/firebase/firebase';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, limit, startAfter, DocumentData, QueryDocumentSnapshot, doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { getUserMeta } from '@/app/firebase/functions';

interface Message {
  senderUid: string;
  senderName: string;
  text: string;
  timestamp?: any;
}

export default function Chat() {
  const params = useParams();
  const { user, loading } = useAuth();
  const [invalidAccess, setInvalidAccess] = useState(false);
  const { chatId } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const lastVisible = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true); // To track if the user is at the bottom

  const fetchMessages = async (initialLoad = true) => {
    if (!chatId || !user) return;
    const chatIdString = Array.isArray(chatId) ? chatId[0] : chatId;
    const messagesRef = collection(firestore, 'chats', chatIdString, 'messages');
    let messagesQuery;

    if (initialLoad) {
      messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(20));
    } else if (lastVisible.current) {
      messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), startAfter(lastVisible.current), limit(10));
    } else {
      setLoadingOlderMessages(false);
      return;
    }

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData: Message[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            senderUid: data.senderUid,
            senderName: data.senderName || 'Anonymous',
            text: data.text,
            timestamp: data.timestamp?.toDate(),
          };
        });

        if (initialLoad) {
          setMessages(messagesData.reverse());
        } else {
          messagesData.reverse();
          setMessages((prevMessages) => [...messagesData, ...prevMessages]);
        }

        if (snapshot.docs.length > 0) {
          lastVisible.current = snapshot.docs[snapshot.docs.length - 1];
        } else {
          lastVisible.current = null;
        }

        setLoadingOlderMessages(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setInvalidAccess(true);
      }
    );

    return () => unsubscribe();
  };

  const fetchOtherUserName = async () => {
    if (!chatId || !user) return;
    const chatIdString = Array.isArray(chatId) ? chatId[0] : chatId;
    const chatDocRef = doc(firestore, 'chats', chatIdString);
    const chatDocSnapshot = await getDoc(chatDocRef);

    if (chatDocSnapshot.exists()) {
      const chatData = chatDocSnapshot.data();
      const otherUserId = chatData.participants.find((uid: string) => uid !== user.uid);
      if (otherUserId) {
        // TODO: security issue, fetch only public info of user
        const otherUser = await getUserMeta(otherUserId);
        setOtherUserName(otherUser.displayName);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchOtherUserName();
  }, [chatId, user]);

  const handleScroll = () => {
    if (!messagesContainerRef.current || loadingOlderMessages) return; // Prevent fetching if already loading messages

    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
    setIsAtBottom(isAtBottom);

    const threshold = 0;
    if (container.scrollTop === threshold) {
      setLoadingOlderMessages(true); // Set flag to prevent fetching again during the process
      fetchMessages(false);
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) {
      return;
    }

    const chatIdString = Array.isArray(chatId) ? chatId[0] : chatId;

    try {
      const messagesRef = collection(firestore, 'chats', chatIdString, 'messages');
      await addDoc(messagesRef, {
        senderUid: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: newMessage,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
      if (!isAtBottom) {
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Automatically scroll to bottom on initial load or after sending a message if user is at bottom
  useEffect(() => {
    if (!loading && messages.length > 0 && isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!user) {
    return <h1>Please sign in to access the chat.</h1>;
  }

  if (invalidAccess) {
    return <h1>Invalid Access.</h1>;
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatWindow}>
        <div className={styles.chatHeader}>
          {otherUserName ? (
            <span className={styles.otherUserContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span className={styles.coloredUsername}>{otherUserName}</span>
            </span>
          ) : (
            'Loading...'
          )}
        </div>
        <div ref={messagesContainerRef} className={styles.messagesContainer} onScroll={handleScroll}>
          {loadingOlderMessages && <p className={styles.loadingOlderMessages}>Loading older messages...</p>}
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.message} ${msg.senderUid === user.uid ? styles.currentUser : ''}`}>
              {msg.text}
              <div className={styles.messageTimestamp}>
                {msg.timestamp?.toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={styles.inputField}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <button onClick={sendMessage} className={styles.sendButton}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
