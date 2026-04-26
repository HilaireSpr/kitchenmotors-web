const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function getHealth() {
  const response = await fetch(`${API_URL}/api/v1/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("API health check failed");
  }

  return response.json();
}