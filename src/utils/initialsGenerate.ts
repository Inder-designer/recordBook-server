export const initialsGenerate = (fullName: string): string => {
    const words = fullName.trim().split(/\s+/);

    if (words.length >= 2) {
        // Two or more words -> First letter of first and second word
        return (
            words[0].charAt(0) + words[1].charAt(0)
        ).toUpperCase();
    }
    return words[0].slice(0, 2).toUpperCase();
};