import { getAuth, getIdToken } from "firebase/auth";

const expressServerDomain = "https://short-film-streaming-service-787058692873.asia-south2.run.app";

export async function likeVideo(videoId: string) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const idToken = await getIdToken(user); // Get the Firebase ID token
      const response = await fetch(`${expressServerDomain}/like-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Send the token in the Authorization header
        },
        body: JSON.stringify({ videoId }),
      });
  
      if (!response.ok) {
        const errorData = await response.json(); // Get error details from the server
        throw new Error(errorData.message || "Failed to like video");
      }
  
      console.log("Video liked successfully");
    } else {
      throw new Error("User is not logged in");
    }

  } catch (error) {
    console.error("Error liking video:", error);
  }
}

export async function getLikesCount(videoId: string): Promise<number> {
  try {
    const response = await fetch(`${expressServerDomain}/likes-count?videoId=${videoId}`); // Make the API call

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.count; // Extract the count from the response
  } catch (error) {
    console.error("Error getting likes count:", error);
    return 0; // Or throw the error if you prefer
  }
}


export async function isVideoLikedByUser(videoId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const idToken = await getIdToken(user);

      const response = await fetch(`${expressServerDomain}/is-liked?videoId=${videoId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check like status");
      }

      const data = await response.json();
      console.log(`Is liked: ${data.liked}`);

      return data.liked; 
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
}
