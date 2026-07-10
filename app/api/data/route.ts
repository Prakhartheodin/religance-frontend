export const dynamic = "force-static";

export async function GET() {
  return new Response(JSON.stringify({ mess: "helloworld" }));
}
