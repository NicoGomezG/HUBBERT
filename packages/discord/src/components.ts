import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import type { APIActionRowComponent, APIButtonComponentWithCustomId } from "discord-api-types/v10";

export interface ButtonRowInput {
  customId: string;
  label: string;
  style?: "primary" | "danger";
  emoji?: string;
}

export function buildButtonRow(input: ButtonRowInput): APIActionRowComponent<APIButtonComponentWithCustomId> {
  return {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        style: input.style === "danger" ? ButtonStyle.Danger : ButtonStyle.Primary,
        label: input.label,
        custom_id: input.customId,
        emoji: input.emoji ? { name: input.emoji } : undefined,
      },
    ],
  };
}
