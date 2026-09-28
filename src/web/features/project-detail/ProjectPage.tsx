import { useEffect, useRef, useState, type FormEvent } from "react";
import { BackIcon, PenIcon } from "../../components/icons";
import { ErrorMessage, iconButtonClass, Layout } from "../../components/layout";
import { api, type Project, type ProjectDetail, type ProjectField } from "../../lib/api";
import { AddFieldForm } from "./AddFieldForm";
import { FieldRow } from "./FieldRow";
import { useFieldKeyboard } from "./useFieldKeyboard";

export function ProjectPage({ id }: { id: string }) {
  const isNew = id === "new";
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(id === "new");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(0);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragTo, setDragTo] = useState<number | null>(null);
  const editNameButton = useRef<HTMLButtonElement>(null);
  const wasEditingName = useRef(false);
  const reordering = useRef(false);

  useEffect(() => {
    if (wasEditingName.current && !editingName) editNameButton.current?.focus();
    wasEditingName.current = editingName;
  }, [editingName]);

  useEffect(() => {
    if (isNew) return;
    void api<{ project: ProjectDetail }>(`/api/projects/${id}`)
      .then((data) => {
        setProject(data.project);
        setName(data.project.name);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load project."));
  }, [id, isNew]);

  const filtering = filter.trim().length > 0;
  const visibleFields =
    project?.fields
      .slice()
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .filter(
        (field) =>
          !filtering ||
          field.field_key.toLocaleLowerCase().includes(filter.toLocaleLowerCase()) ||
          field.field_value.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
      ) ?? [];

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, visibleFields.length - 1)));
  }, [visibleFields.length]);

  async function rename() {
    if (savingName || !name.trim()) return;
    setSavingName(true);
    setNameError("");
    try {
      if (isNew) {
        const data = await api<{ project: Project }>(`/api/projects`, { method: "POST", body: JSON.stringify({ name: name.trim() }) });
        window.location.assign(`/projects/${data.project.id}`);
        return;
      }
      const data = await api<{ project: Project }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
      setProject((current) => (current ? { ...current, name: data.project.name, updated_at: data.project.updated_at } : current));
      setName(data.project.name);
      setEditingName(false);
    } catch (caught) {
      setNameError(caught instanceof Error ? caught.message : "Could not rename project.");
    } finally {
      setSavingName(false);
    }
  }

  function cancelRename() {
    if (savingName) return;
    if (isNew) {
      window.location.assign("/");
      return;
    }
    setName(project?.name ?? "");
    setNameError("");
    setEditingName(false);
  }

  async function addField(event: FormEvent) {
    event.preventDefault();
    if (!project || !newValue.trim()) return;
    try {
      const data = await api<{ field: ProjectField }>(`/api/projects/${id}/fields`, {
        method: "POST",
        body: JSON.stringify({ field_key: newKey, field_value: newValue, position: project.fields.length }),
      });
      setProject((current) => current ? { ...current, fields: [...current.fields, data.field] } : current);
      setNewKey("");
      setNewValue("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add field.");
    }
  }

  function changeField(changed: ProjectField) {
    setProject((current) =>
      current ? { ...current, fields: current.fields.map((field) => (field.id === changed.id ? { ...field, field_key: changed.field_key, field_value: changed.field_value, updated_at: changed.updated_at } : field)) } : current,
    );
  }

  async function persistOrder(orderedVisible: ProjectField[]) {
    if (reordering.current) return;
    const updates = orderedVisible
      .map((field, newPosition) => ({ field, newPosition }))
      .filter(({ field, newPosition }) => field.position !== newPosition);
    if (!updates.length) return;
    reordering.current = true;
    let orderKnown = true;
    try {
      for (const { field, newPosition } of updates) {
        const result = await api<{ field: ProjectField }>(`/api/projects/${id}/fields/${field.id}`, {
          method: "PATCH",
          body: JSON.stringify({ position: newPosition }),
        });
        setProject((current) => current ? {
          ...current,
          fields: current.fields.map((item) => item.id === field.id ? { ...item, position: result.field.position, updated_at: result.field.updated_at } : item),
        } : current);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reorder fields.");
      try {
        const data = await api<{ project: ProjectDetail }>(`/api/projects/${id}`);
        const positions = new Map(data.project.fields.map((field) => [field.id, field.position]));
        setProject((current) => current ? {
          ...current,
          fields: current.fields.map((field) => positions.has(field.id) ? { ...field, position: positions.get(field.id)! } : field),
        } : current);
      } catch {
        orderKnown = false;
        setError("Could not reload field order. Reload the page before reordering fields.");
      }
    } finally {
      reordering.current = !orderKnown;
    }
  }

  function reorderField(from: number, to: number) {
    if (filtering || reordering.current || from === to || from < 0 || to < 0 || from >= visibleFields.length || to >= visibleFields.length) return;
    const next = visibleFields.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const byId = new Map(next.map((f, i) => [f.id, i]));
    setProject((current) => current ? {
      ...current,
      fields: current.fields.map((f) => (byId.has(f.id) ? { ...f, position: byId.get(f.id)! } : f)),
    } : current);
    setSelected(to);
    void persistOrder(next);
  }

  function moveField(index: number, direction: number) {
    reorderField(index, index + direction);
  }

  function clearDrag() {
    setDragFrom(null);
    setDragTo(null);
  }

  function handleDrop(index: number) {
    if (dragFrom !== null) reorderField(dragFrom, index);
    clearDrag();
  }

  async function deleteField(field: ProjectField) {
    if (!project || !window.confirm(`Delete “${field.field_key}”?`)) return;
    try {
      await api(`/api/projects/${id}/fields/${field.id}`, { method: "DELETE" });
      setProject((current) => current ? { ...current, fields: current.fields.filter((item) => item.id !== field.id) } : current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete field.");
    }
  }


  useFieldKeyboard({ visibleFields, selected, setSelected, filtering, moveField });
  return (
    <Layout>
      {isNew || !project ? (
        isNew ? (
          <>
            <div className="mb-2 flex items-center gap-2">
              <a href="/" aria-label="Back to projects" title="Back to projects" className={iconButtonClass()}>
                <BackIcon />
              </a>
              <form
                className="flex min-w-0 flex-1 items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void rename();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    window.location.assign("/");
                  }
                }}
              >
                <input
                  autoFocus
                  aria-label="Project name"
                  required
                  maxLength={200}
                  disabled={savingName}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Project name"
                  className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                />
                <button disabled={savingName || !name.trim()} className="h-8 shrink-0 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900">
                  {savingName ? "Saving…" : "Save"}
                </button>
              </form>
            </div>
            <ErrorMessage message={nameError} />
            <ErrorMessage message={error} />
            <p className="mt-4 text-sm text-neutral-500">Name the project to create it. You can add fields after saving.</p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">{error || "Loading…"}</p>
        )
      ) : (
        <>
          {editingName ? (
            <form
              className="mb-2 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void rename();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRename();
                }
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void rename();
                }
              }}
            >
              <a href="/" aria-label="Back to projects" title="Back to projects" className={iconButtonClass()}>
                <BackIcon />
              </a>
              <input
                autoFocus
                aria-label="Project name"
                required
                maxLength={200}
                disabled={savingName}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-8 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 font-semibold dark:border-neutral-800 dark:bg-neutral-900"
              />
              <button disabled={savingName || !name.trim()} className="h-8 shrink-0 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900">
                {savingName ? "Saving…" : "Save"}
              </button>
              <button type="button" disabled={savingName} onClick={cancelRename} className="h-8 shrink-0 rounded-md px-4 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50">
                Cancel
              </button>
            </form>
          ) : (
            <div className="mb-2 flex items-center gap-2">
              <a href="/" aria-label="Back to projects" title="Back to projects" className={iconButtonClass()}>
                <BackIcon />
              </a>
              <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">{project.name}</h1>
              <button ref={editNameButton} aria-label="Edit project name" title="Edit project name" onClick={() => setEditingName(true)} className={iconButtonClass()}>
                <PenIcon />
              </button>
            </div>
          )}
          <ErrorMessage message={nameError} />
          <ErrorMessage message={error} />
          <div className="mb-2 mt-4 flex items-center justify-between gap-4">
            <h2 className="font-bold tracking-tight">Fields</h2>
            <input
              id="field-search"
              aria-label="Filter fields"
              type="search"
              placeholder="Filter  ( / )"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-8 w-56 min-w-0 rounded-lg border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
          </div>
          <section id="field-list" className="grid gap-2">
            {visibleFields.map((field, index) => (
              <FieldRow
                key={field.id}
                field={field}
                index={index}
                selected={index === selected}
                draggable={!filtering}
                onSelect={setSelected}
                onChanged={changeField}
                onDelete={(item) => void deleteField(item)}
                onDragStart={setDragFrom}
                onDragOver={setDragTo}
                onDragEnd={clearDrag}
                onDrop={handleDrop}
                dropTarget={dragFrom !== null && dragTo === index}
                dragActive={dragFrom !== null}
              />
            ))}
            {visibleFields.length === 0 && <p className="py-6 text-center text-sm text-neutral-500">No fields yet.</p>}
          </section>
          <AddFieldForm
            newKey={newKey}
            newValue={newValue}
            onKeyChange={setNewKey}
            onValueChange={setNewValue}
            onSubmit={addField}
          />
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            Click a value to open or copy. Drag the grip or press Alt+ArrowUp/Alt+ArrowDown to reorder{filtering ? " (disabled while filtering)" : ""}. Keys:{" "}
            <kbd className="rounded border border-neutral-300 px-1 dark:border-neutral-700">j</kbd>/
            <kbd className="rounded border border-neutral-300 px-1 dark:border-neutral-700">k</kbd> select,{" "}
            <kbd className="rounded border border-neutral-300 px-1 dark:border-neutral-700">e</kbd> edit,{" "}
            <kbd className="rounded border border-neutral-300 px-1 dark:border-neutral-700">c</kbd> copy.
          </p>
        </>
      )}
    </Layout>
  );
}
