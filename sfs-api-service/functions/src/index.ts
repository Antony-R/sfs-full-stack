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
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";

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

export interface Video {
    id?: string,
    uid?: string,
    fileName?: string,
    status?: "processing" | "processed",
    title?: string,
    description?: string
}

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User created: ${JSON.stringify(userInfo)}`);
  return;
});

const rawVideoBucketName = "sfs-raw-videos";

export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  // Generate a unique filename
  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  // Get v4 signed URL for uploading file
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return {url, fileName};
});

export const getVideos = onCall({maxInstances: 1}, async () => {
  // TODO: change the limit
  const snapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
  return snapshot.docs.map((doc) => doc.data());
});


export const getMyUploads = onCall({maxInstances: 1}, async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const uid = request.auth.uid;
  const snapshot =
    await firestore.collection(videoCollectionId).where("uid", "==", uid).get();
  return snapshot.docs.map((doc) => doc.data());
});

export const submitVideoMeta = onCall({maxInstances: 1}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }
  const data = request.data;
  const videoId = data.videoId;
  const video: Video = data.video;

  // Validate input
  if (!videoId || typeof videoId !== "string") {
    throw new functions.https
      .HttpsError("invalid-argument", "Video ID must be a string.");
  }
  if (!video || typeof video !== "object") {
    throw new functions.https
      .HttpsError("invalid-argument", "Video data must be an object.");
  }
  if (video.title && typeof video.title !== "string") {
    throw new functions.https
      .HttpsError("invalid-argument", "Video title must be a string.");
  }
  if (video.description && typeof video.description !== "string") {
    throw new functions.https
      .HttpsError("invalid-argument", "Video description must be a string.");
  }

  // Update the video document in Firestore
  await firestore
    .collection(videoCollectionId)
    .doc(videoId)
    .set(video, {merge: true}); // Use merge to avoid overwriting existing data

  return {success: true, message: "Video metadata updated successfully."};
});

export const getVideoMeta = onCall({maxInstances: 1}, async (request) => {
  const videoId = request.data.id;
  const snapshot =
    await firestore.collection(videoCollectionId).doc(videoId).get();
  return snapshot.data();
});
