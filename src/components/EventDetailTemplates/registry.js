import {
  DEFAULT_EVENT_DETAIL_TEMPLATE,
  EVENT_DETAIL_TEMPLATE_OPTIONS,
  getEventDetailTemplateOption,
  normalizeEventDetailTemplateId,
} from "@/config/eventDetailTemplates";
import ModernSplitDetailTemplate from "./ModernSplitDetailTemplate";
import MinimalFocusDetailTemplate from "./MinimalFocusDetailTemplate";

const componentByTemplateId = {
  "modern-split": ModernSplitDetailTemplate,
  minimal: MinimalFocusDetailTemplate,
};

export { DEFAULT_EVENT_DETAIL_TEMPLATE, EVENT_DETAIL_TEMPLATE_OPTIONS, getEventDetailTemplateOption };

export function resolveEventDetailTemplate(templateId) {
  const normalizedId = normalizeEventDetailTemplateId(templateId);
  const option = getEventDetailTemplateOption(normalizedId);

  return {
    ...option,
    id: normalizedId,
    component: componentByTemplateId[normalizedId] || null,
    isClassicCurrent: normalizedId === DEFAULT_EVENT_DETAIL_TEMPLATE,
  };
}
