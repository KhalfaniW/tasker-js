export async function postData(url, data = {}) {
  try {
    const response = await fetch(url, {
      method: "POST", // Specify the request method
      headers: {
        "Content-Type": "application/json", // Set content type
      },
      body: JSON.stringify({ data }), // Convert data to JSON string
    });
    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const responseData = await response.json(); // Parse the JSON from the response
    return responseData; // Return the parsed data
  } catch (error) {
    globalThis.sLog("error");
    globalThis.sLog(error.message);
    console.error("There was a problem with the fetch operation:", error);
  }
}
