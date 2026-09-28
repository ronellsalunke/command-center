import { useEffect, useRef, useState } from "react";
import { CopyIcon, GripIcon, PenIcon, TrashIcon } from "../../components/icons";
import { deleteButtonClass, ErrorMessage, iconButtonClass } from "../../components/layout";
import { api, type ProjectField } from "../../lib/api";
import { copyText } from "../../lib/clipboard";
import { safeLink } from "../../lib/links";

export function FieldRow({
  field,
  index,
  selected,
  draggable,
  onSelect,
  onChanged,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  dropTarget,
  dragActive,
}: {
  field: ProjectField;
  index: number;
  selected: boolean;
  draggable: boolean;
  onSelect: (index: number) => void;
  onChanged: (field: ProjectField) => void;
  onDelete: (field: ProjectField) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  dropTarget: boolean;
  dragActive: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState(field.field_key);
  const [value, setValue] = useState(field.field_value);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  const link = safeLink(field.field_value);

  useEffect(() => {
    if (wasEditing.current && !editing) editButton.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  useEffect(() => {
    setKey(field.field_key);
    setValue(field.field_value);
  }, [field.field_key, field.field_value]);

  async function save() {
    if (saving || !value.trim()) return;
    if (key.trim() === field.field_key && value === field.field_value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await api<{ field: ProjectField }>(`/api/projects/${field.project_id}/fields/${field.id}`, {
        method: "PATCH",
        body: JSON.stringify({ field_key: key.trim(), field_value: value }),
      });
      onChanged(data.field);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save field.");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (await copyText(field.field_value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  }

  async function openOrCopy() {
    if (link) window.open(link, "_blank", "noreferrer");
    else await copy();
  }

  function cancelEdit() {
    if (saving) return;
    setKey(field.field_key);
    setValue(field.field_value);
    setEditing(false);
  }

  if (editing) {
    return (
      <article
        className="kv-row rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
          }
        }}
      >
        <div className="field-editor flex items-center gap-2">
          <input
            autoFocus
            aria-label="Field key"
            disabled={saving}
            required
            maxLength={100}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void save();
            }}
            placeholder="Key"
            className="h-8 w-40 shrink-0 rounded-md border border-neutral-200 bg-white px-2 text-sm font-medium dark:border-neutral-800 dark:bg-neutral-950"
          />
          <input
            aria-label="Field value"
            disabled={saving}
            aria-invalid={!value.trim()}
            aria-describedby={!value.trim() ? `field-value-error-${field.id}` : undefined}
            maxLength={4096}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void save();
            }}
            placeholder="Value"
            className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
          />
          <button
            onClick={() => void save()}
            disabled={saving || !value.trim()}
            className="h-8 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            disabled={saving}
            onClick={cancelEdit}
            className="h-8 rounded-md px-4 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          >
            Cancel
          </button>
        </div>
        {!value.trim() && <p id={`field-value-error-${field.id}`} className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Key entries need a value.</p>}
        <ErrorMessage message={error} />
      </article>
    );
  }

  return (
    <article
      data-field-id={field.id}
      className={`kv-row field-display flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900${selected ? " selected" : ""}${dropTarget ? " drop-target" : ""}`}
      onClick={() => onSelect(index)}
      onDragOver={(event) => {
        event.preventDefault();
        if (!draggable || !dragActive) {
          event.dataTransfer.dropEffect = "none";
          return;
        }
        onDragOver(index);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (!draggable || !dragActive) return;
        onDrop(index);
      }}
    >
      <span
        draggable={draggable}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", String(field.id));
          onDragStart(index);
        }}
        onDragEnd={onDragEnd}
        title={draggable ? "Drag to reorder" : "Filter active — reorder disabled"}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-600 dark:text-neutral-300 ${draggable ? "cursor-grab hover:bg-neutral-100 active:cursor-grabbing dark:hover:bg-neutral-800 dark:hover:text-neutral-50" : "cursor-not-allowed opacity-40"}`}
      >
        <GripIcon />
      </span>
      <span className="w-36 shrink-0 truncate text-sm font-medium text-neutral-700 dark:text-neutral-300" title={field.field_key}>
        {field.field_key}
      </span>
      <button
        onClick={() => void openOrCopy()}
        title={link ? `Open ${link}` : "Click to copy"}
        className="field-value h-8 min-w-0 flex-1 truncate rounded-md px-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <span className={link ? "underline decoration-neutral-300 underline-offset-2" : ""}>{field.field_value || "—"}</span>
      </button>
      <span className="row-actions flex shrink-0 items-center gap-2">
        <button ref={editButton} type="button" onClick={() => setEditing(true)} title="Edit (e)" aria-label={`Edit ${field.field_key}`} className={iconButtonClass()}>
          <PenIcon />
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          title="Copy (c)"
          aria-label={`Copy ${field.field_key}`}
          className={iconButtonClass()}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <CopyIcon />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(field)}
          title="Delete"
          aria-label={`Delete ${field.field_key}`}
          className={deleteButtonClass}
        >
          <TrashIcon />
        </button>
      </span>
    </article>
  );
}
