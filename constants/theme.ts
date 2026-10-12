import COLORS from "./colors";

export const Colors = {
  light: {
    text: COLORS.BLACK,
    background: COLORS.WHITE,
    tint: COLORS.PRIMARY,
    primary: COLORS.PRIMARY,
    lighterPrimary: COLORS.LIGHTER_PRIMARY,
    darkerPrimary: COLORS.DARKER_PRIMARY,
    error: COLORS.RED,
    success: COLORS.GREEN,
    border: "#E2E8F0",
    placeholder: COLORS.DARK_GRAY,
    disabled: COLORS.DISABLED_GRAY,
  },
  dark: {
    text: COLORS.WHITE,
    background: COLORS.BLACK,
    tint: COLORS.PRIMARY,
    primary: COLORS.PRIMARY,
    lighterPrimary: COLORS.LIGHTER_PRIMARY,
    darkerPrimary: COLORS.DARKER_PRIMARY,
    error: COLORS.RED,
    success: COLORS.GREEN,
    border: "#1A1A1A",
    placeholder: COLORS.LIGHT_GRAY,
    disabled: COLORS.DISABLED_GRAY,
  },
};
