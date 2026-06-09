import { buildUrl, apiFetch } from "@/config/api";

// -------- S3 Storage Upload Helpers (internal) --------
const DRAFT_MEDIA_TYPE_BY_FOLDER = {
  flyer: "EVENT_FLYER",
  flyers: "EVENT_FLYER",
  cover: "EVENT_FLYER",
  gallery: "EVENT_GALLERY",
  general: "EVENT_GALLERY",
};

const normalizeUploadMetadata = (payload = {}) => {
  const data = payload.data || payload;
  const key = data.key || data.storageKey || data.publicId || "";
  const url = data.url || data.publicUrl || "";

  return {
    ...data,
    url,
    publicUrl: data.publicUrl || url,
    key,
    storageKey: key,
    publicId: key,
    raw: payload,
  };
};

const getFileExtension = (fileName = "") =>
  fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";

const validateFileAgainstConstraints = (file, constraints = {}) => {
  const allowedTypes = constraints.allowedMimeTypes || ["image/jpeg", "image/png", "image/webp"];
  const allowedExtensions = constraints.allowedExtensions || ["jpg", "jpeg", "png", "webp"];
  const maxBytes = constraints.maxBytes || 5_000_000;
  const extension = getFileExtension(file.name || "");

  if (file.size > maxBytes) {
    throw new Error(`File too large. Max ${(maxBytes / 1_000_000).toFixed(0)}MB allowed.`);
  }

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file format. Allowed: ${allowedExtensions.join(", ")}`);
  }
};

async function requestStorageUpload({ file, mediaType, entityId = null, draft = false }) {
  if (!file || !(file instanceof File)) {
    throw new Error("Valid file is required");
  }

  const response = await apiFetch(buildUrl("/api/storage/uploads/presign"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaType,
      entityId,
      draft,
      fileName: file.name || "upload",
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
  });

  return response?.data || response;
}

async function uploadToStorage(file, presign) {
  validateFileAgainstConstraints(file, presign.constraints);

  const upload = presign.upload || {};
  if (!upload.url || !upload.method) {
    throw new Error("Upload URL was not returned by the server.");
  }

  const res = await fetch(upload.url, {
    method: upload.method,
    headers: upload.headers || {},
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Upload failed");
  }
}

async function completeStorageUpload({ mediaType, entityId = null, key }) {
  const response = await apiFetch(buildUrl("/api/storage/uploads/complete"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mediaType,
      entityId,
      key,
    }),
  });

  return normalizeUploadMetadata(response);
}

async function uploadFileToStorage(file, { mediaType, entityId = null, draft = false }) {
  const presign = await requestStorageUpload({ file, mediaType, entityId, draft });
  await uploadToStorage(file, presign);
  return completeStorageUpload({
    mediaType,
    entityId,
    key: presign.key || presign.storageKey || presign.publicId,
  });
}

/**
 * Upload an image to S3. Returns { url, key, publicId, raw } without persisting.
 */
export async function uploadTempImage(file, type, entityId) {
  if (!file || !(file instanceof File)) {
    throw new Error("Valid image file is required");
  }

  if (!type || !entityId) {
    throw new Error("type and entityId are required for uploads");
  }

  return uploadFileToStorage(file, { mediaType: type, entityId, draft: false });
}

/**
 * Upload an image to a draft folder without requiring an event.
 * Returns { url, key, publicId, raw }.
 */
export async function uploadDraftImage(file, subfolder = "general") {
  if (!file || !(file instanceof File)) {
    throw new Error("Valid image file is required");
  }

  const mediaType = DRAFT_MEDIA_TYPE_BY_FOLDER[subfolder] || "EVENT_GALLERY";
  return uploadFileToStorage(file, { mediaType, draft: true });
}

/**
 * Persist an already-uploaded flyer URL/key to backend.
 */
export async function persistFlyerUrl(eventId, flyer) {
  if (!eventId) throw new Error("Event ID is required");
  if (!flyer) throw new Error("Flyer data is required");

  const imageUrl = flyer.imageUrl || flyer.url;
  const storageKey = flyer.storageKey || flyer.key || flyer.publicId;

  if (!imageUrl) throw new Error("Flyer imageUrl is required");
  if (!storageKey) throw new Error("Flyer storageKey is required");

  const url = buildUrl(`/api/event/update-flyer/${eventId}`);
  const payload = {
    url: imageUrl,
    key: storageKey,
    storageKey,
    publicId: storageKey,
    type: "EVENT_FLYER",
  };

  console.log("Persisting flyer metadata to backend:", payload);

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res;
}

/**
 * Delete an uploaded storage object via backend ownership checks.
 */
export async function deleteStorageObject(key, type = null) {
  if (!key || typeof key !== "string") {
    return;
  }

  const payload = { key, storageKey: key, publicId: key };
  if (type) payload.mediaType = type;

  try {
    await apiFetch(buildUrl("/api/storage/uploads/object"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Failed to delete uploaded storage object", key, err?.message);
  }
}

export const deleteDraftStorageObject = deleteStorageObject;

/**
 * Upload Artist Image.
 * Returns normalized shape: { data: { image: <url>, url: <url>, publicId: <key> } }
 */
export async function uploadArtistImage(eventId, file) {
  if (!eventId) throw new Error("Event ID is required");
  if (!file || !(file instanceof File)) throw new Error("Valid artist image file is required");

  const upload = await uploadTempImage(file, "ARTIST_IMAGE", eventId);

  return {
    data: {
      image: upload.url,
      url: upload.url,
      key: upload.key,
      storageKey: upload.storageKey,
      publicId: upload.publicId,
    },
  };
}

export async function uploadSponsorLogo(eventId, file) {
  if (!eventId) throw new Error("Event ID is required");
  if (!file || !(file instanceof File)) throw new Error("Valid sponsor logo file is required");

  const upload = await uploadTempImage(file, "SPONSOR_LOGO", eventId);

  return {
    data: {
      image: upload.url,
      url: upload.url,
      key: upload.key,
      storageKey: upload.storageKey,
      publicId: upload.publicId,
    },
  };
}

/**
 * Persist already-uploaded gallery URLs/keys to backend.
 */
export async function persistGalleryUrls(eventId, images) {
  if (!eventId) throw new Error("Event ID is required");
  if (!images || images.length === 0) throw new Error("At least one gallery image is required");

  const url = buildUrl(`/api/event/${eventId}/images`);
  const payload = images.map((img) => ({
    url: img.url,
    key: img.storageKey || img.key || img.publicId,
    storageKey: img.storageKey || img.key || img.publicId,
    publicId: img.storageKey || img.key || img.publicId,
    type: img.type || "EVENT_GALLERY",
  }));

  console.log("Persisting gallery metadata to backend:", payload);

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res;
}
/**
 * Create event - Step 1: Basic Details
 * 
 * API Endpoint: POST /api/event/create-event
 * 
 * Request Body (FormData):
 * - eventId: string (generated unique ID)
 * - eventType: string (e.g., "Exclusive Event", "Guest List Event", "Non-Exclusive Event")
 * - eventTitle: string (event name)
 * - mainCategory: string (e.g., "Music", "Workshop")
 * - subcategory: string (e.g., "Bollywood", "Hip Hop")
 * - description: string (event description)
 * - flyerImage: File (cover image - will be uploaded to cloud)
 * - galleryImages: File[] (multiple gallery images - will be uploaded to cloud)
 * 
 * Expected Response:
 * {
 *   success: boolean,
 *   eventId: string,
 *   flyerImageUrl: string (cloud URL),
 *   galleryImageUrls: string[] (cloud URLs),
 *   message: string
 * }
 * 
 * @param {Object} eventData - Event data to send
 * @returns {Promise<Object>} Response with event ID and image URLs
 */
export async function createEventStep1(eventData) {
  const url = buildUrl("/api/event/create-event");

  // Backend only allows core fields: title, description, category, subCategory, type (optional)
  const jsonData = {
    title: eventData.eventTitle,
    description: eventData.description || "",
    category: eventData.mainCategory,
    subCategory: eventData.subcategory,
  };

  if (eventData.eventType) {
    jsonData.type = eventData.eventType;
  }

  console.log("📤 Sending as JSON:", jsonData);

  const response = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify(jsonData),
  });

  return response;
}

/**
 * Update event - Step 1: Basic Details (when editing existing event)
 * 
 * API Endpoint: PATCH /api/event/update-event/:eventId
 * 
 * @param {string} eventId - Event ID to update
 * @param {Object} eventData - Event data to update
 * @returns {Promise<Object>} Updated event response
 */
export async function updateEventStep1(eventId, eventData) {
  const url = buildUrl(`/api/event/update-event/${eventId}`);
  console.log("🔄 Updating Event Step 1 - Basic Details");
  console.log("📋 Event ID:", eventId);
  console.log("🔗 Request URL:", url);
  
  // Validate eventId
  if (!eventId) {
    throw new Error("Event ID is required");
  }
  
  // Validate required fields
  if (!eventData.eventTitle || eventData.eventTitle.trim() === "") {
    throw new Error("Event title is required");
  }
  
  // Check if NEW images are included (use FormData) or just JSON
  const hasNewImages = eventData.flyerImage || (eventData.galleryImages && eventData.galleryImages.length > 0);
  
  console.log("📸 Has new images:", hasNewImages);
  
  if (hasNewImages) {
    // Send FormData with images
    const formData = new FormData();
    
    formData.append("title", eventData.eventTitle.trim());
    formData.append("description", eventData.description || "");
    formData.append("category", eventData.mainCategory);
    formData.append("subCategory", eventData.subcategory);
    if (eventData.eventType) {
      formData.append("type", eventData.eventType);
    }
    
    if (eventData.flyerImage) {
      formData.append("flyerImage", eventData.flyerImage);
      console.log("📤 Sending flyer image");
    }
    
    if (eventData.galleryImages && eventData.galleryImages.length > 0) {
      eventData.galleryImages.forEach((image) => {
        formData.append("galleryImages", image);
      });
      console.log("📤 Sending", eventData.galleryImages.length, "gallery images");
    }
    
    const response = await apiFetch(url, {
      method: "PATCH",
      body: formData,
      // Don't set Content-Type - browser will set it with boundary for FormData
    });
    
    console.log("✅ Event Step 1 updated successfully (with images):", response);
    return response;
  } else {
    // Send JSON only (no images changed)
    const jsonData = {
      title: eventData.eventTitle.trim(),
      description: eventData.description || "",
      category: eventData.mainCategory,
      subCategory: eventData.subcategory,
      ...(eventData.eventType ? { type: eventData.eventType } : {}),
    };

    console.log("📤 Sending JSON only:", JSON.stringify(jsonData, null, 2));

    const response = await apiFetch(url, {
      method: "PATCH",
      body: JSON.stringify(jsonData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("✅ Event Step 1 updated successfully:", response);
    return response;
  }
}

/**
 * Upload/Replace Flyer Image
 * 
 * API Endpoint: PATCH /api/event/update-flyer/:id
 * 
 * @param {string} eventId - Event ID
 * @param {File} flyerImage - Flyer image file
 * @returns {Promise<Object>} Response with uploaded image URL
 */
// Upload/replace flyer image through S3 storage.
// Preserves old response shape: { data: { flyerImage: <url>, url: <url>, publicId: <id> } }
export async function uploadFlyerImage(eventId, flyerImage) {
  console.log("Uploading flyer image");
  console.log("Event ID:", eventId);

  if (!eventId) {
    throw new Error("Event ID is required");
  }

  if (!flyerImage || !(flyerImage instanceof File)) {
    throw new Error("Valid flyer image file is required");
  }

  try {
    const upload = await uploadTempImage(flyerImage, "EVENT_FLYER", eventId);

    try {
      await persistFlyerUrl(eventId, upload);
      console.log("Flyer metadata persisted to backend");
    } catch (persistErr) {
      console.error("Failed to persist flyer URL to backend:", persistErr);
      throw new Error(persistErr?.message || "Failed to save flyer image. Please try again.");
    }

    const normalized = {
      data: {
        flyerImage: upload.url,
        url: upload.url,
        key: upload.key,
        storageKey: upload.storageKey,
        publicId: upload.publicId,
      },
    };

    console.log("Flyer image uploaded successfully:", normalized);
    return normalized;
  } catch (error) {
    console.error("Failed to upload flyer image:", error.message);
    throw error;
  }
}
/**
 * Delete Flyer Image
 * 
 * API Endpoint: DELETE /api/event/flyer/:id
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Response confirming deletion
 */
export async function deleteFlyerImage(eventId) {
  const url = buildUrl(`/api/event/flyer/${eventId}`);
  
  console.log("🗑️ Deleting Flyer Image");
  console.log("📋 Event ID:", eventId);
  
  if (!eventId) {
    throw new Error("Event ID is required");
  }
  
  try {
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    
    console.log("✅ Flyer image deleted successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to delete flyer image:");
    console.error("   Error message:", error.message);
    throw error;
  }
}

/**
 * Upload Gallery Images
 * 
 * API Endpoint: POST /api/event/:id/images
 * 
 * @param {string} eventId - Event ID
 * @param {File[]} galleryImages - Array of gallery image files (1-10 images, JPEG/PNG/WebP/GIF, ≤10MB each)
 * @returns {Promise<Object>} Response with uploaded image URLs
 */
// Upload gallery images through S3 storage.
// Preserves old response shape: { data: { images: [ { id, url, type: 'EVENT_GALLERY' } ] } }
export async function uploadGalleryImages(eventId, galleryImages) {
  console.log("Uploading gallery images");
  console.log("Event ID:", eventId);

  if (!eventId) {
    throw new Error("Event ID is required");
  }

  if (!galleryImages || galleryImages.length === 0) {
    throw new Error("At least one gallery image is required");
  }

  if (galleryImages.length > 10) {
    throw new Error("Maximum 10 gallery images allowed");
  }

  try {
    const uploads = await Promise.all(
      galleryImages.map(async (image, index) => {
        if (!(image instanceof File)) {
          throw new Error(`Gallery file at index ${index} is not a File`);
        }
        const upload = await uploadTempImage(image, "EVENT_GALLERY", eventId);
        return {
          id: upload.publicId,
          url: upload.url,
          key: upload.key,
          storageKey: upload.storageKey,
          publicId: upload.publicId,
          type: "EVENT_GALLERY",
        };
      })
    );

    let backendImages = [];

    try {
      const persistRes = await persistGalleryUrls(eventId, uploads);
      backendImages =
        persistRes?.data?.images ||
        persistRes?.images ||
        persistRes?.data ||
        [];
      console.log("Gallery metadata persisted to backend");
    } catch (persistErr) {
      console.error("Failed to persist gallery metadata to backend:", persistErr);
      throw new Error(persistErr?.message || "Failed to save gallery images. Please try again.");
    }

    const imagesForUi =
      Array.isArray(backendImages) && backendImages.length > 0
        ? backendImages.map((img, idx) => ({
            id: img.id || uploads[idx]?.id,
            url: img.url || uploads[idx]?.url,
            key: img.key || img.storageKey || img.publicId || uploads[idx]?.key,
            storageKey: img.storageKey || img.key || img.publicId || uploads[idx]?.storageKey,
            publicId: img.publicId || img.storageKey || img.key || uploads[idx]?.publicId,
            type: img.type || "EVENT_GALLERY",
          }))
        : uploads;

    const normalized = {
      data: {
        images: imagesForUi,
      },
    };

    console.log("Gallery images uploaded successfully:", normalized);
    return normalized;
  } catch (error) {
    console.error("Failed to upload gallery images:", error.message);
    throw error;
  }
}
/**
 * Delete Gallery Image
 * 
 * API Endpoint: DELETE /api/event/:eventId/images/:imageId
 * 
 * @param {string} eventId - Event ID
 * @param {string} imageId - Image ID
 * @returns {Promise<Object>} Response confirming deletion
 */
export async function deleteGalleryImage(eventId, imageId) {
  const url = buildUrl(`/api/event/${eventId}/images/${imageId}`);
  
  console.log("🗑️ Deleting Gallery Image");
  console.log("📋 Event ID:", eventId);
  console.log("📋 Image ID:", imageId);
  
  if (!eventId || !imageId) {
    throw new Error("Event ID and Image ID are required");
  }
  
  try {
    const response = await apiFetch(url, {
      method: "DELETE",
    });
    
    console.log("✅ Gallery image deleted successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to delete gallery image:");
    console.error("   Error message:", error.message);
    throw error;
  }
}

/**
 * Update event - Step 3: Date & Time
 * 
 * API Endpoint: PATCH /api/event/update-event/:eventId
 * 
 * @param {string} eventId - Event ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated event response
 */
export async function updateEventStep2(eventId, updateData) {
  // Event ID should be in the URL path
  const url = buildUrl(`/api/event/update-event/${eventId}`);

  console.log("🔄 Updating Event Step 2 - Date & Time");
  console.log("📋 Event ID:", eventId);
  console.log("🔗 Request URL:", url);
  console.log("📋 Update Data:", updateData);

  // Validate required fields
  if (!updateData.startDate || !updateData.endDate) {
    throw new Error("Start date and end date are required");
  }

  // Validate date format
  const startDateObj = new Date(updateData.startDate);
  const endDateObj = new Date(updateData.endDate);
  
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error("Invalid date format");
  }

  // Prepare update payload (no eventId in body since it's in URL)
  const payload = {
    startDate: updateData.startDate,
    endDate: updateData.endDate,
  };

  console.log("📤 Sending update payload:", JSON.stringify(payload, null, 2));
  console.log("📤 Request body string:", JSON.stringify(payload));
  console.log("📤 Request body length:", JSON.stringify(payload).length);

  const response = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json', // Explicitly set Content-Type
    },
  });

  console.log("✅ Response received:", response);
  return response;
}

const TABLE_GROUP_CAPACITY_LIMIT = 15;
const INTEGER_STRING_PATTERN = /^-?\d+$/;
const POSITIVE_INTEGER_STRING_PATTERN = /^\d+$/;

const TICKET_TYPE_MAP = {
  "vip-guest": "GUESTLIST",
  "standard": "STANDARD_TICKET",
  "table": "TABLE_TICKET",
  "group-pass": "GROUP_TICKET"
};

const ENTRY_TYPE_MAP = {
  "Single": "SINGLE_ENTRY",
  "Couple": "COUPLE_ENTRY"
};

const validateTicketPriceForPayload = (price, ticketType) => {
  const rawPrice = String(price ?? "").trim();
  const numericPrice = Number(rawPrice);

  if (rawPrice === "" || !Number.isFinite(numericPrice)) {
    throw new Error("Ticket price must be a valid number");
  }

  if (!INTEGER_STRING_PATTERN.test(rawPrice) || !Number.isInteger(numericPrice)) {
    throw new Error("Ticket price must be a whole number");
  }

  if (ticketType === "GUESTLIST") {
    if (numericPrice < 0) {
      throw new Error("Guest List price must be 0 or more");
    }
  } else if (numericPrice <= 0) {
    throw new Error("This ticket type must have a price greater than 0");
  }

  return numericPrice;
};

const validateTicketCapacityForPayload = (ticketData, ticketType) => {
  if (ticketType !== "TABLE_TICKET" && ticketType !== "GROUP_TICKET") {
    return undefined;
  }

  const isTableTicket = ticketType === "TABLE_TICKET";
  const label = isTableTicket ? "Table capacity" : "Group size";
  const rawCapacity = String(isTableTicket ? ticketData.tableQuantity ?? "" : ticketData.groupQuantity ?? "").trim();
  const numericCapacity = Number(rawCapacity);

  if (
    rawCapacity === "" ||
    !POSITIVE_INTEGER_STRING_PATTERN.test(rawCapacity) ||
    !Number.isInteger(numericCapacity) ||
    numericCapacity < 1 ||
    numericCapacity > TABLE_GROUP_CAPACITY_LIMIT
  ) {
    throw new Error(`${label} must be between 1 and ${TABLE_GROUP_CAPACITY_LIMIT}`);
  }

  return numericCapacity;
};

/**
 * Create ticket - Step 3: Tickets
 * 
 * API Endpoint: POST /api/ticket/create-ticket
 * 
 * Request Body:
 * - name: string (ticket name)
 * - type: string (GUESTLIST, STANDARD_TICKET, TABLE_TICKET, GROUP_TICKET)
 * - entryType: string (SINGLE_ENTRY, COUPLE_ENTRY)
 * - price: number (ticket price)
 * - totalQty: number (total quantity available)
 * - info: string (ticket description)
 * - eventId: string (UUID from backend)
 * - purchaseExpiry: string (ISO date string)
 * - comingSoon: boolean
 * - onGroundOnly: boolean
 * - maxPerUser: number
 * - gstRate: number (GST rate percentage)
 * 
 * @param {Object} ticketData - Ticket data to send
 * @returns {Promise<Object>} Response with created ticket
 */
export async function createTicket(ticketData) {
  const url = buildUrl("/api/ticket/create-ticket");

  console.log("🎫 Creating Ticket");
  console.log("📋 Ticket Data:", ticketData);

  // Validate required fields
  if (!ticketData.ticketName || ticketData.ticketName.trim() === "") {
    throw new Error("Ticket name is required");
  }

  if (!ticketData.eventId) {
    throw new Error("Event ID is required. Please create event details first.");
  }

  if (!ticketData.quantity || parseInt(ticketData.quantity) <= 0) {
    throw new Error("Valid ticket quantity is required");
  }

  const ticketType = TICKET_TYPE_MAP[ticketData.type] || "STANDARD_TICKET";
  const numericPrice = validateTicketPriceForPayload(ticketData.price, ticketType);
  const capacity = validateTicketCapacityForPayload(ticketData, ticketType);

  // Prepare the request body according to API spec
  const payload = {
    name: ticketData.ticketName.trim(),
    type: ticketType,
    entryType: ENTRY_TYPE_MAP[ticketData.ticketCategory] || "SINGLE_ENTRY",
    price: numericPrice,
    totalQty: parseInt(ticketData.quantity) || 0,
    info: ticketData.description || "",
    eventId: ticketData.eventId, // Backend event ID (UUID)
    purchaseExpiry: ticketData.purchaseExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default: 30 days from now
    comingSoon: ticketData.comingSoon || false,
    onGroundOnly: ticketData.onsiteOnly || false,
    maxPerUser: parseInt(ticketData.maxPerCustomer) || 10,
    gstRate: 18.0 // Default GST rate
  };

  if (capacity !== undefined) {
    payload.capacity = capacity;
  }

  console.log("📤 Sending ticket payload:", JSON.stringify(payload, null, 2));

  const response = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("✅ Ticket created successfully:", response);
  return response;
}

/**
 * Update ticket - Step 3: Tickets
 *
 * API Endpoint: PUT /api/ticket/update-ticket/:ticketId
 *
 * @param {string} ticketId - Ticket ID to update
 * @param {Object} ticketData - Ticket data to send
 * @returns {Promise<Object>} Response with updated ticket
 */
export async function updateTicket(ticketId, ticketData) {
  if (!ticketId) {
    throw new Error("Ticket ID is required to update a ticket");
  }

  const url = buildUrl(`/api/ticket/update-ticket/${ticketId}`);

  console.log("ðŸŽ« Updating Ticket");
  console.log("ðŸ“‹ Ticket ID:", ticketId);
  console.log("ðŸ“‹ Ticket Data:", ticketData);

  if (!ticketData.ticketName || ticketData.ticketName.trim() === "") {
    throw new Error("Ticket name is required");
  }

  if (!ticketData.quantity || parseInt(ticketData.quantity) <= 0) {
    throw new Error("Valid ticket quantity is required");
  }

  const ticketType = TICKET_TYPE_MAP[ticketData.type] || "STANDARD_TICKET";
  const numericPrice = validateTicketPriceForPayload(ticketData.price, ticketType);
  const capacity = validateTicketCapacityForPayload(ticketData, ticketType);

  const payload = {
    name: ticketData.ticketName.trim(),
    type: ticketType,
    entryType: ENTRY_TYPE_MAP[ticketData.ticketCategory] || "SINGLE_ENTRY",
    price: numericPrice,
    totalQty: parseInt(ticketData.quantity) || 0,
    info: ticketData.description || "",
    comingSoon: ticketData.comingSoon || false,
    onGroundOnly: ticketData.onsiteOnly || false,
    maxPerUser: parseInt(ticketData.maxPerCustomer) || 10,
    gstRate: Number(ticketData.gstRate ?? 18.0),
  };

  if (capacity !== undefined) {
    payload.capacity = capacity;
  }

  if (ticketData.purchaseExpiry) {
    payload.purchaseExpiry = ticketData.purchaseExpiry;
  }

  if (ticketData.gstType) {
    payload.gstType = ticketData.gstType;
  }

  console.log("ðŸ“¤ Sending ticket update payload:", JSON.stringify(payload, null, 2));

  const response = await apiFetch(url, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("âœ… Ticket updated successfully:", response);
  return response;
}

/**
 * Create venue - Step 4: Venue & Location
 * 
 * API Endpoint: POST /api/venue/create
 * 
 * Request Body:
 * - name: string (venue name)
 * - contact: string (contact number)
 * - email: string (email address)
 * - fullAddress: string (complete address)
 * - city: string (city name)
 * - state: string (state name)
 * - country: string (country name)
 * - postalCode: string (postal/zip code)
 * - latitude: number (latitude coordinate)
 * - longitude: number (longitude coordinate)
 * - googlePlaceId: string (optional - Google Place ID)
 * - eventId: string (backend event ID)
 * - isPrimary: boolean (is this the primary venue)
 * 
 * @param {Object} venueData - Venue data to send
 * @returns {Promise<Object>} Response with created venue
 */
export async function createVenue(venueData) {
  const url = buildUrl("/api/venue/create");

  console.log("🏢 Creating Venue");
  console.log("📋 Venue Data:", venueData);

  // Validate required fields
  if (!venueData.name || venueData.name.trim() === "") {
    throw new Error("Venue name is required");
  }

  if (!venueData.eventId) {
    throw new Error("Event ID is required. Please create event details first.");
  }

  // Prepare the request body according to API spec
  const payload = {
    name: venueData.name.trim(),
    contact: venueData.contact || "",
    email: venueData.email || "",
    fullAddress: venueData.fullAddress || "",
    city: venueData.city || "",
    state: venueData.state || "",
    country: venueData.country || "India", // Default country
    postalCode: venueData.postalCode || "",
    latitude: venueData.latitude || 0,
    longitude: venueData.longitude || 0,
    googlePlaceId: venueData.googlePlaceId || "",
    eventId: venueData.eventId, // Backend event ID (UUID)
    isPrimary: venueData.isPrimary !== undefined ? venueData.isPrimary : true,
  };

  console.log("📤 Sending venue payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await apiFetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("✅ Venue created successfully - Full response:", response);
    
    // Log the response structure for debugging
    console.log("📊 Response structure:", {
      hasDataProperty: 'data' in response,
      hasVenueProperty: response.data && 'venue' in response.data,
      hasIdProperty: 'id' in response || '_id' in response || 
                   (response.data && ('id' in response.data || '_id' in response.data))
    });
    
    // Return the full response and let the component handle the ID extraction
    return response;
  } catch (error) {
    console.error("❌ Error in createVenue:", error);
    throw error;
  }
}

/**
 * Create artist - Step 5: Add Artist
 * 
 * API Endpoint: POST /api/artist
 * 
 * Request Body:
 * - name: string (artist name)
 * - eventId: string (backend event ID)
 * - gender: string (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
 * - instagramLink: string (Instagram profile URL)
 * - spotifyLink: string (optional - Spotify profile URL)
 * - image: string (artist image URL)
 * 
 * @param {Object} artistData - Artist data to send
 * @returns {Promise<Object>} Response with created artist
 */
export async function createArtist(artistData) {
  const url = buildUrl("/api/artist");

  console.log("🎤 Creating Artist");
  console.log("📋 Artist Data:", artistData);

  // Validate required fields
  if (!artistData.name || artistData.name.trim() === "") {
    throw new Error("Artist name is required");
  }

  if (!artistData.eventId) {
    throw new Error("Event ID is required. Please create event details first.");
  }

  // Prepare the request body according to API spec
  const payload = {
    name: artistData.name.trim(),
    eventId: artistData.eventId, // Backend event ID (UUID)
    gender: artistData.gender || "PREFER_NOT_TO_SAY",
    instagramLink: artistData.instagramLink || "",
    spotifyLink: artistData.spotifyLink || "",
    image: artistData.image || "", // Image URL or base64
    imageUrl: artistData.image || "", // Extra key for backends expecting imageUrl
  };

  console.log("📤 Sending artist payload:", JSON.stringify(payload, null, 2));

  const response = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("✅ Artist created successfully:", response);
  return response;
}

/**
 * Delete an artist
 *
 * API Endpoint: DELETE /api/artist/delete/:artistId
 *
 * @param {string} artistId - ID of the artist to delete
 * @returns {Promise<Object>} Response confirming deletion
 */
export async function deleteArtist(artistId) {
  const url = buildUrl(`/api/artist/delete/${artistId}`);

  console.log("🗑️ Deleting Artist");
  console.log("📋 Artist ID:", artistId);

  if (!artistId) {
    throw new Error("Artist ID is required");
  }

  try {
    const response = await apiFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Artist deleted successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error deleting artist:", error);

    if (error.message.includes("401")) {
      throw new Error("Authentication required. Please login again.");
    } else if (error.message.includes("404")) {
      throw new Error("Artist not found or already deleted.");
    } else if (error.message.includes("403")) {
      throw new Error("You do not have permission to delete this artist.");
    }

    throw new Error(error.message || "Failed to delete artist. Please try again.");
  }
}

/**
 * Update event - Step 6: Additional Information
 * 
 * API Endpoint: PATCH /api/event/update-event/:eventId
 * 
 * Request Body:
 * - TC: JSON (Terms & Conditions)
 * - advisory: JSON (Advisory information)
 * - questions: JSON (Custom Q&A)
 * - organizerNote: string (Private organizer notes)
 * 
 * @param {string} eventId - Event ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated event response
 */
export async function updateEventStep6(eventId, updateData) {
  const url = buildUrl(`/api/event/update-event/${eventId}`);
  
  console.log("📝 Updating Event Step 6 - Additional Information");
  console.log("📋 Event ID:", eventId);
  console.log("🔗 Request URL:", url);
  console.log("📋 Update Data received:", updateData);
  
  // Validate eventId
  if (!eventId) {
    throw new Error("Event ID is required");
  }
  
  // Prepare update payload - only include fields with actual values
  const payload = {};
  
  // Only add TC if it has content
  if (updateData.TC && (Array.isArray(updateData.TC) ? updateData.TC.length > 0 : Object.keys(updateData.TC).length > 0)) {
    payload.TC = updateData.TC;
  }
  
  // Only add advisory if it has content
  if (updateData.advisory && (Array.isArray(updateData.advisory) ? updateData.advisory.length > 0 : Object.keys(updateData.advisory).length > 0)) {
    payload.advisory = updateData.advisory;
  }
  
  // Only add questions if it has content
  if (updateData.questions && Array.isArray(updateData.questions) && updateData.questions.length > 0) {
    payload.questions = updateData.questions;
  }
  
  // Only add organizerNote if it has content
  if (updateData.organizerNote && updateData.organizerNote.trim() !== "") {
    payload.organizerNote = updateData.organizerNote.trim();
  }

  // Sponsors data (allow empty array to clear)
  if (updateData.sponsors !== undefined) {
    payload.sponsors = updateData.sponsors;
  }

  // Artists data (allow empty array to clear)
  if (updateData.artists !== undefined) {
    payload.artists = updateData.artists;
  }

  // Publish status (explicitly allow setting to DRAFT or PUBLISHED)
  if (updateData.publishStatus) {
    payload.publishStatus = updateData.publishStatus;
  }
  
  // Check if there's anything to update
  if (Object.keys(payload).length === 0) {
    console.log("No valid data to update. Please provide at least one field.");
    return;
  }
  
  console.log("📤 Sending update payload:", JSON.stringify(payload, null, 2));
  console.log("📤 Payload keys:", Object.keys(payload));
  console.log("📤 Request body length:", JSON.stringify(payload).length);
  
  const response = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  console.log("✅ Event Step 6 updated successfully:", response);
  return response;
}

/**
 * Publish event - Update status from DRAFT to PUBLISHED
 * 
 * API Endpoint: PATCH /api/event/update-event/:eventId
 * 
 * @param {string} eventId - Event ID to update
 * @returns {Promise<Object>} Updated event response
 */
export async function publishEvent(eventId) {
  const url = buildUrl(`/api/event/update-event/${eventId}`);
  
  console.log("🚀 Publishing Event");
  console.log("📋 Event ID:", eventId);
  
  // Backend no longer accepts status fields here; publish handled server-side or elsewhere.
  const response = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify({}),
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  return response;
}

/**
 * Update an existing venue
 * 
 * API Endpoint: PUT /api/venue/update/:venueId
 * 
 * @param {string} venueId - ID of the venue to update
 * @param {Object} venueData - Venue data to update
 * @returns {Promise<Object>} Response with updated venue
 */
export async function updateVenue(venueId, venueData) {
  const url = buildUrl(`/api/venue/update/${venueId}`);
  
  try {
    console.log('🔄 Sending PUT request to update venue:', url);
    console.log('Venue data being sent:', venueData);
    
    const response = await apiFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venueData)
    });
    
    console.log('✅ Venue updated successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error updating venue:', error);
    
    if (error.message.includes('401')) {
      throw new Error('Authentication required. Please login again.');
    } else if (error.message.includes('404')) {
      throw new Error('Venue not found.');
    } else if (error.message.includes('403')) {
      throw new Error('You do not have permission to update this venue.');
    }
    
    throw new Error(error.message || 'Failed to update venue. Please try again.');
  }
}

/**
 * Delete a ticket
 * 
 * API Endpoint: DELETE /api/ticket/delete-ticket/:ticketId
 * 
 * @param {string} ticketId - ID of the ticket to delete
 * @returns {Promise<Object>} Response confirming deletion
 */
export async function deleteTicket(ticketId) {
  const url = buildUrl(`/api/ticket/delete-ticket/${ticketId}`);
  
  try {
    const response = await apiFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Ticket deleted successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    
    // Handle specific error cases
    if (error.message.includes('401')) {
      throw new Error('Authentication required. Please login again.');
    } else if (error.message.includes('404')) {
      throw new Error('Ticket not found or already deleted.');
    } else if (error.message.includes('403')) {
      throw new Error('You do not have permission to delete this ticket.');
    }
    
    throw new Error(error.message || 'Failed to delete ticket. Please try again.');
  }
}

/**
 * Generate a unique event ID
 * @returns {string} Unique event ID
 */
export function generateEventId() {
  return Math.random().toString(36).substring(2, 10);
}
