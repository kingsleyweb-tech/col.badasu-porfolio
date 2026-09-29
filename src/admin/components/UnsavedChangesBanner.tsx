import React from 'react'
import { Loader2 } from 'lucide-react'

interface UnsavedChangesBannerProps {
  isDirty: boolean
  onSave?: () => void
  onReset?: () => void
  isSaving?: boolean
  message?: string
}

/** Dark save bar shown while a page has edits that are not yet published. */
export const UnsavedChangesBanner: React.FC<UnsavedChangesBannerProps> = ({
  isDirty,
  onSave,
  onReset,
  isSaving = false,
  message = 'You have unsaved changes on this page',
}) => {
  if (!isDirty) return null

  return (
    <div className="ad-savebar" role="status">
      <i aria-hidden="true" />
      <span>{message}</span>
      <span className="sp" />
      {onReset && (
        <button type="button" className="ad-b sm lw" onClick={onReset} disabled={isSaving}>
          Discard
        </button>
      )}
      {onSave && (
        <button type="button" className="ad-b sm gold" onClick={onSave} disabled={isSaving}>
          {isSaving && <Loader2 size={14} className="admin-spinner" />}
          {isSaving ? 'Saving…' : 'Save & publish'}
        </button>
      )}
    </div>
  )
}
