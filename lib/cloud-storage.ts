import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFirebaseApp } from "./firebase"
import { doc, setDoc, getDb, getDoc } from "./firestore"

let storageInstance: any = null

export const getStorageInstance = () => {
  if (!storageInstance) {
    const app = getFirebaseApp()
    storageInstance = getStorage(app)
  }
  return storageInstance
}

/**
 * Store image in Firestore with chunking if needed (to stay under 1MB limit)
 */
async function storeImageInFirestore(
  imageDataUrl: string,
  venueId: string,
  index: number
): Promise<string> {
  try {
    const db = getDb()

    // First try to compress aggressively for Firestore
    let compressedDataUrl = imageDataUrl
    try {
      compressedDataUrl = await compressImageForFirestore(imageDataUrl)
      console.log(`Compressed image ${index + 1}: ${imageDataUrl.length} -> ${compressedDataUrl.length} chars`)
    } catch (compressionError) {
      console.warn(`Could not compress image ${index + 1} for Firestore:`, compressionError)
      compressedDataUrl = imageDataUrl
    }

    const imageId = `${venueId}_image_${index}_${Date.now()}`
    const imageDocRef = doc(db, "venue_images", imageId)
    const dataSize = compressedDataUrl.length
    const maxSize = 1048487 // Firestore document size limit minus overhead

    console.log(`Storing image ${index + 1} in Firestore (size: ${dataSize} bytes)`)

    // If data is still too large, use chunking
    if (dataSize > maxSize) {
      console.log(`Image ${index + 1} is too large (${dataSize} > ${maxSize}), using chunking...`)
      const chunkSize = 900000 // Stay well under 1MB per chunk
      const chunks = []

      for (let i = 0; i < compressedDataUrl.length; i += chunkSize) {
        chunks.push(compressedDataUrl.substring(i, i + chunkSize))
      }

      console.log(`Split image ${index + 1} into ${chunks.length} chunks`)

      // Store chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkDocRef = doc(db, "venue_images", `${imageId}_chunk_${i}`)
        await setDoc(chunkDocRef, {
          venueId,
          imageIndex: index,
          chunkIndex: i,
          totalChunks: chunks.length,
          data: chunks[i],
          uploadedAt: new Date().toISOString(),
          isChunk: true,
        })
      }

      // Store metadata
      await setDoc(imageDocRef, {
        venueId,
        index,
        uploadedAt: new Date().toISOString(),
        isFirestoreStorage: true,
        isChunked: true,
        chunkCount: chunks.length,
        originalSize: imageDataUrl.length,
        compressedSize: dataSize,
      })

      console.log(`Successfully stored chunked image ${index + 1} in Firestore`)
      return `firestore://${imageId}`
    }

    // Store normally if under limit
    await setDoc(imageDocRef, {
      venueId,
      index,
      data: compressedDataUrl,
      uploadedAt: new Date().toISOString(),
      isFirestoreStorage: true,
      isChunked: false,
      originalSize: imageDataUrl.length,
      compressedSize: dataSize,
    })

    console.log(`Successfully stored image ${index + 1} in Firestore`)
    return `firestore://${imageId}`
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error storing image ${index} in Firestore:`, errorMessage)
    throw new Error(`Failed to store image ${index + 1} in database: ${errorMessage}`)
  }
}

/**
 * Convert base64/data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream"
  const bstr = atob(arr[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Compress image by drawing to canvas - with aggressive compression for Firestore fallback
 */
async function compressImage(dataUrl: string, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      const timeout = setTimeout(() => {
        reject(new Error("Image compression timeout"))
      }, 5000)

      img.onload = () => {
        clearTimeout(timeout)
        try {
          const canvas = document.createElement("canvas")
          const maxWidth = 1600
          const maxHeight = 1200
          let width = img.width
          let height = img.height

          // Calculate dimensions to fit within maxWidth x maxHeight
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("Could not get canvas context")

          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", quality))
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = () => {
        clearTimeout(timeout)
        reject(new Error("Failed to load image"))
      }

      img.src = dataUrl
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Aggressively compress image for Firestore storage (smaller size)
 */
async function compressImageForFirestore(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      const timeout = setTimeout(() => {
        reject(new Error("Image compression timeout"))
      }, 5000)

      img.onload = () => {
        clearTimeout(timeout)
        try {
          const canvas = document.createElement("canvas")
          // More aggressive dimensions for Firestore
          const maxWidth = 800
          const maxHeight = 600
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("Could not get canvas context")

          ctx.drawImage(img, 0, 0, width, height)
          // Much lower quality for Firestore
          resolve(canvas.toDataURL("image/jpeg", 0.5))
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = () => {
        clearTimeout(timeout)
        reject(new Error("Failed to load image"))
      }

      img.src = dataUrl
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Upload an image to Cloud Storage with retry and Firestore fallback
 * @param imageDataUrl - Base64 data URL of the image
 * @param venueId - ID to organize the upload
 * @param index - Image index for naming
 */
export async function uploadImage(
  imageDataUrl: string,
  venueId: string,
  index: number
): Promise<string> {
  // Try uploading to Storage first, with retry
  try {
    const storage = getStorageInstance()

    // Try to compress image, but fall back to original if compression fails
    let dataUrlToUpload = imageDataUrl
    try {
      dataUrlToUpload = await compressImage(imageDataUrl, 0.75)
    } catch (compressionError) {
      console.warn("Image compression failed, uploading original:", compressionError)
      dataUrlToUpload = imageDataUrl
    }

    const blob = dataUrlToBlob(dataUrlToUpload)
    if (!blob || blob.size === 0) {
      throw new Error("Image blob is empty or invalid")
    }

    const fileName = `${venueId}_image_${index}_${Date.now()}.jpg`
    const fileRef = ref(storage, `venues/${venueId}/images/${fileName}`)

    console.log(`Uploading image ${index + 1}: ${fileName} (size: ${blob.size} bytes)`)

    // Upload with 30 second timeout
    const uploadPromise = uploadBytes(fileRef, blob)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout (30s)")), 30000)
    )

    await Promise.race([uploadPromise, timeoutPromise])
    const downloadUrl = await getDownloadURL(fileRef)
    console.log(`Successfully uploaded image ${index + 1} to Storage: ${downloadUrl}`)
    return downloadUrl
  } catch (storageError) {
    const errorMessage = storageError instanceof Error ? storageError.message : String(storageError)
    console.warn(`Storage upload failed for image ${index + 1}: ${errorMessage}`)
    console.log(`Falling back to Firestore storage for image ${index + 1}...`)

    // Fallback to Firestore storage
    try {
      const firestoreUrl = await storeImageInFirestore(imageDataUrl, venueId, index)
      return firestoreUrl
    } catch (firestoreError) {
      const firestoreErrorMessage = firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
      console.error(`Both Storage and Firestore uploads failed for image ${index}:`, firestoreErrorMessage)
      throw new Error(`Failed to upload image ${index + 1}: ${firestoreErrorMessage}`)
    }
  }
}

/**
 * Store video in Firestore with chunking if needed
 */
async function storeVideoInFirestore(
  videoDataUrl: string,
  venueId: string,
  index: number
): Promise<string> {
  try {
    const db = getDb()
    const videoId = `${venueId}_video_${index}_${Date.now()}`
    const videoDocRef = doc(db, "venue_videos", videoId)
    const dataSize = videoDataUrl.length
    const maxSize = 1048487 // Firestore document size limit minus overhead

    console.log(`Storing video ${index + 1} in Firestore (size: ${dataSize} bytes)`)

    // Videos are typically large, use chunking
    if (dataSize > maxSize) {
      console.log(`Video ${index + 1} is too large (${dataSize} > ${maxSize}), using chunking...`)
      const chunkSize = 900000 // Stay well under 1MB per chunk
      const chunks = []

      for (let i = 0; i < videoDataUrl.length; i += chunkSize) {
        chunks.push(videoDataUrl.substring(i, i + chunkSize))
      }

      console.log(`Split video ${index + 1} into ${chunks.length} chunks`)

      // Store chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkDocRef = doc(db, "venue_videos", `${videoId}_chunk_${i}`)
        await setDoc(chunkDocRef, {
          venueId,
          videoIndex: index,
          chunkIndex: i,
          totalChunks: chunks.length,
          data: chunks[i],
          uploadedAt: new Date().toISOString(),
          isChunk: true,
        })
      }

      // Store metadata
      await setDoc(videoDocRef, {
        venueId,
        index,
        uploadedAt: new Date().toISOString(),
        isFirestoreStorage: true,
        isChunked: true,
        chunkCount: chunks.length,
      })

      console.log(`Successfully stored chunked video ${index + 1} in Firestore`)
      return `firestore://${videoId}`
    }

    // Store normally if under limit
    await setDoc(videoDocRef, {
      venueId,
      index,
      data: videoDataUrl,
      uploadedAt: new Date().toISOString(),
      isFirestoreStorage: true,
      isChunked: false,
    })

    console.log(`Successfully stored video ${index + 1} in Firestore`)
    return `firestore://${videoId}`
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error storing video ${index} in Firestore:`, errorMessage)
    throw new Error(`Failed to store video ${index + 1} in database: ${errorMessage}`)
  }
}

/**
 * Upload a video to Cloud Storage with retry and Firestore fallback
 * @param videoDataUrl - Base64 data URL of the video
 * @param venueId - ID to organize the upload
 * @param index - Video index for naming
 */
export async function uploadVideo(
  videoDataUrl: string,
  venueId: string,
  index: number
): Promise<string> {
  // Try uploading to Storage first
  try {
    const storage = getStorageInstance()
    const blob = dataUrlToBlob(videoDataUrl)

    if (!blob || blob.size === 0) {
      throw new Error("Video blob is empty or invalid")
    }

    const fileName = `${venueId}_video_${index}_${Date.now()}.mp4`
    const fileRef = ref(storage, `venues/${venueId}/videos/${fileName}`)

    console.log(`Uploading video ${index + 1}: ${fileName} (size: ${blob.size} bytes)`)

    // Upload with 60 second timeout for videos
    const uploadPromise = uploadBytes(fileRef, blob)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout (60s)")), 60000)
    )

    await Promise.race([uploadPromise, timeoutPromise])
    const downloadUrl = await getDownloadURL(fileRef)
    console.log(`Successfully uploaded video ${index + 1} to Storage: ${downloadUrl}`)
    return downloadUrl
  } catch (storageError) {
    const errorMessage = storageError instanceof Error ? storageError.message : String(storageError)
    console.warn(`Storage upload failed for video ${index + 1}: ${errorMessage}`)
    console.log(`Falling back to Firestore storage for video ${index + 1}...`)

    // Fallback to Firestore storage
    try {
      const firestoreUrl = await storeVideoInFirestore(videoDataUrl, venueId, index)
      return firestoreUrl
    } catch (firestoreError) {
      const firestoreErrorMessage = firestoreError instanceof Error ? firestoreError.message : String(firestoreError)
      console.error(`Both Storage and Firestore uploads failed for video ${index}:`, firestoreErrorMessage)
      throw new Error(`Failed to upload video ${index + 1}: ${firestoreErrorMessage}`)
    }
  }
}

/**
 * Upload multiple images in parallel
 */
export async function uploadImages(
  imageDataUrls: string[],
  venueId: string
): Promise<string[]> {
  const uploadPromises = imageDataUrls.map((url, index) =>
    uploadImage(url, venueId, index)
  )
  return Promise.all(uploadPromises)
}

/**
 * Upload multiple videos in parallel
 */
export async function uploadVideos(
  videoDataUrls: string[],
  venueId: string
): Promise<string[]> {
  const uploadPromises = videoDataUrls.map((url, index) =>
    uploadVideo(url, venueId, index)
  )
  return Promise.all(uploadPromises)
}

/**
 * Retrieve an image from Firestore (handles chunked and non-chunked)
 */
export async function getImageFromFirestore(imageId: string): Promise<string | null> {
  try {
    const db = getDb()
    const imageDocRef = doc(db, "venue_images", imageId)
    const docSnap = await getDoc(imageDocRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()

    // If not chunked, return data directly
    if (!data.isChunked) {
      return data.data || null
    }

    // If chunked, reassemble from chunks
    const chunks = []
    for (let i = 0; i < data.chunkCount; i++) {
      const chunkDocRef = doc(db, "venue_images", `${imageId}_chunk_${i}`)
      const chunkSnap = await getDoc(chunkDocRef)
      if (chunkSnap.exists()) {
        chunks.push(chunkSnap.data().data)
      }
    }

    if (chunks.length === data.chunkCount) {
      return chunks.join("")
    }

    console.warn(`Could not retrieve all chunks for image ${imageId}`)
    return null
  } catch (error) {
    console.error("Error retrieving image from Firestore:", error)
    return null
  }
}

/**
 * Retrieve a video from Firestore (handles chunked and non-chunked)
 */
export async function getVideoFromFirestore(videoId: string): Promise<string | null> {
  try {
    const db = getDb()
    const videoDocRef = doc(db, "venue_videos", videoId)
    const docSnap = await getDoc(videoDocRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()

    // If not chunked, return data directly
    if (!data.isChunked) {
      return data.data || null
    }

    // If chunked, reassemble from chunks
    const chunks = []
    for (let i = 0; i < data.chunkCount; i++) {
      const chunkDocRef = doc(db, "venue_videos", `${videoId}_chunk_${i}`)
      const chunkSnap = await getDoc(chunkDocRef)
      if (chunkSnap.exists()) {
        chunks.push(chunkSnap.data().data)
      }
    }

    if (chunks.length === data.chunkCount) {
      return chunks.join("")
    }

    console.warn(`Could not retrieve all chunks for video ${videoId}`)
    return null
  } catch (error) {
    console.error("Error retrieving video from Firestore:", error)
    return null
  }
}
