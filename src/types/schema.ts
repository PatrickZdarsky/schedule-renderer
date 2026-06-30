export type LocalizedText = Record<string, string>;

export interface ExternalLink {
  displayName: LocalizedText;
  url: string;
}

export interface SourceMetadata {
  name?: string;
  vendorId?: string;
  appVersion?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface EventMetadata {
  id: string;
  displayName: LocalizedText;
  formattedAddress?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  description?: LocalizedText;
  externalLinks?: ExternalLink[];
  imageThumbnailUrl?: string;
  imageBannerUrl?: string;
  "x-meta"?: Record<string, unknown>;
}

export interface NamedEntity {
  id: string;
  displayName: LocalizedText;
  description?: LocalizedText;
  "x-meta"?: Record<string, unknown>;
}

export interface Venue extends NamedEntity {
  formattedAddress?: string;
}

export interface Room extends NamedEntity {
  venueId: string;
  capacity?: number;
}

export interface Host {
  id: string;
  displayName: string;
  externalLinks?: ExternalLink[];
  imageThumbnailUrl?: string;
  imageBannerUrl?: string;
  "x-meta"?: Record<string, unknown>;
}

export interface SessionTimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  roomIds?: string[];
  hostIds?: string[];
  "x-meta"?: Record<string, unknown>;
}

export interface Session {
  id: string;
  displayName: LocalizedText;
  description?: LocalizedText;
  timeSlots: SessionTimeSlot[];
  typeId?: string;
  trackId?: string;
  labelIds?: string[];
  allowedMembershipLevelIds?: string[];
  minAge?: number;
  ticketed?: boolean;
  imageThumbnailUrl?: string;
  imageBannerUrl?: string;
  externalLinks?: ExternalLink[];
  source?: SourceMetadata;
  "x-meta"?: Record<string, unknown>;
}

export interface ScheduleData {
  schemaVersion: string;
  updatedAt: string;
  source?: SourceMetadata;
  "x-meta"?: Record<string, unknown>;
  event: EventMetadata;
  membershipLevels: NamedEntity[];
  tracks: NamedEntity[];
  sessionTypes: NamedEntity[];
  labels: NamedEntity[];
  venues: Venue[];
  rooms?: Room[];
  hosts: Host[];
  sessions: Session[];
}
