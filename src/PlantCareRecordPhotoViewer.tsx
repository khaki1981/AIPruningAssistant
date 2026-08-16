import { useEffect, useId, useRef, useState } from "react";

type SavedPhotoStatus = "error" | "loading" | "ready";

interface PlantCareRecordPhotoViewerProps {
  alt: string;
  onImageError: (failedUrl: string) => void;
  onRetry: () => void;
  signedUrl: string | null;
  status: SavedPhotoStatus;
  variant: "detail" | "thumbnail";
}

function PlantCareRecordPhotoViewer({
  alt,
  onImageError,
  onRetry,
  signedUrl,
  status,
  variant,
}: PlantCareRecordPhotoViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (status !== "ready" || !signedUrl) setIsOpen(false);
  }, [signedUrl, status]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [isOpen]);

  const openViewer = (button: HTMLButtonElement) => {
    openerRef.current = button;
    setIsOpen(true);
  };

  const handleImageError = () => {
    if (signedUrl) onImageError(signedUrl);
  };

  return (
    <div className={`saved-plant-photo saved-plant-photo--${variant}`}>
      {status === "loading" ? (
        <div className="saved-plant-photo__loading" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          <span>写真を読み込んでいます…</span>
        </div>
      ) : status === "error" || !signedUrl ? (
        <div className="saved-plant-photo__error" role="alert">
          <span>写真を表示できませんでした。</span>
          <button type="button" onClick={onRetry}>写真を再読み込みする</button>
        </div>
      ) : (
        <button
          className="saved-plant-photo__open"
          type="button"
          aria-label={`${alt}を拡大表示`}
          onClick={(event) => openViewer(event.currentTarget)}
        >
          <img
            src={signedUrl}
            alt={alt}
            decoding="async"
            loading="lazy"
            onError={handleImageError}
          />
          <span>拡大表示</span>
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="saved-plant-photo-dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
      >
        <div
          className="saved-plant-photo-dialog__content"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="saved-plant-photo-dialog__heading">
            <h2 id={titleId}>保存済み写真</h2>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="拡大写真を閉じる"
              onClick={() => setIsOpen(false)}
            >
              閉じる
            </button>
          </div>
          {signedUrl && (
            <img
              src={signedUrl}
              alt={alt}
              decoding="async"
              onError={handleImageError}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}

export default PlantCareRecordPhotoViewer;
