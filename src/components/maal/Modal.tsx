import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ ariaLabel, children, className = "" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-label={ariaLabel}
      onCancel={(event) => event.preventDefault()}
      className={`modal-layer ${className}`}
    >
      {children}
    </dialog>,
    document.body,
  );
}
