"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerMessageReply = exports.workerMessageSchema = void 0;
const zod_1 = require("zod");
exports.workerMessageSchema = zod_1.z.object({
    requestType: zod_1.z.enum(['HTTP']),
    headers: zod_1.z.any(),
    body: zod_1.z.any(),
    url: zod_1.z.string()
});
exports.workerMessageReply = zod_1.z.object({
    data: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    error_code: zod_1.z.enum(['500', '404']).optional(),
});
