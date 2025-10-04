import React from 'react';
import { cn } from '../../utils/cn';

// Form container with proper styling
const Form = ({ className, children, onSubmit, ...props }) => {
  return (
    <form 
      className={cn("space-y-6", className)} 
      onSubmit={onSubmit} 
      {...props}
    >
      {children}
    </form>
  );
};

// Export Form as default and also as a named export
export default Form;
export { Form };

// Form section for grouping related fields
export const FormSection = ({ className, children, title, description }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form field wrapper
export const FormField = ({ className, children, error }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 animate-in fade-in">{error}</p>
      )}
    </div>
  );
};

// Form label with consistent styling
export const FormLabel = ({ className, children, htmlFor, required }) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium text-gray-700 dark:text-gray-300",
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

// Enhanced text input with focus states and animations
export const FormInput = React.forwardRef(({ 
  className, 
  type = "text", 
  error, 
  icon: Icon,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <input
        type={type}
        ref={ref}
        className={cn(
          "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700",
          "rounded-lg shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "transition-all duration-200 ease-in-out",
          "text-gray-900 dark:text-white bg-white dark:bg-gray-900",
          error && "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500",
          Icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
});
FormInput.displayName = "FormInput";

// Select input with enhanced styling
export const FormSelect = React.forwardRef(({ 
  className, 
  children, 
  error, 
  ...props 
}, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700",
        "rounded-lg shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        "transition-all duration-200 ease-in-out",
        "text-gray-900 dark:text-white bg-white dark:bg-gray-900",
        "pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]",
        error && "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
FormSelect.displayName = "FormSelect";

// Textarea with enhanced styling
export const FormTextarea = React.forwardRef(({ 
  className, 
  error, 
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700",
        "rounded-lg shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        "transition-all duration-200 ease-in-out",
        "text-gray-900 dark:text-white bg-white dark:bg-gray-900",
        error && "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500",
        className
      )}
      {...props}
    />
  );
});
FormTextarea.displayName = "FormTextarea";

// Checkbox with enhanced styling
export const FormCheckbox = React.forwardRef(({ 
  className, 
  label, 
  error, 
  ...props 
}, ref) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary",
          "transition-all duration-200 ease-in-out",
          error && "border-red-300 dark:border-red-700",
          className
        )}
        {...props}
      />
      {label && (
        <label 
          htmlFor={props.id}
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
    </div>
  );
});
FormCheckbox.displayName = "FormCheckbox";

// Radio button with enhanced styling
export const FormRadio = React.forwardRef(({ 
  className, 
  label, 
  error, 
  ...props 
}, ref) => {
  return (
    <div className="flex items-center">
      <input
        type="radio"
        ref={ref}
        className={cn(
          "h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-primary",
          "transition-all duration-200 ease-in-out",
          error && "border-red-300 dark:border-red-700",
          className
        )}
        {...props}
      />
      {label && (
        <label 
          htmlFor={props.id}
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
    </div>
  );
});
FormRadio.displayName = "FormRadio";

// Submit button with loading state
export const FormSubmit = React.forwardRef(({ 
  className, 
  children, 
  isLoading, 
  loadingText = "Processing...",
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      type="submit"
      disabled={isLoading}
      className={cn(
        "flex justify-center items-center w-full px-4 py-2.5 rounded-lg",
        "text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary",
        "transition-all duration-200 ease-in-out",
        "shadow-sm border border-transparent",
        isLoading && "opacity-70 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
});
FormSubmit.displayName = "FormSubmit";

// Form error message
export const FormError = ({ className, children }) => {
  if (!children) return null;
  
  return (
    <div className={cn(
      "mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
      "text-sm text-red-700 dark:text-red-300 animate-in fade-in",
      className
    )}>
      {children}
    </div>
  );
};

// Form success message
export const FormSuccess = ({ className, children }) => {
  if (!children) return null;
  
  return (
    <div className={cn(
      "mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
      "text-sm text-green-700 dark:text-green-300 animate-in fade-in",
      className
    )}>
      {children}
    </div>
  );
}; 