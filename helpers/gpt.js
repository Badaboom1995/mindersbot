
const { Configuration, OpenAIApi } = require("openai");
const {supabase} = require("../supabase");
const configuration = new Configuration({
    apiKey: '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',
});

const openai = new OpenAIApi(configuration);

const collectHobbies = async () => {

    const hobbies = await supabase
    .from("Users")
    .select("hobbies")

    const hobbiesRaw = hobbies.data.reduce((acc, curr) => {
        if (!curr) return acc
        return [...acc, curr.hobbies]
    }, []).join("")

    // console.log(hobbiesRaw)
    // const completion = await openai.createCompletion({
    //     model: "text-davinci-003",
    //     prompt: `Make a list of hobbies from following string. Remove duplicates and make a clean list of hobbies. The string is ${hobbiesRaw}`,
    //     max_tokens: 2000,
    //     n: 1,
    //     stop: null,
    //     temperature: 0.8,
    // });

    // console.log(completion.data)
    // return completion.data;
}

module.exports = {collectHobbies}