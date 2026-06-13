import type { ITransport } from "../transport/index.js";
import type { SendChatbotMessageRequest, SendChatbotMessageResponse } from "@uniconnect/shared-types";
export interface ChatbotClientOptions {
    signal?: AbortSignal;
}
export declare class ChatbotClient {
    private transport;
    constructor(transport: ITransport);
    sendMessage(request: SendChatbotMessageRequest, options?: ChatbotClientOptions): Promise<SendChatbotMessageResponse>;
}
//# sourceMappingURL=ChatbotClient.d.ts.map