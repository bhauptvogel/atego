import type { PageLoad } from "./$types";
import Cookies from "js-cookie";
import { goto } from "$app/navigation";
import axios from "axios";

export const load: PageLoad = async ({ params }) => {
  const token = Cookies.get("user");
  if (token == undefined || token.startsWith("guest")) {
    goto("login");
    return null;
  }
  let user = null;
  await axios
    .get(`${import.meta.env.VITE_SOCKET_ADRESS}/account`, {
      headers: {
        token: token,
      },
    })
    .then((res) => {
      user = res;
    })
    .catch((error) => {
      console.error(error);
      Cookies.remove("user"); // if token is expired or not valid
      goto("login");
    });
  return user;
};
