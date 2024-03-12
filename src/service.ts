import { File__Output } from "@pb/file/File";
import { FilePartUpload__Output } from "@pb/queue/FilePartUpload";
import { QueueServiceHandlers } from "@pb/queue/QueueService";
import bytes from "bytes";
import protobufjs from "protobufjs";
import { QUEUE_PROTO_PATH } from "./constant";
import { file_ms_client } from "./microservices";
import { rabbitmq_channels } from "./rabbitmq";
import { GrpcResponserService } from "./type";
import { first_value_from_stream } from "./util";
import { ForgotPasswordMail__Output } from "@pb/queue/ForgotPasswordMail";

const queue_root = protobufjs.loadSync(QUEUE_PROTO_PATH);
const FilePartUpload = queue_root.lookupType("queue.FilePartUpload");
const ForgotPasswordMail = queue_root.lookupType("queue.ForgotPasswordMail");

export const queue_service: GrpcResponserService<QueueServiceHandlers> = {
  NewFileUploaded: async (data) => {
    const { queue, channel } =
      await rabbitmq_channels.file_part_upload_channel();

    const get_files_stream = file_ms_client.GetFiles({
      where: { _id: data.value },
      limit: { limit: 1 },
    });

    const file = await first_value_from_stream<File__Output>(get_files_stream);
    const seperate_byte = bytes("100mb");
    const length = Math.ceil(file.size / seperate_byte);
    let offset = 0;
    for (let i = 0; i < length; i++) {
      const payload: FilePartUpload__Output = {
        _id: file._id,
        offset,
        size: Math.min(seperate_byte, file.size - offset),
        name: file.name,
      };

      const message = FilePartUpload.fromObject(payload);
      const buffer = FilePartUpload.encode(message).finish() as Buffer;

      console.log("sended to", queue, buffer.length);
      channel.sendToQueue(queue, buffer);
      offset += seperate_byte;
    }

    return { value: true };
  },
  SendForgotPasswordMail: async (data) => {
    const { queue, channel } =
      await rabbitmq_channels.forgot_password_mail_channel();

    const payload: ForgotPasswordMail__Output = {
      id: data.id,
      code: data.code,
      email: data.email,
    };
    const message = ForgotPasswordMail.fromObject(payload);
    const buffer = ForgotPasswordMail.encode(message).finish() as Buffer;

    console.log("sended to", queue, buffer.length);
    const res = channel.sendToQueue(queue, buffer);

    return { value: res };
  },
};
