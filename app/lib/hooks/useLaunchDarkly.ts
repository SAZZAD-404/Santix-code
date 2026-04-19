/**
 * Stub: LaunchDarkly replaced with static defaults.
 */
export function useLaunchDarkly() {
  return {
    maintenanceMode: false,
    showUsageAnnotations: false,
    recordRawPromptsForDebugging: false,
    maxCollapsedMessagesSize: 65536,
    maxRelevantFilesSize: 8192,
    minCollapsedMessagesSize: 8192,
    useGeminiAuto: false,
    notionClonePrompt: false,
    newChatFeature: false,
    minMessagesForNudge: 40,
    enableResend: false,
    enableGpt5: false,
    useAnthropicFraction: 1.0,
  };
}

export const flagDefaultsKebabCase = {};
