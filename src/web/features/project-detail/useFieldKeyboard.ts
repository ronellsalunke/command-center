import { useEffect } from "react";
import { copyText } from "../../lib/clipboard";
import type { ProjectField } from "../../lib/api";

export function useFieldKeyboard({
  visibleFields,
  selected,
  setSelected,
  filtering,
  moveField,
}: {
  visibleFields: ProjectField[];
  selected: number;
  setSelected: (update: (selected: number) => number) => void;
  filtering: boolean;
  moveField: (index: number, direction: number) => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        document.getElementById("field-search")?.focus();
        return;
      }
      if (typing) return;
      if (!visibleFields.length) return;
      if (event.altKey && !event.ctrlKey && !event.metaKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        if (filtering) return;
        event.preventDefault();
        const focusedId = target?.closest<HTMLElement>("[data-field-id]")?.dataset.fieldId;
        const index = focusedId ? visibleFields.findIndex((field) => String(field.id) === focusedId) : selected;
        moveField(index, event.key === "ArrowUp" ? -1 : 1);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "j") setSelected((value) => (value + 1) % visibleFields.length);
      if (event.key === "k") setSelected((value) => (value - 1 + visibleFields.length) % visibleFields.length);
      if (event.key === "c") void copyText(visibleFields[selected]?.field_value ?? "");
      if (event.key === "e") {
        document.querySelectorAll("#field-list .kv-row")[selected]?.querySelector<HTMLButtonElement>('button[title^="Edit"]')?.click();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filtering, moveField, selected, setSelected, visibleFields]);
}
