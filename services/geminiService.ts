import { GoogleGenAI, Type } from "@google/genai";
import { LibraryDocument, Subject, Message, JournalEntry, Flashcard, QuizQuestion, MindMapNode } from '../types.ts';
import { stripHtml } from '../utils/textUtils.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const findRelevantDocuments = async (query: string, documents: LibraryDocument[]): Promise<string[]> => {
    const prompt = `From the following list of document titles, identify the most relevant ones for the query "${query}".
    Return a JSON array of the document IDs.
    Documents:
    ${documents.map(d => `- ${d.name} (id: ${d.id})`).join('\n')}
    
    Query: "${query}"
    
    Respond ONLY with a JSON array of document IDs. For example: ["id1", "id2"]`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        const jsonText = response.text.trim();
        const ids = JSON.parse(jsonText);
        return Array.isArray(ids) ? ids : [];
    } catch (error) {
        console.error("AI search failed:", error);
        return [];
    }
};

export const summarizeNotes = async (notes: string): Promise<string> => {
    const prompt = `Resuma o texto a seguir em um parágrafo conciso, em Português. Foque nos conceitos-chave e nas ideias principais.
    
    Texto:
    ---
    ${notes.substring(0, 30000)}
    ---
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateIntroFromTheme = async (theme: string): Promise<string> => {
    const prompt = `Gere uma introdução concisa, em um único parágrafo e em Português, para o seguinte tema: "${theme}". A introdução deve ser bem escrita e fornecer um ponto de partida sólido para alguém que estuda este tópico.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const summarizeWebPage = async (url: string): Promise<{ title: string, summary: string }> => {
    const prompt = `
    Analyze the content of the article at the provided URL. Your task is to:
    1.  Create a suitable and concise title for the article.
    2.  Write a comprehensive summary of the main points in Portuguese.
    
    URL: "${url}"
    
    Ignore ads, navigation, footers, and other non-essential content. Focus only on the main article body.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The generated title for the article." },
                        summary: { type: Type.STRING, description: "The concise summary of the article in Portuguese." }
                    },
                    required: ["title", "summary"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result.title && result.summary) {
            return result;
        }
        throw new Error("Invalid JSON structure from AI.");
    } catch (error) {
        console.error("Error summarizing web page:", error);
        return { 
            title: "Artigo da Web", 
            summary: "Não foi possível gerar um resumo para este link. O conteúdo pode ser inacessível ou estar em um formato incompatível." 
        };
    }
};

// Note: This is a placeholder as direct transcription is not feasible client-side.
// We use a third-party service to get the video title, then generate a summary.
export const summarizeYouTubeVideo = async (url: string): Promise<{ title: string, summary: string }> => {
    try {
        // Use a more reliable CORS proxy to fetch the YouTube video page HTML to extract the title.
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const title = doc.querySelector('title')?.textContent || 'Untitled Video';
        
        const summaryPrompt = `Gere um resumo conciso e os principais pontos de aprendizado em Português para um vídeo do YouTube intitulado "${title}". Foque no que um estudante provavelmente precisaria saber.`;
        
        const genAIResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: summaryPrompt
        });
        
        return { title: title.replace(' - YouTube', ''), summary: genAIResponse.text };

    } catch (error) {
        console.error("Error summarizing YouTube video:", error);
        return { title: "Unknown Video", summary: "Could not generate a summary for this video. Please check the link or try another." };
    }
};

export const generateStudyPlan = async (subjectName: string): Promise<string> => {
    const prompt = `Crie um plano de estudos estruturado e formatado em markdown, em Português, para a disciplina "${subjectName}". O plano deve ser dividido em seções ou módulos lógicos, com pontos de marcador para os principais tópicos a serem estudados em cada seção. Mantenha-o conciso e prático.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const streamAICompanionResponse = async (
    userName: string,
    history: Message[],
    journalEntries: JournalEntry[],
    documents: LibraryDocument[],
    subjects: Subject[]
) => {
    const journalContext = journalEntries.slice(0, 2).map(j => `On ${j.date}, I felt ${j.mood} and wrote about: ${j.title}`).join('\n');
    const libraryContext = documents.slice(0, 5).map(d => d.name).join(', ');
    const subjectContext = subjects.slice(0, 5).map(s => s.name).join(', ');

    const systemInstruction = `Você é Psique, um companheiro de IA amigável e perspicaz. Seu objetivo é ajudar o usuário, ${userName}, com auto-reflexão, aprendizado e crescimento pessoal. Responda sempre em Português.
    - Seja empático, solidário e atencioso.
    - Você tem acesso a alguns dados do usuário para contexto.
    - Humores/títulos recentes do diário: ${journalContext || 'Nenhum'}
    - Documentos da biblioteca: ${libraryContext || 'Nenhum'}
    - Disciplinas de estudo: ${subjectContext || 'Nenhum'}
    - Use este contexto para fornecer conversas personalizadas e relevantes. Não mencione explicitamente que você tem esse contexto.
    - Responda em formato Markdown.`;

    const contents = history.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction
        }
    });

    return responseStream;
};

export const streamSubjectChatResponse = async (
    subjectName: string,
    studyContext: string,
    history: Message[],
) => {

    const systemInstruction = `Você é um assistente de estudo focado na disciplina: "${subjectName}".
    Sua ÚNICA fonte de informação é o contexto fornecido abaixo. Responda sempre em Português.
    Não use nenhum conhecimento externo. Se a resposta não estiver no contexto, diga que não consegue encontrar a informação no material fornecido.
    
    Study Material Context:
    ---
    ${studyContext.substring(0, 30000)}
    ---`;
    
    const contents = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction
        }
    });

    return responseStream;
};

export const answerFromSubjects = async (query: string, subjects: Subject[]): Promise<string> => {
    const context = subjects.map(s => `Subject: ${s.name}\nNotes:\n${s.topics.map(t => t.content).join('\n---\n')}`).join('\n\n');
    
    const prompt = `Você é um assistente de estudo prestativo. Responda à pergunta do usuário baseando-se *apenas* no contexto fornecido de suas anotações de estudo. Responda em Português.
    Se a resposta não estiver no contexto, afirme isso claramente.
    
    Context:
    ---
    ${context.substring(0, 30000)}
    ---
    
    Question: ${query}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateFlashcards = async (studyContext: string): Promise<Flashcard[]> => {
    const prompt = `Com base no material de estudo a seguir, gere de 10 a 15 flashcards de alta qualidade em Português.
    Cada flashcard deve ter uma 'frente' (uma pergunta ou um termo) e um 'verso' (a resposta ou definição).
    As perguntas devem ser claras e testar os conceitos-chave do material.
    
    Study Material:
    ---
    ${studyContext.substring(0, 30000)}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING, description: "The front of the flashcard (question/term)." },
                        back: { type: Type.STRING, description: "The back of the flashcard (answer/definition)." }
                    },
                    required: ["front", "back"]
                }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const flashcards = JSON.parse(jsonText);
        return Array.isArray(flashcards) ? flashcards : [];
    } catch (e) {
        console.error("Failed to parse flashcards JSON", e);
        return [];
    }
};

export const generateQuiz = async (studyContext: string): Promise<QuizQuestion[]> => {
    const prompt = `Com base no material de estudo a seguir, gere um quiz de múltipla escolha com 5 a 8 perguntas em Português.
    Cada pergunta deve ter exatamente 4 opções, e uma delas deve ser a resposta correta.
    
    Study Material:
    ---
    ${studyContext.substring(0, 30000)}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: "The quiz question." },
                        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 possible answers." },
                        correctAnswer: { type: Type.STRING, description: "The correct answer, which must be one of the options." }
                    },
                    required: ["question", "options", "correctAnswer"]
                }
            }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const questions = JSON.parse(jsonText);
        if (Array.isArray(questions)) {
            // Add more robust filtering to ensure data quality from the AI
            return questions.filter(q => 
                q &&
                q.options &&
                Array.isArray(q.options) &&
                q.options.length === 4 &&
                q.correctAnswer &&
                q.options.includes(q.correctAnswer)
            );
        }
        return [];
    } catch (e) {
        console.error("Failed to parse quiz JSON", e);
        return [];
    }
};


export const generateMindMap = async (studyContext: string, subjectName: string): Promise<MindMapNode> => {
    const prompt = `Analise o seguinte material de estudo sobre "${subjectName}" e gere uma estrutura de mapa mental hierárquico em Português.
    O nó raiz deve ser o tópico principal. Crie ramos para os conceitos principais e sub-ramos para os detalhes de suporte.
    Mantenha os tópicos concisos (2-5 palavras). A profundidade máxima da árvore deve ser 4.
    
    Study Material:
    ---
    ${studyContext.substring(0, 30000)}
    ---
    `;

    // FIX: Define a non-recursive schema by unrolling to a fixed depth to prevent stack overflow.
    // The model will treat the `children` property as optional if not in `required`.
    const nodeProperties = {
        topic: { type: Type.STRING, description: "O tópico conciso para este nó." },
    };

    const mindMapNodeSchemaL3 = {
        type: Type.OBJECT,
        properties: nodeProperties, // No children for the deepest level
        required: ["topic"],
    };
    
    const mindMapNodeSchemaL2 = {
        type: Type.OBJECT,
        properties: {
            ...nodeProperties,
            children: { type: Type.ARRAY, items: mindMapNodeSchemaL3, description: "Nós filhos para este tópico." }
        },
        required: ["topic"],
    };

    const mindMapNodeSchemaL1 = {
        type: Type.OBJECT,
        properties: {
            ...nodeProperties,
            children: { type: Type.ARRAY, items: mindMapNodeSchemaL2, description: "Nós filhos para este tópico." }
        },
        required: ["topic"],
    };

    const mindMapSchema = {
        type: Type.OBJECT,
        properties: {
            ...nodeProperties,
            children: { type: Type.ARRAY, items: mindMapNodeSchemaL1, description: "Nós filhos para este tópico." }
        },
        required: ["topic"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mindMapSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        const mindMap = JSON.parse(jsonText);
        // Basic validation
        if (mindMap && typeof mindMap.topic === 'string') {
            return mindMap;
        }
        throw new Error("Invalid mind map structure received.");
    } catch (e) {
        console.error("Failed to parse mind map JSON", e);
        return { topic: "Erro ao gerar o mapa mental", children: [] };
    }
};


export const elaborateOnTopic = async (textToElaborate: string, subjectName: string): Promise<string> => {
    const prompt = `Você é um tutor especialista. Elabore o seguinte texto/tópico no contexto da disciplina "${subjectName}". 
    Forneça uma explicação detalhada, clara e aprofundada em Português. Use analogias e exemplos práticos para facilitar o entendimento.
    Formate a sua resposta em markdown.

    Texto para Elaborar:
    ---
    ${textToElaborate.substring(0, 15000)}
    ---
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateCriticalQuestions = async (studyContext: string): Promise<string> => {
    const prompt = `Com base no material de estudo a seguir, gere 5 a 7 perguntas socráticas ou de pensamento crítico em Português.
    Estas perguntas não devem ter respostas simples de "sim" ou "não", mas sim encorajar uma reflexão mais profunda sobre o tema.
    Formate as perguntas como uma lista numerada em markdown.

    Material de Estudo:
    ---
    ${studyContext.substring(0, 30000)}
    ---
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};

export const generateTopicsFromSummary = async (summary: string, title: string): Promise<string[]> => {
    const prompt = `Com base no resumo a seguir de um documento intitulado "${title}", gere uma lista de 3 a 5 tópicos ou seções principais para uma disciplina de estudo.
    Os tópicos devem ser concisos e lógicos, representando as áreas-chave do conteúdo.

    Resumo:
    ---
    ${summary.substring(0, 15000)}
    ---
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Uma lista de 3 a 5 nomes de tópicos concisos."
                    }
                },
                required: ["topics"]
            }
        }
    });
    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.topics && Array.isArray(result.topics) ? result.topics : [];
    } catch (e) {
        console.error("Failed to parse topics from summary", e);
        return [];
    }
};

export const generateJournalReflection = async (entries: JournalEntry[]): Promise<string> => {
    const prompt = `Você é um psicólogo compassivo e perspicaz chamado Psique. Seu objetivo é ajudar o usuário a refletir sobre suas anotações no diário da última semana.
    Analise as seguintes entradas do diário. NÃO forneça conselhos médicos ou diagnósticos. Mantenha um tom de apoio e encorajamento.
    Responda em Português e use o formato markdown.

    Sua análise deve incluir:
    1.  **Temas Recorrentes:** Identifique 2-3 temas ou assuntos principais que apareceram nas anotações.
    2.  **Padrões de Humor:** Comente sobre quaisquer padrões ou mudanças no humor registrado.
    3.  **Sugestão para Reflexão:** Termine com uma única pergunta gentil e aberta para encorajar uma reflexão mais profunda, baseada na sua análise.

    Entradas do Diário:
    ---
    ${entries.map(e => `Data: ${new Date(e.date).toLocaleDateString('pt-BR')}\nHumor: ${e.mood}\nTítulo: ${e.title}\nConteúdo: ${stripHtml(e.content).substring(0, 500)}...\n`).join('\n---\n')}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};