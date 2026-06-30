# Furry Event Schedule Schema

A standardized schema for furry event schedule data, enabling interoperability between different furry events and software. This is a fork maintained by BARQ and tailored to events integrating with the BARQ platform.

## Overview

The _Furry Event Schedule Schema_ provides a JSON-based data structure for:

- Event metadata (name, date, location, etc.)
- Membership levels
- Session tracks (e.g., Art, Writing)
- Session types (e.g., Panel, Workshop)
- Labels (e.g., 18+, ticketed, accessibility flags)
- Venues and rooms
- Hosts (panelists, performers, etc.)

## Why Use This Schema?

- **Consistency**: Multiple events or scheduling tools can adopt a shared format.
- **Localization**: Supports i18n with language-specific titles and descriptions.
- **Extensibility**: Includes optional fields like `imageThumbnailUrl`, membership restrictions, min age, etc.
- **Validation**: JSON Schemas are provided in the `schema/` folder to ensure data quality.

## Repository Structure

- **README.md**: This file, explaining the project.
- **LICENSE.txt**: MIT License text.
- **schema/**: JSON Schema files for each data type plus a master schema (`furry-event-schedule-schema.json`).
- **examples/**: Example JSON files (e.g., `advanced-example.json`).
- **docs/**: Additional documentation (field references, usage examples).

## Usage

1. **Clone or download** this repository.
2. **Create** your schedule JSON, adhering to the structure in `advanced-example.json`.
3. **Validate** your schedule file against `schema/furry-event-schedule-schema.json` using a JSON Schema validator such as [AJV](https://ajv.js.org/).

Example (Node.js + AJV):

```bash
pnpm install
pnpm run validate
```

This command will validate all schemas in the `examples` directory. You can place the output of your schema there to test if it is valid.

4. Integrate the resulting JSON into your website or application.

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.
