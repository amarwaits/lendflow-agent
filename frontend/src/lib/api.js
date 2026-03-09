import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

export const getAuthToken = () => localStorage.getItem("lendflow_admin_token");

export const setAuthToken = (token) => {
  localStorage.setItem("lendflow_admin_token", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("lendflow_admin_token");
};

export const authHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
});

export const decisionBadgeClass = {
  approved: "bg-green-100 text-green-800 border border-green-200",
  rejected: "bg-red-100 text-red-800 border border-red-200",
  review: "bg-amber-100 text-amber-800 border border-amber-200",
};

export const statusBadgeClass = {
  pending_review: "bg-slate-100 text-slate-700 border border-slate-300",
  in_review: "bg-blue-100 text-blue-700 border border-blue-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  auto_approved: "bg-green-100 text-green-700 border border-green-200",
  auto_rejected: "bg-red-100 text-red-700 border border-red-200",
  on_hold: "bg-amber-100 text-amber-700 border border-amber-200",
  overridden: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

export const toCurrency = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
