import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import type {
  APIActionRowComponent,
  APIButtonComponentWithCustomId,
  APIButtonComponentWithURL,
} from "discord-api-types/v10";

export type ButtonRowStyle = "primary" | "secondary" | "success" | "danger";

type NonLinkButtonStyle = ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;

const BUTTON_STYLES: Record<ButtonRowStyle, NonLinkButtonStyle> = {
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger,
};

export interface ButtonRowInput {
  customId: string;
  label: string;
  style?: ButtonRowStyle;
  emoji?: string;
}

export function buildButtonRow(input: ButtonRowInput): APIActionRowComponent<APIButtonComponentWithCustomId> {
  return {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        style: BUTTON_STYLES[input.style ?? "primary"],
        label: input.label,
        custom_id: input.customId,
        emoji: input.emoji ? { name: input.emoji } : undefined,
      },
    ],
  };
}

export interface LinkButtonInput {
  label: string;
  url: string;
  emoji?: string;
}

/** Botones que abren una URL: no generan interacción, así que no necesitan custom_id. */
export function buildLinkButtonRow(buttons: LinkButtonInput[]): APIActionRowComponent<APIButtonComponentWithURL> {
  return {
    type: ComponentType.ActionRow,
    components: buttons.map((b) => ({
      type: ComponentType.Button,
      style: ButtonStyle.Link,
      label: b.label,
      url: b.url,
      emoji: b.emoji ? { name: b.emoji } : undefined,
    })),
  };
}
