import amikoBoldUrl from "@/assets/fonts/Amiko-Bold.ttf?url";
import amikoRegularUrl from "@/assets/fonts/Amiko-Regular.ttf?url";

const fontDataCache = new Map();
const registeredDocuments = new WeakSet();

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
};

const loadFontData = async (url) => {
  if (!fontDataCache.has(url)) {
    fontDataCache.set(
      url,
      fetch(url).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load PDF font: ${response.status}`);
        }

        return arrayBufferToBase64(await response.arrayBuffer());
      }),
    );
  }

  return fontDataCache.get(url);
};

export const registerAmikoPdfFonts = async (doc) => {
  if (registeredDocuments.has(doc)) return;

  const [regular, bold] = await Promise.all([
    loadFontData(amikoRegularUrl),
    loadFontData(amikoBoldUrl),
  ]);

  doc.addFileToVFS("Amiko-Regular.ttf", regular);
  doc.addFont("Amiko-Regular.ttf", "Amiko", "normal");
  doc.addFileToVFS("Amiko-Bold.ttf", bold);
  doc.addFont("Amiko-Bold.ttf", "Amiko", "bold");
  registeredDocuments.add(doc);
};
