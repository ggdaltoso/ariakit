import { HTMLAttributes, RefObject, forwardRef, useRef } from "react";
import {
  Popover as BasePopover,
  PopoverStoreProps,
  usePopoverStore,
} from "ariakit/popover/store";

export {
  PopoverArrow,
  PopoverDescription,
  PopoverDismiss,
  PopoverHeading,
} from "ariakit/popover/store";

export type PopoverProps = HTMLAttributes<HTMLDivElement> & {
  placement?: PopoverStoreProps["placement"];
  isOpen?: boolean;
  anchorRef?: RefObject<HTMLElement>;
  getAnchorRect?: () => DOMRect | null;
  onClose?: () => void;
};

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (props, ref) => {
    const {
      placement,
      anchorRef,
      getAnchorRect,
      isOpen = true,
      onClose,
      ...rest
    } = props;
    const fallbackRef = useRef<HTMLSpanElement>(null);
    const popover = usePopoverStore({
      placement,
      open: isOpen,
      setOpen: (open) => {
        if (!open && onClose) onClose();
      },
      getAnchorRect: () => {
        if (getAnchorRect) {
          return getAnchorRect();
        }
        if (anchorRef) {
          return anchorRef.current?.getBoundingClientRect() || null;
        }
        const parentElement = fallbackRef.current?.parentElement;
        if (parentElement) {
          return parentElement.getBoundingClientRect();
        }
        return null;
      },
    });
    return (
      <>
        <span ref={fallbackRef} style={{ position: "fixed" }} />
        <BasePopover store={popover} ref={ref} portal {...rest} />
      </>
    );
  }
);
