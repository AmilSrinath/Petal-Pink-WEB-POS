import React from 'react';

interface FormButtonsProps {
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
}

export function FormButtons({
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  submitDisabled = false,
}: FormButtonsProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onSubmit}
        disabled={loading || submitDisabled}
        className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : submitLabel}
      </button>
      <button
        onClick={onCancel}
        className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
