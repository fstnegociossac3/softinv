import { sanitizeAuditValue } from "../src/server/utils/audit-sanitizer";

const result = sanitizeAuditValue({
  name: "Juan",

  password: "NO-DEBE-GUARDARSE",

  nested: {
    accessToken: "TOKEN-SECRETO",

    stock: 20,
  },
});

console.dir(result, {
  depth: null,
});
