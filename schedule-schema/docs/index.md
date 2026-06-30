# Furry Event Schedule Schema Documentation

This document provides **detailed field references** for each part of the Furry Event Schedule Schema.

---

## Top-Level Keys

- **schemaVersion** (string): The version of this schema (e.g., `"1.0.0"`).
- **updatedAt** (datetime, ISO 8601): Timestamp when the JSON was last updated.
- **source** (object, optional):
  - `name`: Human-readable name of the data source (e.g., `"ConSchedulePro"`).
  - `vendorId`: An internal ID for the data provider.
  - `appVersion`: Version of the software generating the data.
  - `lastModifiedBy`: Username or individual who last modified the data.
  - `lastModifiedAt`: Timestamp when the data was last modified.
- **x-meta** (object, optional): External application-defined metadata. May contain arbitrary keys and values. Ignored by core schema validation.

## event (object)

Represents basic information about the event:

- **id** (string): Unique identifier for the event
- **displayName** (object): Localized dictionary with keys as i18n language codes (e.g., `"en-US"`, `"fr-CA"`).
- **formattedAddress** (string): Address respresented as single string
- **startTime**, **endTime** (datetime): Convention start and end in ISO 8601.
- **timezone** (string): IANA timezone identifier (e.g., `"America/New_York"`).
- **description** (object): Localized descriptions.
- **externalLinks** (array, optional): External links for the event
- **imageThumbnailUrl** (uri, optional): Thumbnail image
- **imageBannerUrl** (uri, optional): Banner image
- **x-meta** (object, optional): External application-defined metadata.

## membershipLevels (array)

A list of membership levels (Attendee, Sponsor, etc.):

- **id** (string): Unique level ID
- **displayName** (object): Localized names.
- **description** (object, optional): Localized descriptions.
- **x-meta** (object, optional): External application-defined metadata.

## tracks (array)

A list of broad subject areas (e.g., Art Track, Writing Track):

- **id** (string): Unique track ID
- **displayName** (object): Localized
- **description** (object, optional): Localized
- **x-meta** (object, optional): External application-defined metadata.

## sessionTypes (array)

High-level categories for sessions (e.g., Panel, Workshop, Meetup):

- **id** (string): Unique session type ID
- **displayName** (object): Localized
- **description** (object, optional): Localized
- **x-meta** (object, optional): External application-defined metadata.

## labels (array)

Additional flags or classifications (e.g., `"Flashing lights"`, `"Loud music"`, `"ASL interpretation"`):

- **id** (string): Unique label ID
- **displayName** (object): Localized
- **description** (object, optional): Localized
- **x-meta** (object, optional): External application-defined metadata.

## venues (array)

Locations where sessions are held:

- **id** (string): Unique venue ID
- **displayName** (object): Localized
- **formattedAddress** (string): Address respresented as single string

## rooms (array)

Rooms where sessions take place, each associated with a venue:

- **id** (string): Unique room ID
- **displayName** (object): Localized room name.
- **venueId** (string): ID of the venue this room belongs to.
- **capacity** (integer, optional): Approximate room capacity.
- **description** (object, optional): Localized
- **x-meta** (object, optional): External application-defined metadata.

## hosts (array)

People or groups who host, present, or perform at sessions:

- **id** (string): Unique host ID
- **displayName** (string)
- **externalLinks** (array, optional): External links for the host
- **imageThumbnailUrl** (uri, optional): Thumbnail image
- **imageBannerUrl** (uri, optional): Banner image
- **x-meta** (object, optional): External application-defined metadata.

## sessions (array)

Schedule entries:

- **id** (string): Unique session ID
- **displayName** (object): Localized
- **description** (object, optional): Localized
- **timeSlots** (array): List of one or more times this session is occurring. Each item must include:
  - `startTime` (datetime, ISO 8601)
  - `endTime` (datetime, ISO 8601)
  - `roomIds` (array of strings): Links to rooms by their `id`.
  - `hostIds` (array of strings): Links to hosts by their `id`.
  - `x-meta` (object, optional): Application-defined metadata per time slot.
- **typeId** (string, optional): Links to an entry in `sessionTypes`.
- **trackId** (string, optional): Links to an entry in `tracks`.
- **labelIds** (array of strings, optional): Links to labels by their `id`
- **allowedMembershipLevelIds** (array of strings, optional): Which membership levels can attend.
- **minAge** (integer, optional): Minimum required age.
- **ticketed** (boolean, optional): If the session requires a separate ticket.
- **imageThumbnailUrl** (uri, optional): Thumbnail image
- **imageBannerUrl** (uri, optional): Banner image
- **externalLinks** (array, optional): External links for the session
- **source** (object, optional): Overridden or additional session-level metadata (similar fields as top-level `source`).
- **x-meta** (object, optional): External application-defined metadata.

---

## Validation

To validate a schedule JSON file against this schema:

1. Install a JSON Schema validator (e.g., [AJV](https://ajv.js.org/)).
2. Run:

```bash
ajv validate -s schema/event-schedule-schema.json -d examples/sampleSchedule.json
```

If it passes with no errors, your file conforms to the Furry Event Schedule Schema!
