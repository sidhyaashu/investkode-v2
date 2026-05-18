import { redirect } from "next/navigation";

export default async function StockPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params;
  
  // For now, redirect to concalls or just show a message.
  // The user wants a stock detail page eventually.
  // Let's redirect to a search page or watchlist for now to avoid 404.
  redirect(`/watchlist?search=${symbol}`);
}
