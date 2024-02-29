import { QueueServiceHandlers } from "@pb/queue/QueueService";
import { queue_service } from "./service";

export const queue_contoller: QueueServiceHandlers = {
  NewFileUploaded: async (req, res) => {
    const response = await queue_service.NewFileUploaded(req.request);
    res(null, response);
  },
  SendForgotPasswordMail: async (req, res) => {},
};
