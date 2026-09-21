"use client";

import React from "react";

type ButtonVariant = "primary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "ui-btn-primary",
  danger: "ui-btn-danger",
  ghost: "ui-btn-ghost",
  outline: "ui-btn-outline",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "ui-btn-sm",
  md: "ui-btn-md",
  lg: "ui-btn-lg",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...rest }, ref) => {
    const cls = [
      "ui-btn",
      variantClass[variant],
      sizeClass[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={cls} {...rest} />;
  },
);

Button.displayName = "Button";

export default Button;
