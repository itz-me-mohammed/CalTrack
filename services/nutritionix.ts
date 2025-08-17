export async function searchFood(query: string) {
  const res = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-app-id": process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID!,   // Expo public env var
      "x-app-key": process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY!,
      "x-remote-user-id": "0",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    // Try JSON first to extract a message, else fallback to text
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.message || data?.error || JSON.stringify(data);
    } catch {
      detail = await res.text();
    }
    throw new Error(`Nutritionix ${res.status}: ${detail}`);
  }

  return res.json();
}
