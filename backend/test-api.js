const axios = require("axios");

async function test() {

    const reviews = [
        "The workload is heavy but I learned a lot.",
        "Assignments are difficult.",
        "The lecturer explains concepts clearly.",
        "The final exam is challenging.",
        "Good course overall."
    ];

    try {

        console.log("Sending POST request to local backend...");
        console.log("Target endpoint: http://localhost:3000/api/ai-summary");

        const response = await axios.post(
            "http://localhost:3000/api/ai-summary",
            { reviews }
        );

        console.log("\n===========================");
        console.log("Request successful");
        console.log("===========================");
        console.log(response.data);

    } catch (err) {

        console.log("\n===========================");
        console.log("Request failed");
        console.log("===========================");

        if (err.response) {
            console.log("HTTP Status:", err.response.status);
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }
    }

}

test();