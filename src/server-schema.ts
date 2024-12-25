import { z } from 'zod';

export const workerMessageSchema = z.object({
    requestType: z.enum(['HTTP']),
    headers: z.any(),
    body: z.any(),
    url: z.string()
});

export const workerMessageReply = z.object({
    data: z.string().optional(),
    error: z.string().optional(),
    error_code: z.enum(['500', '404']).optional(),
})

export type WorkerMessageType = z.infer<typeof workerMessageSchema>;
export type WorkerReplyType = z.infer<typeof workerMessageReply>;