export function serializeYText(content: Y.Text) {
    return { content: content.toJSON() };
}

export function deserializeYText(data: any) {
    const yText = new Y.Text();
    if (data?.content) {
        yText.insert(0, data.content);
    }
    return yText;
}