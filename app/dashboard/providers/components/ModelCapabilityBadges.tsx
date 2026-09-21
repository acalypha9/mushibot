"use client";

import React, { memo } from "react";
import { FeatureBadgeTooltip, InfoTooltip } from "./FeatureBadgeTooltip";
import { computeCapabilityBadges, type ModelCapabilityOptions } from "./modelCapabilityFormatter";
import { renderCapabilityBadgeIcon } from "./capabilityBadgeIcons";

export { FeatureBadgeTooltip, InfoTooltip };

export interface ModelCapabilityBadgesProps {
  modelId?: string;
  hasVision?: boolean;
  hasAudio?: boolean;
  hasTools?: boolean;
  hasReasoning?: boolean;
  contextLength?: string;
  modelsDevMap?: Record<string, unknown>;
  category?: string;
  dimensions?: number | string;
}

export const ModelCapabilityBadges = memo(function ModelCapabilityBadges(props: ModelCapabilityBadgesProps) {
  const { kind, items } = computeCapabilityBadges(props as ModelCapabilityOptions);

  if (kind === "parser" || kind === "embedding") {
    const badge = items[0];
    if (!badge) return null;

    return (
      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
        <FeatureBadgeTooltip
          badgeLabel={badge.badgeLabel}
          icon={renderCapabilityBadgeIcon(badge.iconType)}
          title={badge.title}
          modelName={badge.modelName}
          description={badge.description}
          details={badge.details}
          color={badge.color}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px", flexWrap: "wrap" }}>
      {items.map((item) => (
        <FeatureBadgeTooltip
          key={item.key}
          badgeLabel={item.badgeLabel}
          icon={renderCapabilityBadgeIcon(item.iconType)}
          title={item.title}
          modelName={item.modelName}
          description={item.description}
          details={item.details}
          color={item.color}
        />
      ))}
    </div>
  );
});
