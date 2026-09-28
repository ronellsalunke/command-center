import type { FormEventHandler } from "react";
import { PlusIcon } from "../../components/icons";

export function AddFieldForm({
  newKey,
  newValue,
  onKeyChange,
  onValueChange,
  onSubmit,
}: {
  newKey: string;
  newValue: string;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <>
      <form
        onSubmit={onSubmit}
        className="field-add mt-2 flex items-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-transparent p-2 dark:border-neutral-800"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center text-neutral-600 dark:text-neutral-300">
          <PlusIcon />
        </span>
        <input
          aria-label="New field key"
          required
          maxLength={100}
          placeholder="Key"
          value={newKey}
          onChange={(event) => onKeyChange(event.target.value)}
          className="value-blend h-8 w-36 shrink-0 rounded-md px-2 text-sm font-medium"
        />
        <input
          aria-label="New field value"
          aria-invalid={!newValue.trim()}
          aria-describedby={!newValue.trim() ? "new-field-value-error" : undefined}
          maxLength={4096}
          placeholder="Value"
          value={newValue}
          onChange={(event) => onValueChange(event.target.value)}
          className="value-blend h-8 min-w-0 flex-1 rounded-md px-2 text-sm"
        />
        <button disabled={!newValue.trim()} className="flex h-8 shrink-0 items-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900">
          <PlusIcon /> Add
        </button>
      </form>
      {!newValue.trim() && <p id="new-field-value-error" className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Key entries need a value.</p>}
    </>
  );
}
