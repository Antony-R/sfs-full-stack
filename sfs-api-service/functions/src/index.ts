/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {DocumentReference, FieldValue,
  Firestore, Timestamp} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {CallableRequest, HttpsError, onCall} from "firebase-functions/v2/https";
import {UserInfo} from "firebase-admin/auth";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const videoCollectionId = "videos";
const usersCollectionId = "users";

export interface Video {
    id?: string,
    uid?: string,
    fileName?: string,
    status?: "processing" | "processed",
    title?: string,
    description?: string,
    cast?: Record<string, DocumentReference>;
    timestamp?: Timestamp
}

const validateAuthentication = (request: CallableRequest<any>) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }
};

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
    displayName: user.displayName,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User created: ${JSON.stringify(userInfo)}`);
  return;
});

export const getOrCreateChat = onCall({maxInstances: 1}, async (request) => {
  validateAuthentication(request);

  const currentUid = request.auth?.uid;
  const partnerUid = request.data.partnerUid;

  if (!currentUid || !partnerUid) {
    throw new Error("Missing currentUid or partnerUid");
  }

  const participants = [currentUid, partnerUid].sort();

  // Create a new document with an auto-generated ID
  const chatRef = firestore.collection("chats").doc();

  // Check if a chat with the same participants already exists
  const existingChats = await firestore
    .collection("chats")
    .where("participants", "==", participants)
    .get();

  if (!existingChats.empty) {
    // If a chat exists, return its ID
    return existingChats.docs[0].id;
  }

  // If no chat exists, create the new one and return its ID
  await chatRef.set({
    participants,
    lastMessage: "",
    timestamp: FieldValue.serverTimestamp(),
  });

  return chatRef.id;
});

const RAW_VIDEO_BUCKET_NAME = "sfs-raw-videos";

export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  validateAuthentication(request);

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(RAW_VIDEO_BUCKET_NAME);

  // Generate a unique filename
  const fileName = `${auth?.uid}-${Date.now()}.${data.fileExtension}`;

  // Get v4 signed URL for uploading file
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return {url, fileName};
});

export const getVideos = onCall({maxInstances: 1}, async (request) => {
  const statusFilter = "processed";
  const lastVisibleId = request.data.lastVisibleId;
  const searchStr = request.data.searchStr;
  const limit = 10; // Number of videos per page
  // TODO: check if orderBy is required for consistent pagination

  try {
    let query = firestore.collection(videoCollectionId)
      .where("status", "==", statusFilter)
      .orderBy("timestamp", "desc");

    if (searchStr) {
      query = query.where("title", ">=", searchStr)
        .where("title", "<=", searchStr + "\uf8ff");
    }

    if (!searchStr) {
      // no pagination for search
      query = query.limit(limit);
    }

    if (lastVisibleId) {
      const lastVisibleDoc = await firestore
        .collection(videoCollectionId)
        .doc(lastVisibleId)
        .get();
      if (lastVisibleDoc.exists) {
        query = query.startAfter(lastVisibleDoc);
      } else {
        // last visible doc doesnt exist, return empty array.
        return {videos: [], lastVisibleId: null};
      }
    }

    const snapshot = await query.get();

    const videos = snapshot.docs.map((doc) => (doc.data()));

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const newLastVisibleId = lastVisible ? lastVisible.id : null;

    return {videos, lastVisibleId: newLastVisibleId};
  } catch (error) {
    console.error("Error fetching videos:", error);
    return {error: "An error occurred"};
  }
});

// TODO: change this to GET
export const getMyUploads = onCall({maxInstances: 1}, async (request) => {
  validateAuthentication(request);

  const uid = request?.auth?.uid;
  const snapshot =
    await firestore.collection(videoCollectionId).where("uid", "==", uid).get();
  return snapshot.docs.map((doc) => doc.data());
});

export const submitVideoMeta = onCall({maxInstances: 1}, async (request) => {
  validateAuthentication(request);

  const data = request.data as { videoId: string; video: Video };
  const {videoId, video} = data;

  if (!videoId || typeof videoId !== "string") {
    throw new HttpsError("invalid-argument", "Video ID must be a string.");
  }

  if (!video || typeof video !== "object") {
    throw new HttpsError("invalid-argument", "Video data must be an object.");
  }

  if (video.title !== undefined &&
    typeof video.title !== "string" &&
    video.title !== null) {
    throw new HttpsError("invalid-argument",
      "Video title must be a string or null.");
  }

  if (video.description !== undefined &&
    typeof video.description !== "string" &&
    video.description !== null) {
    throw new HttpsError("invalid-argument",
      "Video description must be a string or null.");
  }

  if (video.cast !== undefined && typeof video.cast !== "object") {
    throw new HttpsError("invalid-argument", "Cast must be an object.");
  }

  await firestore
    .collection(videoCollectionId)
    .doc(videoId)
    .set({...video, timestamp: FieldValue.serverTimestamp()}, {merge: true});

  return {success: true, message: "Video metadata updated successfully."};
});

export const getVideoMeta = onCall({maxInstances: 1}, async (request) => {
  const videoId = request.data.id;
  const snapshot =
    await firestore.collection(videoCollectionId).doc(videoId).get();
  return snapshot.data();
});

export const getUserMeta = onCall({maxInstances: 1}, async (request) => {
  const userId = request.data.id;
  const snapshot =
    await firestore.collection(usersCollectionId).doc(userId).get();
  return snapshot.data();
});

export const getAllUsersMeta = onCall({maxInstances: 1}, async () => {
  try {
    const snapshot = await firestore.collection(usersCollectionId).get();

    const users: UserInfo[] = [];

    snapshot.forEach((doc) => {
      users.push(doc.data() as UserInfo);
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users.");
  }
});
