import type { ApiUser } from "@/data/types/auth";
import type { User } from "@/data/model/user";

export const setProfileFormValue = (
  setValue: CallableFunction,
  user: ApiUser | User
) => {
  setValue("first_name", user.first_name);
  setValue("last_name", user.last_name);
  setValue("email", user.email);
  setValue("phone", user.phone);
  setValue("password", "");
  if ("role" in user && user.role != null) {
    setValue("role", user.role);
  }
};