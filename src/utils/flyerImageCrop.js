export const FLYER_STANDARD_WIDTH = 1920;
export const FLYER_STANDARD_HEIGHT = 1080;
export const FLYER_ASPECT_RATIO = FLYER_STANDARD_WIDTH / FLYER_STANDARD_HEIGHT;
export const FLYER_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const OUTPUT_TYPE = "image/jpeg";
const OUTPUT_EXTENSION = "jpg";
const OUTPUT_QUALITY_STEPS = [0.92, 0.86, 0.8, 0.72];

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read the selected image."));
    image.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

const getFlyerFileName = (file) => {
  const baseName = (file?.name || "event-flyer")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${baseName || "event-flyer"}-${FLYER_STANDARD_WIDTH}x${FLYER_STANDARD_HEIGHT}.${OUTPUT_EXTENSION}`;
};

export const isStandardFlyerDimensions = ({ width, height } = {}) =>
  width === FLYER_STANDARD_WIDTH && height === FLYER_STANDARD_HEIGHT;

export const getImageFileDimensions = async (file) => {
  if (!file) {
    throw new Error("Please select an image file.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const createStandardFlyerFile = async (file, croppedAreaPixels) => {
  if (!file) {
    throw new Error("Please select an image file.");
  }

  if (!croppedAreaPixels) {
    throw new Error("Please crop the flyer before uploading.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to prepare the flyer image in this browser.");
    }

    const cropX = Math.max(0, Math.round(croppedAreaPixels.x));
    const cropY = Math.max(0, Math.round(croppedAreaPixels.y));
    const cropWidth = Math.max(1, Math.round(croppedAreaPixels.width));
    const cropHeight = Math.max(1, Math.round(croppedAreaPixels.height));

    canvas.width = FLYER_STANDARD_WIDTH;
    canvas.height = FLYER_STANDARD_HEIGHT;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      FLYER_STANDARD_WIDTH,
      FLYER_STANDARD_HEIGHT
    );

    let outputBlob = null;

    for (const quality of OUTPUT_QUALITY_STEPS) {
      outputBlob = await canvasToBlob(canvas, OUTPUT_TYPE, quality);

      if (!outputBlob) {
        continue;
      }

      if (outputBlob.size <= FLYER_MAX_UPLOAD_BYTES) {
        break;
      }
    }

    if (!outputBlob) {
      throw new Error("Unable to create the cropped flyer image.");
    }

    if (outputBlob.size > FLYER_MAX_UPLOAD_BYTES) {
      throw new Error("Cropped flyer is still larger than 5MB. Please choose a lighter image.");
    }

    return new File([outputBlob], getFlyerFileName(file), {
      type: OUTPUT_TYPE,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
