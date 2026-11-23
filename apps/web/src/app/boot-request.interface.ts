export interface BootRequest {
  url: URL;
  cookie: string | null;
  timeZone: string;
  publicUrl: string;
  acceptLanguage?: string | null;
  now?: Date;
}
