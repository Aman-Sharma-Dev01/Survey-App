import { fetchApi } from './api';

export const chatCodingAI = (payload) => fetchApi('/coding-ai/chat', 'POST', payload, true);
