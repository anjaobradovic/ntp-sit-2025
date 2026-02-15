export type Role = "ADMIN" | "USER";

export type LoginResponse = {
  session_token: string;
};

export type MeResponse = {
  id: number;
  username: string;
  role: Role; 
};
