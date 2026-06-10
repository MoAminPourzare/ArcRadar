export const PROJECT_ID_MAX_LENGTH = 96;

export const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseProjectId(
  value: unknown,
  options: { allowTrim?: boolean } = {},
) {
  if (typeof value !== "string") {
    return null;
  }

  const projectId = options.allowTrim ? value.trim() : value;

  if (!options.allowTrim && projectId !== value.trim()) {
    return null;
  }

  if (
    projectId.length === 0 ||
    projectId.length > PROJECT_ID_MAX_LENGTH ||
    projectId !== projectId.toLowerCase() ||
    !PROJECT_ID_PATTERN.test(projectId)
  ) {
    return null;
  }

  return projectId;
}

export function isValidProjectId(value: unknown) {
  return Boolean(parseProjectId(value));
}
