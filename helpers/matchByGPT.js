const { Configuration, OpenAIApi } = require("openai");
const profilesText = require("./profiles.js");

const prompt = `
Create pairs with the best possible match from the following profiles:
${profilesText}
Start from first person and find for him the best match. Then move to the next person and find for him the best match. Continue until all people are matched.
For each pair write a short description of why they are a good match
`;

const configuration = new Configuration({
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const matchByGPT = async () => {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 2000,
        n: 1,
        stop: null,
        temperature: 0.8,
    });

    return completion.data;
}
