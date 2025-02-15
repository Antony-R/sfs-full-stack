import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideoFromCloud, setupDirectories, uploadProcessedVideoToCloud } from "./storage";
import { getLikesCount, isLiked, isVideoNew, setVideo, syncLikeOrDislikeToFirestore, verifyUserToken } from "./firestore";

const app = express();
app.use(express.json());

const cors = require('cors');
// ... other middleware ...

const allowedOrigins = [
  process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'http://localhost:3000', // For local development and NextAuth
  process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000',  // For Vercel deployments
  'http://localhost:3000', // explicitly add localhost since it may not be in the environment variables sometimes
  'https://sfs-web-client-image-787058692873.asia-south2.run.app'
];

app.use(
  cors({
    origin: function (origin: any, callback: any) {
      if (!origin || allowedOrigins.includes(origin)) { // Allow requests without origin (like Postman)
        callback(null, true);
      } else {
        console.error("CORS Error: Origin not allowed:", origin); // Log the blocked origin
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);


setupDirectories();

app.post("/process-video", async (req, res) => {
    //Get the bucket and file name from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error("Invalid message payload received");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send("Bad Request: missing filename");
        return;
    }

    const inputFileName = data.name; //Format of <UID>-<DATE>.<EXTENSION>
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];

    if (!isVideoNew(videoId)) {
        res.status(400).send('Bad Request: video already processing or processed');
        return;
    } else {
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status: 'processing'
        });
    }

    //Download raw video from cloud storage
    await downloadRawVideoFromCloud(inputFileName);

    //Process
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (err) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        res.status(500).send("Internal Server Error: video processing failed");
        return;
    }

    //Upload processed video to cloud storage
    await uploadProcessedVideoToCloud(outputFileName);

    //update meta data
    await setVideo(videoId, {
        status: 'processed',
        fileName: outputFileName
    });

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    res.status(200).send("Video processing completed");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(
        `Short Film Streaming service listening at https://localhost:${port}`
    );
});

app.post("/like-video", async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split("Bearer ")[1]; // Extract the token
  
      if (!idToken) {
        res.status(401).json({ message: "Unauthorized: Missing token" });
        return;
      }

      const decodedToken = await verifyUserToken(idToken); // Verify the token
      const userId = decodedToken.uid; // Get the userId from the decoded token
      const videoId = req.body.videoId; // Get videoId from the request body
  
      if (!videoId) {
          res.status(400).json({message: "Bad Request: Missing videoId"});
          return;
      }
  
  
      // Now you have userId and videoId, proceed with your logic (e.g., update Firestore)
      console.log("User ID:", userId);
      console.log("Video ID:", videoId);
  
      // ... your Firestore logic to like the video ...
      const likesCount = await syncLikeOrDislikeToFirestore(userId, videoId);
  
      res.status(200).json({ message: "Video liked successfully" , count: likesCount});
    } catch (error: any) {
        console.error("Error liking video:", error);
  
        if (error?.code === 'auth/invalid-token'){
            res.status(401).json({message: "Unauthorized: Invalid token"});
            return;
        }
  
      res.status(500).json({ message: "Internal server error" }); // Generic error response
    }
  });

app.get("/likes-count", async (req, res) => {
    try {
        const videoId = typeof req.query.videoId === 'string' ? req.query.videoId : undefined;

        if (!videoId) {
            res.status(400).json({ message: "Bad Request: Missing videoId" });
            return;
        }

        const likesCount = await getLikesCount(videoId);

        res.status(200).json({ count: likesCount });

    } catch (error) {
        console.error("Error getting likes count:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/is-liked", async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) {
      res.status(401).json({ message: "Unauthorized: Missing token" });
      return;
    }

    const decodedToken = await verifyUserToken(idToken); 
    const userId = decodedToken.uid; // Get the user ID

    const videoId = typeof req.query.videoId === 'string' ? req.query.videoId : undefined;

    if (!videoId) {
      res.status(400).json({ message: "Bad Request: Missing videoId" });
      return;
    }

    res.status(200).json({ liked: await isLiked(videoId, userId) });

  } catch (error: any) {
    console.error("Error checking like status:", error);

    if (error?.code === 'auth/invalid-token') {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return;
    }

    res.status(500).json({ message: "Internal server error" });
  }
});