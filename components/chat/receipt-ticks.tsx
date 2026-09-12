import React from "react";
import { ActivityIndicator } from "react-native";
import { AlertCircle, Check, CheckCheck } from "lucide-react-native";

import type { MessageStatus } from "@/services/chatTypes";

interface Props {
  status: MessageStatus;
  /** Tint for the sent/delivered ticks, which sit on the outgoing bubble. */
  color: string;
  readColor?: string;
  size?: number;
}

/**
 * WhatsApp-style delivery state:
 *   sending   spinner
 *   failed    red alert
 *   sent      one tick
 *   delivered two ticks
 *   read      two ticks, accented
 */
export const ReceiptTicks = ({
  status,
  color,
  readColor = "#38BDF8",
  size = 14,
}: Props) => {
  switch (status) {
    case "sending":
      return <ActivityIndicator size="small" color={color} />;

    case "failed":
      return <AlertCircle size={size} color="#EF4444" />;

    case "sent":
      return <Check size={size} color={color} />;

    case "delivered":
      return <CheckCheck size={size} color={color} />;

    case "read":
      return <CheckCheck size={size} color={readColor} />;

    default:
      return null;
  }
};
