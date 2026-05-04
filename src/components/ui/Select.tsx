import * as SelectPrimitive from '@radix-ui/react-select';
<<<<<<< HEAD
import { IconChevronDown, IconChevronUp, IconCheck } from '@/components/icons';
=======
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { IconChevronDown, IconChevronUp, IconCheck } from '@/components/icons';

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'h-11 flex items-center justify-between gap-2 w-full px-3.5',
      'rounded-(--radius-r2) border border-(--c-line-2)',
      'bg-(--c-surface-2) text-(--c-text) text-[15px]',
      'outline-none transition-all cursor-pointer',
      'focus:border-(--c-accent) focus:ring-2 focus:ring-(--c-accent)/20',
      'data-[placeholder]:text-(--c-text-4)',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
<<<<<<< HEAD
      <IconChevronDown size={16} className="text-(--c-text-3) shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
=======
      <IconChevronDown size={15} className="text-(--c-text-3) shrink-0" />
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-300 min-w-(--radix-select-trigger-width)',
        'overflow-hidden rounded-(--radius-r3)',
        'bg-(--c-surface) border border-(--c-line-2)',
        'shadow-elevated',
        'data-[state=open]:[animation:selectOpen_0.15s_ease-out]',
        'data-[state=closed]:[animation:selectClose_0.1s_ease-in]',
        className
      )}
      position={position}
      sideOffset={6}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1 text-(--c-text-3)">
        <IconChevronUp size={14} />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1 text-(--c-text-3)">
        <IconChevronDown size={14} />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-[11px] uppercase tracking-[0.08em] text-(--c-text-4)', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center',
      'rounded-(--radius-r2) py-2.5 pl-8 pr-3',
      'text-[14px] text-(--c-text) outline-none',
      'hover:bg-(--c-surface-2) focus:bg-(--c-surface-2)',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'transition-colors duration-100',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <IconCheck size={14} className="text-(--c-accent)" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('mx-1 my-1 h-px bg-(--c-line)', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
