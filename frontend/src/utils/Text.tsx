
export const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
        return (
        <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
        >
            {part}
        </a>
        );
    }
    return part;
    });
};

// placeholder function in case we decide to do more processing
export const chatRawToJSX = (text: string) => {
    return linkify(text);
}
