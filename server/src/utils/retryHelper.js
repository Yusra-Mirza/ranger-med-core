export const retryWithBackoff = async (fn, maxAttempts = 3, baseDelay = 1000) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            return await fn();
        }
        catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                throw error;
            }
            let delay = baseDelay * Math.pow(2, attempts - 1);
            console.warn(`Gemini API attempt ${attempts} failed. Retrying in ${delay}ms.....Error: ${error.message}`);

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};