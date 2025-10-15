import ePub from 'epubjs';

export const extractTextFromEpub = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("Could not read file"));
            }

            try {
                const book = ePub(event.target.result as ArrayBuffer);
                const navigation = await book.loaded.navigation;
                let fullText = '';

                // Sequentially process each chapter/section to maintain order
                for (const item of navigation.toc) {
                    const section = book.section(item.href);
                    if (section) {
                        const loadedSection = await section.load();
                        const contents = loadedSection.querySelector('body');
                        if (contents && contents.textContent) {
                            fullText += contents.textContent.trim() + '\n\n';
                        }
                    }
                }
                
                resolve(fullText);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
};
