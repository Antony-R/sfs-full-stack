import {credential} from "firebase-admin";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";

initializeApp({credential: credential.applicationDefault()});
const admin = require("firebase-admin");

const firestore = new Firestore();

const videoCollectionId = 'videos';

export interface Video {
    id?: string,
    uid?: string,
    fileName?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string
}

async function getVideo(videoId: string) {
    const snapshot = await firestore.collection(videoCollectionId).doc(videoId).get();
    return (snapshot.data() as Video) ?? {};
}

export function setVideo(videoId: string, videoMeta: Video) {
    return firestore
            .collection(videoCollectionId)
            .doc(videoId)
            .set(videoMeta, {merge: true}) //to update only modified fields
}

export async function isVideoNew(videoId: string) {
    const video = await getVideo(videoId);
    return video?.status === undefined;
}

export function verifyUserToken(idToken: string) {
    return admin.auth().verifyIdToken(idToken);
}

export async function syncLikeOrDislikeToFirestore(userId: string, videoId: string): Promise<number> {
  const videoRef = firestore.collection(videoCollectionId).doc(videoId);
  const likeRef = videoRef.collection("likes").doc(userId);

  try {
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      throw new Error(`Video document with ID ${videoId} does not exist`);
    }

    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      await likeRef.delete();
      console.log(`User ${userId} disliked video ${videoId}`);
    } else {
      await likeRef.set({});
      console.log(`User ${userId} liked video ${videoId}`);
    }

    const snapshot = await videoRef.collection("likes").count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error("Error syncing like/dislike:", error);
    throw error;
  }
}

  export async function getLikesCount(videoId: string) {
    const videoRef = firestore.collection(videoCollectionId).doc(videoId);
    const snapshot = await videoRef.collection("likes").count().get();
    return snapshot.data().count;
  }

  export async function isLiked(videoId: string, userId: string) {
    const likeRef = firestore.collection(videoCollectionId).doc(videoId).collection("likes").doc(userId);
    const likeDoc = await likeRef.get();
    return likeDoc.exists;
  }