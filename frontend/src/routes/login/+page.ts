import Cookies from "js-cookie";
import axios from "axios";
import type { PageLoad } from "./$types";
import { goto } from "$app/navigation";

export const load: PageLoad = async ({ params }) => {
  const token = Cookies.get("user");
  if (token != undefined && !token.startsWith("guest")) {
    await axios
      .get(`${import.meta.env.VITE_SOCKET_ADRESS}/account`, {
        headers: {
          token: token,
        },
      })
      .then((res) => {
        goto("account");
      })
      .catch((error) => {
        console.error(error);
        Cookies.remove("user"); // if token is expired or not valid
      });
  }
  return null;
};
