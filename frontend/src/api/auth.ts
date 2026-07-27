import client, { parseResponse } from './client';
import { TokenResponseSchema, UserSchema } from '../types/api';

export interface SignupInput {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const signup = (data: SignupInput) =>
  parseResponse(TokenResponseSchema, client.post('/api/auth/signup', data));

export const login = (data: LoginInput) =>
  parseResponse(TokenResponseSchema, client.post('/api/auth/login', data));

export const getMe = () => parseResponse(UserSchema, client.get('/api/auth/me'));
