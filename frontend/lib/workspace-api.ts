import axios from "axios";
import type {
  SummaryData,
  TransactionPayload,
  TransactionsResponse,
} from "./workspace-types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://telkominternproject-production.up.railway.app/api";

export async function getSummary(year: string, search = ""): Promise<SummaryData> {
  const params = new URLSearchParams();
  if (year !== "all") params.set("year", year);
  if (search.trim()) params.set("q", search.trim());
  const query = params.toString();
  const response = await axios.get<SummaryData>(`${API_BASE}/analytics/summary${query ? `?${query}` : ""}`);
  return response.data;
}

export async function getTransactions(
  year: string,
  limit = 50,
  offset = 0,
  search = "",
): Promise<TransactionsResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (year !== "all") params.set("year", year);
  if (search.trim()) params.set("q", search.trim());
  const response = await axios.get<TransactionsResponse>(`${API_BASE}/transactions?${params.toString()}`);
  return response.data;
}

export async function uploadFile(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await axios.post(`${API_BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function createTransaction(payload: TransactionPayload): Promise<void> {
  await axios.post(`${API_BASE}/transactions`, payload);
}

export async function updateTransaction(
  id: number,
  payload: TransactionPayload,
): Promise<void> {
  await axios.put(`${API_BASE}/transactions/${id}`, payload);
}

export async function deleteTransaction(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/transactions/${id}`);
}

export async function sendChatPrompt(prompt: string): Promise<string> {
  const response = await axios.post<{ reply: string }>(`${API_BASE}/chat`, { prompt });
  return response.data.reply;
}
