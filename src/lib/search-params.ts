export type AsyncSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function toUrlSearchParams(values: {
  [key: string]: string | string[] | undefined;
}) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry.length > 0) {
          params.append(key, entry);
        }
      });
    }
  });

  return params;
}
