export function withQuery(endpoint, args, keys) {
    const query = new URLSearchParams();
    for (const key of keys) {
        if (args[key] !== undefined && args[key] !== null && args[key] !== "") {
            query.set(key, String(args[key]));
        }
    }
    const serialized = query.toString();
    return serialized ? `${endpoint}?${serialized}` : endpoint;
}
export function requireConfirm(args, action) {
    if (args.confirm !== true) {
        throw new Error(`Set confirm: true to ${action}.`);
    }
}
export function deletionDisabled(action) {
    return {
        ok: false,
        action,
        error: "Deletion is disabled in the MCP server for security and stability.",
        message: "삭제는 보안 및 안정상의 이유로 MCP 서버에서 실행할 수 없습니다. 웹 애플리케이션의 삭제 화면에서 직접 확인 후 진행해 주세요.",
    };
}
export function omitConfirm(args) {
    const { confirm: _confirm, ...rest } = args;
    return rest;
}
export function requiredString(args, key) {
    const value = args[key];
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`Missing required string argument: ${key}`);
    }
    return value;
}
export function optionalString(args, key) {
    const value = args[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
export function requiredObject(args, key) {
    const value = args[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`Missing required object argument: ${key}`);
    }
    return value;
}
