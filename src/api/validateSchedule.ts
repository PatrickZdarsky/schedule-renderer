import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import eventSchema from "../../schedule-schema/schema/event.schema.json";
import furryEventScheduleSchema from "../../schedule-schema/schema/furry-event-schedule-schema.json";
import hostsSchema from "../../schedule-schema/schema/hosts.schema.json";
import labelsSchema from "../../schedule-schema/schema/labels.schema.json";
import membershipLevelsSchema from "../../schedule-schema/schema/membershipLevels.schema.json";
import roomsSchema from "../../schedule-schema/schema/rooms.schema.json";
import sessionTypesSchema from "../../schedule-schema/schema/sessionTypes.schema.json";
import sessionsSchema from "../../schedule-schema/schema/sessions.schema.json";
import tracksSchema from "../../schedule-schema/schema/tracks.schema.json";
import venuesSchema from "../../schedule-schema/schema/venues.schema.json";
import hostEntitySchema from "../../schedule-schema/schema/entity/host.schema.json";
import labelEntitySchema from "../../schedule-schema/schema/entity/label.schema.json";
import membershipLevelEntitySchema from "../../schedule-schema/schema/entity/membershipLevel.schema.json";
import roomEntitySchema from "../../schedule-schema/schema/entity/room.schema.json";
import sessionEntitySchema from "../../schedule-schema/schema/entity/session.schema.json";
import sessionTypeEntitySchema from "../../schedule-schema/schema/entity/sessionType.schema.json";
import trackEntitySchema from "../../schedule-schema/schema/entity/track.schema.json";
import venueEntitySchema from "../../schedule-schema/schema/entity/venue.schema.json";
import xMetaSchema from "../../schedule-schema/schema/partials/x-meta.schema.json";
import type { ScheduleData } from "../types/schema";

export class ScheduleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleValidationError";
  }
}

const schemaRegistry = [
  xMetaSchema,
  eventSchema,
  hostEntitySchema,
  labelEntitySchema,
  membershipLevelEntitySchema,
  roomEntitySchema,
  sessionEntitySchema,
  sessionTypeEntitySchema,
  trackEntitySchema,
  venueEntitySchema,
  hostsSchema,
  labelsSchema,
  membershipLevelsSchema,
  roomsSchema,
  sessionTypesSchema,
  sessionsSchema,
  tracksSchema,
  venuesSchema,
  furryEventScheduleSchema,
];

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

addFormats(ajv);

for (const schema of schemaRegistry) {
  ajv.addSchema(schema);
}

const validateSchedule = ajv.compile<ScheduleData>(furryEventScheduleSchema) as ValidateFunction<ScheduleData>;

function formatValidationErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return "Unknown schema validation error.";
  }

  return errors
    .map((error) => {
      const path = error.instancePath || "/";
      return `${path} ${error.message ?? "is invalid"}`.trim();
    })
    .join("; ");
}

export function validateScheduleData(payload: unknown): ScheduleData {
  const isValid = validateSchedule(payload);

  if (!isValid) {
    throw new ScheduleValidationError(formatValidationErrors(validateSchedule.errors));
  }

  return payload as ScheduleData;
}
