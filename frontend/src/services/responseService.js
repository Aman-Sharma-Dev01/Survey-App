import { fetchApi } from "./api";

export const getPublicSurvey = async (surveyId) =>
  fetchApi(`/responses/public/${surveyId}`, "GET", null, false);

export const submitAnonymousResponse = async (surveyId, answers) =>
  fetchApi(`/responses/${surveyId}`, "POST", { answers }, false);

export const getSurveyAnalysis = async (surveyId) =>
  fetchApi(`/responses/analysis/${surveyId}`, "GET", null, true);

export const getPublicSharedResults = async (surveyId) =>
  fetchApi(`/responses/share/${surveyId}`, "GET", null, false);

export const exportSurveyCSV = (surveyId, redirectPath = `#/analysis/${surveyId}`) => {
  const baseURL = "https://survey-app-e5xz.onrender.com/api";
  const token = localStorage.getItem("token");

  const downloadURL = `${baseURL}/responses/export/${surveyId}?token=${token}`;

  // Create hidden link
  const link = document.createElement("a");
  link.href = downloadURL;
  link.setAttribute("download", "responses.csv");
  document.body.appendChild(link);

  // Start the download
  link.click();
  link.remove();

  // Redirect after short delay
  setTimeout(() => {
    window.location.hash = redirectPath;
  }, 500);
};
