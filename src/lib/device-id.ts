export function getDeviceId() {
  const key = "birrtu-device-id-v1";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}
