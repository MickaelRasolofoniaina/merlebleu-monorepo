export type ZodIssueLike = {
  path: (string | number | symbol)[];
  message: string;
};

export const buildZodErrorMap = (issues: ZodIssueLike[]): Record<string, string> => {
  return issues.reduce(
    (map, issue) => {
      const key = issue.path
        .filter((part): part is string | number => typeof part !== 'symbol')
        .join('.');
      if (!map[key]) {
        map[key] = issue.message;
      }
      return map;
    },
    {} as Record<string, string>,
  );
};
