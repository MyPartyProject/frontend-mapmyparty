export const DEFAULT_EVENT_DETAIL_TEMPLATE = "classic";

export const EVENT_DETAIL_TEMPLATE_OPTIONS = [
  {
    id: "classic",
    displayName: "Classic",
    shortName: "Current UI",
    description: "The current MapMyParty event detail page experience.",
    tone: "Familiar, image-led, conversion focused",
    isDefault: true,
  },
  {
    id: "modern-split",
    displayName: "Modern Split",
    shortName: "Split Layout",
    description: "A high-impact hero with editorial content and a sticky ticket panel.",
    tone: "Bold, immersive, premium",
    isDefault: false,
  },
  {
    id: "minimal",
    displayName: "Minimal",
    shortName: "Focused Layout",
    description: "A clean single-column event page built for fast reading and booking.",
    tone: "Calm, direct, mobile friendly",
    isDefault: false,
  },
];

export const EVENT_DETAIL_TEMPLATE_IDS = EVENT_DETAIL_TEMPLATE_OPTIONS.map((template) => template.id);

export function normalizeEventDetailTemplateId(templateId) {
  if (!templateId) return DEFAULT_EVENT_DETAIL_TEMPLATE;

  const normalized = String(templateId).trim();
  if (EVENT_DETAIL_TEMPLATE_IDS.includes(normalized)) return normalized;

  const legacyMap = {
    Classic: "classic",
    Modern: "modern-split",
    Minimal: "minimal",
    template1: "classic",
    template2: "modern-split",
    template3: "minimal",
  };

  return legacyMap[normalized] || DEFAULT_EVENT_DETAIL_TEMPLATE;
}

export function getEventDetailTemplateOption(templateId) {
  const normalizedId = normalizeEventDetailTemplateId(templateId);
  return EVENT_DETAIL_TEMPLATE_OPTIONS.find((template) => template.id === normalizedId) || EVENT_DETAIL_TEMPLATE_OPTIONS[0];
}

export function getAvailableEventDetailTemplates() {
  return EVENT_DETAIL_TEMPLATE_OPTIONS;
}
