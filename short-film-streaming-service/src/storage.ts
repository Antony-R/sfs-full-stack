import { Storage } from "@google-cloud/storage";
import { upload } from "@google-cloud/storage/build/cjs/src/resumable-upload";
import { dir } from "console";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { resolve } from "path";

const storage = new Storage();

const rawVideoCloudBucketName = "sfs-raw-videos";
const processedVideoCloudBucketName = "sfs-processed-videos";

const localRawVideoDirPath = "./raw-videos";
const localProcessedVideoDirPath = "./processed-videos";

// Creates the local directories in the container for raw and processed videos
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoDirPath);
    ensureDirectoryExistence(localProcessedVideoDirPath);
}

// @returns A promise that resolves when the video has been converted
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoDirPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale=-1:360")
        .on("end", () => {
            console.log("Ffmpeg video processing completed");
            resolve();
        })
        .on("error", (err) => {
            console.log(`Internal server error: ${err}`);
            reject(err);
        })
        .save(`${localProcessedVideoDirPath}/${processedVideoName}`)
    });
        
}

export async function downloadRawVideoFromCloud(rawVideoName: string) {
    await storage.bucket(rawVideoCloudBucketName)
        .file(rawVideoName)
        .download({destination: `${localRawVideoDirPath}/${rawVideoName}`});

    console.log(`gs://${rawVideoCloudBucketName}/${rawVideoName} downloaded to ${localRawVideoDirPath}/${rawVideoName}`);
}

export async function uploadProcessedVideoToCloud(processedVideoName: string) {
    const from = `${localProcessedVideoDirPath}/${processedVideoName}`;
    const bucket = storage.bucket(processedVideoCloudBucketName);

    await bucket.upload(from, {destination: processedVideoName});
    await bucket.file(processedVideoName).makePublic();

    console.log(`${from} uploaded to gs://${processedVideoCloudBucketName}/${processedVideoName}`);
}

export function deleteRawVideo(fileName: string) {
    return deleteLocalFile(`${localRawVideoDirPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string) {
    return deleteLocalFile(`${localProcessedVideoDirPath}/${fileName}`);
}

function deleteLocalFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`);
                    reject(err);
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete`);
            resolve();
        }
    });
}

function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true}); //recursive: true creates nested path
        console.log(`Directory created at ${dirPath}`);
    }
}