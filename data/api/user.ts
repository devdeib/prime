import { EditUserFormFields } from "@/components/auth/helpers";
import axios from "axios";
import { API_URLS } from "../utils/api.urls";

const USER_URL = API_URLS.users;

export const getUsers = (accessToken?: string) => {
  return axios.get(`${USER_URL}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const getUser = (id: number, accessToken: string) => {
  return axios.get(`${USER_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const updateUser = (
  id: number,
  userPayload: Partial<EditUserFormFields>,
  accessToken: string
) => {
  return axios.patch(`${USER_URL}/${id}`, userPayload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
};
