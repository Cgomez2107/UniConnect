import type { ReactNode } from "react";
import type { IRenderContext, FileData } from "./IMessage.js";
import { MessageDecorator } from "./MessageDecorator.js";

export class FileDecorator extends MessageDecorator {
  private readonly file: FileData;

  constructor(wrapper: MessageDecorator, file: FileData) {
    super(wrapper);
    this.file = file;
  }

  getFile(): FileData {
    return this.file;
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      file: this.file,
    };
  }

  render(context?: IRenderContext): ReactNode {
    const inner = this.wrapper.render(context);
    const isImage = this.file.mimeType.startsWith("image/");

    if (isImage) {
      return (
        <>
          {inner}
          <img
            src={this.file.url}
            alt={this.file.filename}
            className="mt-2 rounded max-h-48 w-auto cursor-pointer"
            onClick={() => window.open(this.file.url, "_blank")}
          />
        </>
      );
    }

    return (
      <>
        {inner}
        <div
          className="mt-2 p-3 rounded-lg border border-neutral-300 bg-neutral-50 flex items-center gap-3 cursor-pointer hover:bg-neutral-100"
          onClick={() => window.open(this.file.url, "_blank")}
        >
          <span className="text-2xl">📎</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">
              {this.file.filename}
            </p>
            <p className="text-xs text-neutral-500">{this.file.mimeType}</p>
          </div>
        </div>
      </>
    );
  }
}
