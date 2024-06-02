import { File__Output } from "@pb/file/File";
import { FilePart__Output } from "@pb/file/FilePart";
import { FilePartUpload__Output } from "@pb/queue/FilePartUpload";
import { QueueServiceHandlers } from "@pb/queue/QueueService";
import bytes from "bytes";
import protobufjs from "protobufjs";
import { FILE_PROTO_PATH, QUEUE_PROTO_PATH } from "./constant";
import { file_ms_client } from "./microservices";
import { rabbitmq_channels } from "./rabbitmq";
import { GrpcResponserService } from "./type";
import { first_value_from_stream } from "./util";

const queue_root = protobufjs.loadSync(QUEUE_PROTO_PATH);
const FilePartUpload = queue_root.lookupType("queue.FilePartUpload");

const file_root = protobufjs.loadSync(FILE_PROTO_PATH);
const FilePart = file_root.lookupType("file.FilePart");

export const queue_service: GrpcResponserService<QueueServiceHandlers> = {
  NewFileUploaded: async (data) => {
    const { queue, channel } =
      await rabbitmq_channels.file_part_upload_channel();

    const file = await first_value_from_stream<File__Output>(
      file_ms_client.GetFiles({
        where: { _id: data.value },
        limit: { limit: 1 },
      })
    );

    const seperate_byte = bytes("100mb") - 1;
    const length = Math.ceil(parseInt(file.size) / seperate_byte);
    let offset = 0;
    for (let i = 0; i < length; i++) {
      const payload: FilePartUpload__Output = {
        _id: file._id,
        offset: offset + "",
        size: Math.min(seperate_byte, parseInt(file.size) - offset) + "",
        name: file.name,
      };

      const message = FilePartUpload.fromObject(payload);
      const buffer = FilePartUpload.encode(message).finish() as Buffer;

      console.log("sended to", queue, buffer.length);
      channel.sendToQueue(queue, buffer);
      offset += seperate_byte + 1;
    }

    return { value: true };
  },
  DeleteFile: async (data) => {
    const { queue, channel } = await rabbitmq_channels.delete_file_channel();

    const payload: FilePart__Output = {
      id: data.id,
      name: data.name,
      offset: data.offset,
      owner: data.owner,
      size: data.size,
    };

    const message = FilePart.fromObject(payload);
    const buffer = FilePart.encode(message).finish() as Buffer;

    console.log("sended to", queue, buffer.length);
    const res = channel.sendToQueue(queue, buffer);

    return { value: res };
  },
};
