/**
 * Template Configuration System
 * 
 * This file defines all available event templates with their configurations.
 * Backend stores template name/ID, frontend stores implementation.
 */

export const TEMPLATE_CONFIGS = {
  Classic: {
    id: "template1",
    name: "Classic",
    displayName: "Classic Grid",
    description: "Traditional grid layout with cards. Clean header, sticky filters, and organized 3-column grid. Professional and familiar.",
    previewImage: null, // Can be added later
    layoutConfig: {
      theme: {
        primaryColor: "#8438B0",
        secondaryColor: "#F3E8FF",
        accentColor: "#A259C9",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      },
      sections: {
        hero: {
          style: "gradient-header",
          animation: "fade-in",
        },
        filters: {
          style: "sticky-top",
          position: "below-header",
        },
        grid: {
          columns: 3,
          gap: "medium",
          cardStyle: "elevated",
        },
      },
    },
    category: "listing", // For events listing page
  },
  Modern: {
    id: "template2",
    name: "Modern",
    displayName: "Magazine Masonry",
    description: "Magazine-style masonry layout with hero section, compact filters, and Pinterest-like column grid. Visual and modern.",
    previewImage: null,
    layoutConfig: {
      theme: {
        primaryColor: "#8438B0",
        secondaryColor: "#F3E8FF",
        accentColor: "#A259C9",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      },
      sections: {
        hero: {
          style: "overlay-image",
          animation: "slide-up",
        },
        filters: {
          style: "collapsible",
          position: "below-hero",
        },
        grid: {
          columns: "masonry",
          gap: "large",
          cardStyle: "overlay-text",
        },
      },
    },
    category: "listing",
  },
  Minimal: {
    id: "template3",
    name: "Minimal",
    displayName: "List Table",
    description: "List/table layout with sidebar filters and horizontal event cards. Minimalist header and organized list view. Clean and efficient.",
    previewImage: null,
    layoutConfig: {
      theme: {
        primaryColor: "#8438B0",
        secondaryColor: "#F3E8FF",
        accentColor: "#A259C9",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      },
      sections: {
        hero: {
          style: "minimal-header",
          animation: "none",
        },
        filters: {
          style: "sidebar",
          position: "left",
        },
        grid: {
          columns: 1,
          gap: "small",
          cardStyle: "horizontal-list",
        },
      },
    },
    category: "listing",
  },
};

// Template mapping for detail pages
export const DETAIL_TEMPLATE_CONFIGS = {
  Classic: {
    id: "template1",
    name: "Classic",
    displayName: "Classic Detail",
    description: "Full-width hero image at top, event info card below hero, stacked sections for all content.",
    layoutConfig: {
      theme: {
        primaryColor: "#8438B0",
        secondaryColor: "#F3E8FF",
        accentColor: "#A259C9",
      },
      sections: {
        hero: {
          style: "full-width-image",
          height: "large",
        },
        details: {
          layout: "stacked",
          spacing: "medium",
        },
      },
    },
    category: "detail",
  },
  Modern: {
    id: "template2",
    name: "Modern",
    displayName: "Modern Split",
    description: "Hero section with overlay content, split layout with main content and sticky sidebar.",
    layoutConfig: {
      theme: {
        primaryColor: "#8438B0",
        secondaryColor: "#F3E8FF",
        accentColor: "#A259C9",
      },
      sections: {
        hero: {
          style: "overlay-content",
          height: "medium",
        },
        details: {
          layout: "split-column",
          sidebar: "sticky",
        },
      },
    },
    category: "detail",
  },
  Minimal: {
    id: "template3",
    name: "Minimal",
    displayName: "Minimalist Single Column",
    description: "Minimalist header, full-width event image, single column layout with centered content.",
    layoutConfig: {
      theme: {
        primaryColor: "#8438B0",
        secondaryColor: "#F3E8FF",
        accentColor: "#A259C9",
      },
      sections: {
        hero: {
          style: "minimal-header",
          height: "small",
        },
        details: {
          layout: "single-column",
          spacing: "large",
        },
      },
    },
    category: "detail",
  },
};

/**
 * Get template config by ID or name
 */
export const getTemplateConfig = (templateIdOrName, category = "listing") => {
  const configs = category === "detail" ? DETAIL_TEMPLATE_CONFIGS : TEMPLATE_CONFIGS;
  
  // Try to find by ID first
  const byId = Object.values(configs).find(t => t.id === templateIdOrName);
  if (byId) return byId;
  
  // Try to find by name
  const byName = Object.values(configs).find(t => t.name === templateIdOrName);
  if (byName) return byName;
  
  // Default to Classic
  return configs.Classic || Object.values(configs)[0];
};

/**
 * Get all available templates for a category
 */
export const getAvailableTemplates = (category = "listing") => {
  const configs = category === "detail" ? DETAIL_TEMPLATE_CONFIGS : TEMPLATE_CONFIGS;
  return Object.values(configs);
};

/**
 * Map old template IDs to new names (for backward compatibility)
 */
export const mapTemplateId = (templateId) => {
  const mapping = {
    "template1": "Classic",
    "template2": "Modern",
    "template3": "Minimal",
  };
  return mapping[templateId] || templateId || "Classic";
};

/**
 * Map template name to ID (for saving to backend)
 */
export const mapTemplateNameToId = (templateName) => {
  const mapping = {
    "Classic": "template1",
    "Modern": "template2",
    "Minimal": "template3",
  };
  return mapping[templateName] || templateName || "template1";
};

