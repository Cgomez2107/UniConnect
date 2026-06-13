export class ChatbotClient {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    async sendMessage(request, options) {
        const response = await this.transport.request({
            method: "POST",
            url: "/chatbot/message",
            body: request.body,
            signal: options?.signal,
        });
        return response.data;
    }
}
//# sourceMappingURL=ChatbotClient.js.map