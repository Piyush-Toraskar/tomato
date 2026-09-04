import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import {
  buttonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "./Button";

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  leftIcon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {leftIcon}
      {children}
    </Link>
  );
}
