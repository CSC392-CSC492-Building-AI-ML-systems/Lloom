import Papa from "papaparse";
import { csvOptions, csvValidator, validateJson } from "./validation";
import type { ValidationResult } from "./validation";

self.onmessage = async (event: MessageEvent<File>) => {
    const file = event.data;
    const send = (result: ValidationResult) => self.postMessage(result);
    try {
        if (/\.json$/i.test(file.name)) {
            const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
            send(validateJson(text));
        } else {
            const validator = csvValidator();
            Papa.parse<string[]>(file, {
                ...csvOptions,
                chunkSize: 256 * 1024,
                chunk: (result) => validator.consume(result.data, result.errors),
                complete: () => send(validator.finish()),
                error: () =>
                    send({
                        status: "Error",
                        message: "Unable to read CSV file. Try selecting it again.",
                    }),
            });
        }
    } catch {
        send({
            status: "Error",
            message: "Unable to read file as UTF-8. Check its encoding and try again.",
        });
    }
};
