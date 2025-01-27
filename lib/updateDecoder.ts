export class UpdateDecoder {
    private view: DataView;
    private offset: number = 0;

    constructor(private buffer: Uint8Array) {
        this.view = new DataView(buffer.buffer);
    }

    readVarString(): string {
        const length = this.view.getUint32(this.offset);
        this.offset += 4;
        const result = new TextDecoder().decode(
            this.buffer.subarray(this.offset, this.offset + length)
        );
        this.offset += length;
        return result;
    }
}