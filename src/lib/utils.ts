import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function formatDateTime(input: Date | string | null | undefined) {
  if (!input) return "Not yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(input));
}

export function formatDate(input: Date | string | null | undefined) {
  if (!input) return "Not yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(input));
}

export function absoluteUrl(pathname: string) {
  return new URL(pathname, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString();
}
