import { deleteDraftStorageObject, uploadTempImage } from "@/services/eventService";

export const ORGANIZER_LOGO_CONSTRAINTS = {
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  allowedExtensions: ["png", "jpg", "jpeg", "webp"],
  maxBytes: 2 * 1024 * 1024,
  minWidth: 256,
  minHeight: 256,
  maxWidth: 4096,
  maxHeight: 4096,
  minAspectRatio: 0.75,
  maxAspectRatio: 4,
};

export const ORGANIZER_LOGO_HELP_TEXT =
  "PNG, WebP, or JPG. Square or horizontal, 256-4096px, max 2MB.";

const getFileExtension = (fileName = "") =>
  fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";

const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Logo image could not be read. Try a different image."));
    };

    image.src = objectUrl;
  });

export const validateOrganizerLogoFile = async (file) => {
  if (!file || !(file instanceof File)) {
    throw new Error("Choose a valid logo image.");
  }

  const extension = getFileExtension(file.name);
  const hasAllowedType = ORGANIZER_LOGO_CONSTRAINTS.allowedMimeTypes.includes(file.type);
  const hasAllowedExtension = ORGANIZER_LOGO_CONSTRAINTS.allowedExtensions.includes(extension);

  if (!hasAllowedType && !hasAllowedExtension) {
    throw new Error("Logo must be a PNG, WebP, JPG, or JPEG image.");
  }

  if (file.size > ORGANIZER_LOGO_CONSTRAINTS.maxBytes) {
    throw new Error("Logo must be 2MB or smaller.");
  }

  const dimensions = await readImageDimensions(file);
  const { width, height } = dimensions;

  if (
    width < ORGANIZER_LOGO_CONSTRAINTS.minWidth ||
    height < ORGANIZER_LOGO_CONSTRAINTS.minHeight
  ) {
    throw new Error("Logo must be at least 256 x 256 pixels.");
  }

  if (
    width > ORGANIZER_LOGO_CONSTRAINTS.maxWidth ||
    height > ORGANIZER_LOGO_CONSTRAINTS.maxHeight
  ) {
    throw new Error("Logo must be 4096 x 4096 pixels or smaller.");
  }

  const aspectRatio = width / height;
  if (
    aspectRatio < ORGANIZER_LOGO_CONSTRAINTS.minAspectRatio ||
    aspectRatio > ORGANIZER_LOGO_CONSTRAINTS.maxAspectRatio
  ) {
    throw new Error("Logo must be square or horizontal, not a tall portrait or banner.");
  }

  return dimensions;
};

export const uploadOrganizerLogo = async (organizerId, file) => {
  if (!organizerId) {
    throw new Error("Organizer ID is required to upload a logo.");
  }

  const dimensions = await validateOrganizerLogoFile(file);
  const upload = await uploadTempImage(file, "ORGANIZER_LOGO", organizerId);

  return {
    ...upload,
    dimensions,
  };
};

export const deleteOrganizerLogoUpload = async (storageKey) => {
  if (!storageKey) return;
  await deleteDraftStorageObject(storageKey, "ORGANIZER_LOGO");
};
