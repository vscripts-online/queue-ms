import * as grpc from "@grpc/grpc-js";

export function first_value_from_stream<T>(
  stream: grpc.ClientReadableStream<T>
): Promise<T> {
  let _data: any = undefined;

  return new Promise((resolve, reject) => {
    stream.on("data", (data: T) => {
      _data = data;
    });

    stream.on("end", () => resolve(_data as T));
  });
}
