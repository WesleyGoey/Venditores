import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

/** A password field with an eye button that shows or hides what was typed. */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, tabIndex, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
        <div data-password className="relative">
            <Input
                ref={ref}
                type={visible ? 'text' : 'password'}
                tabIndex={tabIndex}
                disabled={disabled}
                className={`pr-11 ${className ?? ''}`}
                {...props}
            />
            <button
                type="button"
                // Same tab stop as the field, so the eye is reached right after it and before the next field.
                tabIndex={tabIndex}
                disabled={disabled}
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-md focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
