"use client";

import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => {
    const cls = ["ui-input", className].filter(Boolean).join(" ");
    return <input ref={ref} className={cls} {...rest} />;
  },
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => {
    const cls = ["ui-input ui-textarea", className].filter(Boolean).join(" ");
    return <textarea ref={ref} className={cls} {...rest} />;
  },
);
Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...rest }, ref) => {
    const cls = ["ui-input ui-select", className].filter(Boolean).join(" ");
    return <select ref={ref} className={cls} {...rest} />;
  },
);
Select.displayName = "Select";

export { Input, Textarea, Select };
