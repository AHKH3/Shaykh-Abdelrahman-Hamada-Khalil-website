import React, { forwardRef } from "react";

export interface EngravedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const EngravedInput = forwardRef<HTMLInputElement, EngravedInputProps>(
  ({ className, containerClassName, icon, endIcon, ...props }, ref) => {
    return (
      <div
        className={`mushaf-engraved-container flex items-center transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-[inset_0_4px_8px_-2px_rgba(0,0,0,0.15)] ${
          containerClassName || ""
        }`}
      >
        {icon && (
          <div className="flex items-center justify-center pl-4 pr-2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`flex-1 bg-transparent px-4 py-3 text-sm transition-all focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60 w-full min-w-0 ${
            className || ""
          }`}
          {...props}
        />
        {endIcon && (
          <div className="flex items-center justify-center pr-4 pl-2 text-muted-foreground">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);

EngravedInput.displayName = "EngravedInput";

export default EngravedInput;
