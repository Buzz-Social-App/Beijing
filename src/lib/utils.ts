import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CloudinaryResult = {
  public_id: string;
  secure_url: string;
  thumbnail_url: string;
};

export type CloudinaryInfo = {
  public_id: string;
  resourceType: string;
  secureUrl: string;
  url: string;
};

export type CloudinaryWidgetResult = {
  event: string;
  info: CloudinaryInfo;
};
