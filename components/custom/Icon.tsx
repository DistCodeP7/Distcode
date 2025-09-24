import React from "react";
import type { LucideProps } from "lucide-react";

import GoLogo from "@/assets/icons/go.svg";
import ErlangLogo from "@/assets/icons/erlang.svg";
import AkkaLogo from "@/assets/icons/akka.svg";
import MarkdownLogo from "@/assets/icons/markdown.svg";

const customIcons = {
  go: GoLogo,
  erlang: ErlangLogo,
  akka: AkkaLogo,
  markdown: MarkdownLogo,
};

const defaultColors: Record<keyof typeof customIcons, string> = {
  go: "#00ADD8",
  erlang: "#A90533",
  akka: "#1681C4",
  markdown: "#a53434ff",
};

export type CustomIconName = keyof typeof customIcons;

type IconProps = Omit<LucideProps, "name"> & {
  name: CustomIconName;
};

export const FileTypeIcon = ({ name, color, ...props }: IconProps) => {
  const CustomIconComponent = customIcons[name];
  const iconColor = color ?? defaultColors[name];

  if (!CustomIconComponent) {
    return null;
  }

  return <CustomIconComponent color={iconColor} {...props} />;
};
