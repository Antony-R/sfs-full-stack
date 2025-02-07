import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideoFromCloud, setupDirectories, uploadProcessedVideoToCloud } from "./storage";
import { isVideoNew, setVideo } from "./firestore";

const app = express();
app.use(express.json());

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