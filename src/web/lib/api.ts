export type Project = { id: number; name: string; created_at: string; updated_at: string };
export type ProjectField = {
  id: number;
  project_id: number;
  field_key: string;
  field_value: string;
  position: number;
  created_at: string;
  updated_at: string;
};
export type ProjectDetail = Project & { fields: ProjectField[] };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("Unauthorized");
  }
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}
