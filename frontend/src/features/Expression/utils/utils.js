import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

const VISION_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm";
const MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const LANDMARKS = {
  eyeLeftTop: 159,
  eyeLeftBottom: 145,
  eyeLeftOuter: 33,
  eyeLeftInner: 133,
  eyeRightTop: 386,
  eyeRightBottom: 374,
  eyeRightOuter: 263,
  eyeRightInner: 362,
  browLeftTop: 70,
  browLeftInner: 107,
  browLeftBottom: 105,
  browRightTop: 300,
  browRightInner: 336,
  browRightBottom: 334,
  lipInnerTop: 13,
  lipInnerBottom: 14,
  lipLeftCorner: 61,
  lipRightCorner: 291,
  noseTip: 1,
  chin: 152,
  forehead: 10
};

const getDistance = (p1, p2) => {
  if (!p1 || !p2) return 0;
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
};

export const init = async ({ landmarkerRef, videoRef, streamRef }) => {
  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(VISION_WASM_URL);

    landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "GPU" },
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
      runningMode: "VIDEO",
      numFaces: 1
    });

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Browser does not support media device capture streams.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
        frameRate: { ideal: 30 }
      },
      audio: false
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => resolve(true);
      });
      await videoRef.current.play();
    }

    return { error: null };
  } catch (error) {
    console.error("Initialization failure:", error);
    return {
      error: "Camera or Model Initialization Failed.",
      helpText: error.message || "Please check camera permissions and reload."
    };
  }
};

export const detect = ({ landmarkerRef, videoRef }) => {
  const landmarker = landmarkerRef.current;
  const video = videoRef.current;

  if (!landmarker || !video || video.paused || video.ended) return null;

  const timestamp = performance.now();
  const result = landmarker.detectForVideo(video, timestamp);

  if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
    return null;
  }

  const lm = result.faceLandmarks[0];

  const faceHeight = getDistance(lm[LANDMARKS.forehead], lm[LANDMARKS.chin]);
  const faceWidth = getDistance(lm[LANDMARKS.eyeLeftOuter], lm[LANDMARKS.eyeRightOuter]);
  const baseScale = (faceHeight + faceWidth) / 2;

  if (baseScale === 0) return null;

  const mouthWidth = getDistance(lm[LANDMARKS.lipLeftCorner], lm[LANDMARKS.lipRightCorner]) / baseScale;
  const mouthOpenness = getDistance(lm[LANDMARKS.lipInnerTop], lm[LANDMARKS.lipInnerBottom]) / baseScale;

  const mouthCenterY = (lm[LANDMARKS.lipInnerTop].y + lm[LANDMARKS.lipInnerBottom].y) / 2;
  const leftCornerHeight = (mouthCenterY - lm[LANDMARKS.lipLeftCorner].y) / baseScale;
  const rightCornerHeight = (mouthCenterY - lm[LANDMARKS.lipRightCorner].y) / baseScale;
  const smileCurvature = (leftCornerHeight + rightCornerHeight) / 2;

  const leftCheekCompression = getDistance(lm[LANDMARKS.eyeLeftBottom], lm[LANDMARKS.lipLeftCorner]) / baseScale;
  const rightCheekCompression = getDistance(lm[LANDMARKS.eyeRightBottom], lm[LANDMARKS.lipRightCorner]) / baseScale;
  const averageCheekDistance = (leftCheekCompression + rightCheekCompression) / 2;

  const leftEyeOpenness = getDistance(lm[LANDMARKS.eyeLeftTop], lm[LANDMARKS.eyeLeftBottom]) / baseScale;
  const rightEyeOpenness = getDistance(lm[LANDMARKS.eyeRightTop], lm[LANDMARKS.eyeRightBottom]) / baseScale;
  const averageEyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;

  const leftBrowDist = getDistance(lm[LANDMARKS.browLeftTop], lm[LANDMARKS.eyeLeftBottom]) / baseScale;
  const rightBrowDist = getDistance(lm[LANDMARKS.browRightTop], lm[LANDMARKS.eyeRightBottom]) / baseScale;
  const eyebrowElevation = (leftBrowDist + rightBrowDist) / 2;
  const innerBrowDistance = getDistance(lm[LANDMARKS.browLeftInner], lm[LANDMARKS.browRightInner]) / baseScale;

  let happyScore = 0;
  let sadScore = 0;
  let romanticScore = 0;
  let surprisedScore = 0;

  if (smileCurvature > 0.006 || mouthWidth > 0.36) {
    const smileFactor = Math.max(0, (smileCurvature - 0.006) * 35);
    const widthFactor = Math.max(0, (mouthWidth - 0.36) * 5);
    const cheekFactor = averageCheekDistance < 0.41 ? (0.41 - averageCheekDistance) * 15 : 0;
    happyScore = Math.min(1.0, (smileFactor + widthFactor + cheekFactor));
  }

  const isFrowning = smileCurvature < -0.002;
  const eyesDrooping = averageEyeOpenness < 0.054;
  const browsKnitted = innerBrowDistance < 0.145;

  if (isFrowning || (eyesDrooping && browsKnitted)) {
    const frownFactor = isFrowning ? Math.abs(smileCurvature + 0.002) * 45 : 0;
    const droopFactor = eyesDrooping ? (0.054 - averageEyeOpenness) * 20 : 0;
    const browFactor = browsKnitted ? (0.145 - innerBrowDistance) * 8 : 0;
    sadScore = Math.min(1.0, (frownFactor + droopFactor + browFactor + 0.1));
  }

  if (eyebrowElevation > 0.22 && averageEyeOpenness > 0.072 && mouthOpenness > 0.07) {
    const browFactor = (eyebrowElevation - 0.22) * 12;
    const eyeFactor = (averageEyeOpenness - 0.072) * 25;
    const mouthFactor = (mouthOpenness - 0.07) * 9;
    surprisedScore = Math.min(1.0, (browFactor + eyeFactor + mouthFactor) / 3);
  }

  if (smileCurvature > 0.002 && smileCurvature <= 0.015 && averageEyeOpenness < 0.048) {
    const softSmileFactor = (smileCurvature - 0.002) * 20;
    const relaxedEyeFactor = (0.048 - averageEyeOpenness) * 30;
    romanticScore = Math.min(1.0, (softSmileFactor + relaxedEyeFactor));
  }

  const rawScores = {
    "😊 Happy": happyScore,
    "😢 Sad": sadScore,
    "😍 Romantic": romanticScore,
    "😲 Surprised": surprisedScore
  };

  let bestEmotion = "😐 Neutral";
  let maxConfidence = 0;

  Object.entries(rawScores).forEach(([emo, score]) => {
    if (score > maxConfidence) {
      maxConfidence = score;
      bestEmotion = emo;
    }
  });

  if (maxConfidence < 0.22) {
    bestEmotion = "😐 Neutral";
    maxConfidence = 1.0 - Math.max(happyScore, sadScore, romanticScore, surprisedScore);
  }

  return {
    emotion: bestEmotion,
    confidence: maxConfidence,
    scores: rawScores
  };
};

export class EmotionSmoother {
  constructor(windowSize = 8) {
    this.windowSize = windowSize;
    this.history = [];
    this.scoreBuffer = [];
  }

  push(emotion, scores) {
    this.history.push(emotion);
    this.scoreBuffer.push(scores);
    if (this.history.length > this.windowSize) {
      this.history.shift();
      this.scoreBuffer.shift();
    }
  }

  getStableEmotion(minAgreementCount = 4) {
    if (this.history.length === 0) return null;
    const frequencyMap = {};
    let dominantEmotion = null;
    let maxCount = 0;
    this.history.forEach((emo) => {
      frequencyMap[emo] = (frequencyMap[emo] || 0) + 1;
      if (frequencyMap[emo] > maxCount) {
        maxCount = frequencyMap[emo];
        dominantEmotion = emo;
      }
    });
    if (maxCount >= minAgreementCount && dominantEmotion !== "😐 Neutral") {
      return dominantEmotion;
    }
    return null;
  }

  reset() {
    this.history = [];
    this.scoreBuffer = [];
  }
}

export const getMoodValue = (fullEmotion) => {
  if (!fullEmotion) return "neutral";

  const mapping = {
    "😊 Happy": "happy",
    "😢 Sad": "sad",
    "😍 Romantic": "romantic",
    "😲 Surprised": "surprised",
    "😠 Angry": "angry",
    "😨 Fearful": "fearful",
    "😐 Neutral": "neutral"
  };

  // Direct lookup first
  if (mapping[fullEmotion]) return mapping[fullEmotion];

  // Fallback: match by lowercase keyword
  const lower = fullEmotion.toLowerCase();
  if (lower.includes("happy")) return "happy";
  if (lower.includes("sad")) return "sad";
  if (lower.includes("romantic")) return "romantic";
  if (lower.includes("surprised")) return "surprised";
  if (lower.includes("angry")) return "angry";
  if (lower.includes("fearful")) return "fearful";
  if (lower.includes("neutral")) return "neutral";

  return "neutral";
};
